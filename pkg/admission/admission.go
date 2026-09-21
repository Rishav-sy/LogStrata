package admission

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/Rishav-sy/LogStrata/pkg/controller"
)

// K8s AdmissionReview request/response structures according to admission.k8s.io/v1
type AdmissionReview struct {
	APIVersion string            `json:"apiVersion"`
	Kind       string            `json:"kind"`
	Request    *AdmissionRequest  `json:"request,omitempty"`
	Response   *AdmissionResponse `json:"response,omitempty"`
}

type AdmissionRequest struct {
	UID       string          `json:"uid"`
	Kind      GroupVersionKind `json:"kind"`
	Resource  GroupVersionResource `json:"resource"`
	SubResource string        `json:"subResource,omitempty"`
	Name      string          `json:"name"`
	Namespace string          `json:"namespace"`
	Operation string          `json:"operation"`
	Object    json.RawMessage `json:"object,omitempty"`
	OldObject json.RawMessage `json:"oldObject,omitempty"`
}

type GroupVersionKind struct {
	Group   string `json:"group"`
	Version string `json:"version"`
	Kind    string `json:"kind"`
}

type GroupVersionResource struct {
	Group    string `json:"group"`
	Version  string `json:"version"`
	Resource string `json:"resource"`
}

type AdmissionResponse struct {
	UID       string        `json:"uid"`
	Allowed   bool          `json:"allowed"`
	Status    *StatusResult `json:"status,omitempty"`
	Patch     string        `json:"patch,omitempty"`
	PatchType *string       `json:"patchType,omitempty"`
}

type StatusResult struct {
	Code    int    `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}

// JSONPatchOperation defines an RFC 6902 JSON patch op
type JSONPatchOperation struct {
	Op    string      `json:"op"`
	Path  string      `json:"path"`
	Value interface{} `json:"value,omitempty"`
}

// LogAutoscalerPolicyCRD models the expected CRD object
type LogAutoscalerPolicyCRD struct {
	APIVersion string                           `json:"apiVersion"`
	Kind       string                           `json:"kind"`
	Metadata   map[string]interface{}           `json:"metadata"`
	Spec       controller.LogAutoscalerPolicySpec `json:"spec"`
}

// WebhookServer manages admission webhook requests
type WebhookServer struct {
	Mux *http.ServeMux
}

// NewWebhookServer creates an initialized WebhookServer with HTTP handlers
func NewWebhookServer() *WebhookServer {
	ws := &WebhookServer{
		Mux: http.NewServeMux(),
	}
	ws.registerRoutes()
	return ws
}

func (ws *WebhookServer) registerRoutes() {
	ws.Mux.HandleFunc("/healthz", ws.handleHealthz)
	ws.Mux.HandleFunc("/validate", ws.handleValidate)
	ws.Mux.HandleFunc("/mutate", ws.handleMutate)
}

func (ws *WebhookServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ws.Mux.ServeHTTP(w, r)
}

func (ws *WebhookServer) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK\n"))
}

func (ws *WebhookServer) handleValidate(w http.ResponseWriter, r *http.Request) {
	review, err := parseAdmissionReview(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid admission review: %v", err), http.StatusBadRequest)
		return
	}

	resp := ws.validate(review.Request)
	review.Response = resp

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(review)
}

func (ws *WebhookServer) handleMutate(w http.ResponseWriter, r *http.Request) {
	review, err := parseAdmissionReview(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid admission review: %v", err), http.StatusBadRequest)
		return
	}

	resp := ws.mutate(review.Request)
	review.Response = resp

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(review)
}

func parseAdmissionReview(r *http.Request) (*AdmissionReview, error) {
	if r.Method != http.MethodPost {
		return nil, fmt.Errorf("method %s not allowed, must be POST", r.Method)
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read body: %w", err)
	}
	defer r.Body.Close()

	var review AdmissionReview
	if err := json.Unmarshal(body, &review); err != nil {
		return nil, fmt.Errorf("failed to unmarshal AdmissionReview: %w", err)
	}

	if review.Request == nil {
		return nil, fmt.Errorf("admission request is nil")
	}

	return &review, nil
}

// validate performs semantic validation on LogAutoscalerPolicy objects
func (ws *WebhookServer) validate(req *AdmissionRequest) *AdmissionResponse {
	resp := &AdmissionResponse{
		UID:     req.UID,
		Allowed: true,
	}

	if len(req.Object) == 0 {
		return resp
	}

	var policy LogAutoscalerPolicyCRD
	if err := json.Unmarshal(req.Object, &policy); err != nil {
		resp.Allowed = false
		resp.Status = &StatusResult{
			Code:    http.StatusBadRequest,
			Message: fmt.Sprintf("failed to unmarshal LogAutoscalerPolicy: %v", err),
		}
		return resp
	}

	// Semantic validations
	var errs []string

	if strings.TrimSpace(policy.Spec.ScaleTargetRef.Name) == "" {
		errs = append(errs, "spec.scaleTargetRef.name cannot be empty")
	}

	validKinds := map[string]bool{"Deployment": true, "StatefulSet": true, "Rollout": true}
	if !validKinds[policy.Spec.ScaleTargetRef.Kind] {
		errs = append(errs, fmt.Sprintf("spec.scaleTargetRef.kind '%s' is invalid, must be one of: Deployment, StatefulSet, Rollout", policy.Spec.ScaleTargetRef.Kind))
	}

	if policy.Spec.MinReplicas < 1 {
		errs = append(errs, "spec.minReplicas must be at least 1")
	}

	if policy.Spec.MaxReplicas < policy.Spec.MinReplicas {
		errs = append(errs, fmt.Sprintf("spec.maxReplicas (%d) must be greater than or equal to spec.minReplicas (%d)", policy.Spec.MaxReplicas, policy.Spec.MinReplicas))
	}

	if policy.Spec.TargetRPSPerPod <= 0 {
		errs = append(errs, "spec.targetRPSPerPod must be greater than 0")
	}

	if policy.Spec.HeadroomFactor < 1.0 || policy.Spec.HeadroomFactor > 5.0 {
		errs = append(errs, fmt.Sprintf("spec.headroomFactor (%.2f) must be between 1.0 and 5.0", policy.Spec.HeadroomFactor))
	}

	if len(errs) > 0 {
		resp.Allowed = false
		resp.Status = &StatusResult{
			Code:    http.StatusUnprocessableEntity,
			Message: strings.Join(errs, "; "),
		}
	}

	return resp
}

// mutate applies production-grade defaults to empty or missing fields
func (ws *WebhookServer) mutate(req *AdmissionRequest) *AdmissionResponse {
	resp := &AdmissionResponse{
		UID:     req.UID,
		Allowed: true,
	}

	if len(req.Object) == 0 {
		return resp
	}

	var rawMap map[string]interface{}
	if err := json.Unmarshal(req.Object, &rawMap); err != nil {
		resp.Allowed = false
		resp.Status = &StatusResult{
			Code:    http.StatusBadRequest,
			Message: fmt.Sprintf("failed to unmarshal JSON: %v", err),
		}
		return resp
	}

	spec, ok := rawMap["spec"].(map[string]interface{})
	if !ok || spec == nil {
		spec = make(map[string]interface{})
	}

	var patches []JSONPatchOperation

	// 1. MinReplicas default
	if _, exists := spec["minReplicas"]; !exists {
		patches = append(patches, JSONPatchOperation{
			Op:    "add",
			Path:  "/spec/minReplicas",
			Value: 1,
		})
	}

	// 2. MaxReplicas default
	if _, exists := spec["maxReplicas"]; !exists {
		patches = append(patches, JSONPatchOperation{
			Op:    "add",
			Path:  "/spec/maxReplicas",
			Value: 10,
		})
	}

	// 3. TargetRPSPerPod default
	if _, exists := spec["targetRPSPerPod"]; !exists {
		patches = append(patches, JSONPatchOperation{
			Op:    "add",
			Path:  "/spec/targetRPSPerPod",
			Value: 100.0,
		})
	}

	// 4. HeadroomFactor default
	if _, exists := spec["headroomFactor"]; !exists {
		patches = append(patches, JSONPatchOperation{
			Op:    "add",
			Path:  "/spec/headroomFactor",
			Value: 1.2,
		})
	}

	// 5. Security lockScaleDownOnThreat default
	sec, hasSec := spec["security"].(map[string]interface{})
	if !hasSec || sec == nil {
		patches = append(patches, JSONPatchOperation{
			Op:   "add",
			Path: "/spec/security",
			Value: map[string]interface{}{
				"lockScaleDownOnThreat": true,
				"autoBlockMaliciousIPs": true,
			},
		})
	}

	if len(patches) > 0 {
		patchBytes, _ := json.Marshal(patches)
		encoded := base64.StdEncoding.EncodeToString(patchBytes)
		patchType := "JSONPatch"
		resp.Patch = encoded
		resp.PatchType = &patchType
	}

	return resp
}
