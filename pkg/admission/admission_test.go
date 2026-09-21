package admission

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWebhookHealthz(t *testing.T) {
	server := NewWebhookServer()
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Body.String() != "OK\n" {
		t.Fatalf("unexpected body: %q", rec.Body.String())
	}
}

func TestValidate_ValidPolicy(t *testing.T) {
	server := NewWebhookServer()

	validObj := []byte(`{
		"apiVersion": "core.logstrata.io/v1alpha1",
		"kind": "LogAutoscalerPolicy",
		"metadata": {"name": "test-policy", "namespace": "prod"},
		"spec": {
			"scaleTargetRef": {"kind": "Deployment", "name": "order-api"},
			"minReplicas": 2,
			"maxReplicas": 15,
			"targetRPSPerPod": 150.0,
			"headroomFactor": 1.25,
			"security": {
				"lockScaleDownOnThreat": true,
				"autoBlockMaliciousIPs": true
			}
		}
	}`)

	review := AdmissionReview{
		APIVersion: "admission.k8s.io/v1",
		Kind:       "AdmissionReview",
		Request: &AdmissionRequest{
			UID:    "111-222-333",
			Object: validObj,
		},
	}

	body, _ := json.Marshal(review)
	req := httptest.NewRequest(http.MethodPost, "/validate", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rec.Code)
	}

	var respReview AdmissionReview
	if err := json.Unmarshal(rec.Body.Bytes(), &respReview); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if respReview.Response == nil {
		t.Fatal("response is nil")
	}
	if !respReview.Response.Allowed {
		t.Fatalf("expected allowed=true, got false: %v", respReview.Response.Status)
	}
	if respReview.Response.UID != "111-222-333" {
		t.Fatalf("expected UID matching request, got %s", respReview.Response.UID)
	}
}

func TestValidate_InvalidPolicy(t *testing.T) {
	server := NewWebhookServer()

	invalidObj := []byte(`{
		"apiVersion": "core.logstrata.io/v1alpha1",
		"kind": "LogAutoscalerPolicy",
		"metadata": {"name": "bad-policy"},
		"spec": {
			"scaleTargetRef": {"kind": "DaemonSet", "name": ""},
			"minReplicas": 0,
			"maxReplicas": -1,
			"targetRPSPerPod": 0.0,
			"headroomFactor": 6.5
		}
	}`)

	review := AdmissionReview{
		APIVersion: "admission.k8s.io/v1",
		Kind:       "AdmissionReview",
		Request: &AdmissionRequest{
			UID:    "bad-uid-999",
			Object: invalidObj,
		},
	}

	body, _ := json.Marshal(review)
	req := httptest.NewRequest(http.MethodPost, "/validate", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK wrapper, got %d", rec.Code)
	}

	var respReview AdmissionReview
	if err := json.Unmarshal(rec.Body.Bytes(), &respReview); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if respReview.Response.Allowed {
		t.Fatal("expected allowed=false for invalid spec")
	}
	if respReview.Response.Status == nil || respReview.Response.Status.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 UnprocessableEntity, got %v", respReview.Response.Status)
	}
}

func TestMutate_DefaultsInjection(t *testing.T) {
	server := NewWebhookServer()

	bareObj := []byte(`{
		"apiVersion": "core.logstrata.io/v1alpha1",
		"kind": "LogAutoscalerPolicy",
		"metadata": {"name": "bare-policy"},
		"spec": {
			"scaleTargetRef": {"kind": "Deployment", "name": "checkout-svc"}
		}
	}`)

	review := AdmissionReview{
		APIVersion: "admission.k8s.io/v1",
		Kind:       "AdmissionReview",
		Request: &AdmissionRequest{
			UID:    "mutate-123",
			Object: bareObj,
		},
	}

	body, _ := json.Marshal(review)
	req := httptest.NewRequest(http.MethodPost, "/mutate", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rec.Code)
	}

	var respReview AdmissionReview
	if err := json.Unmarshal(rec.Body.Bytes(), &respReview); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !respReview.Response.Allowed {
		t.Fatal("expected allowed=true")
	}
	if respReview.Response.Patch == "" {
		t.Fatal("expected patch to be non-empty")
	}

	// Decode patch
	patchBytes, err := base64.StdEncoding.DecodeString(respReview.Response.Patch)
	if err != nil {
		t.Fatalf("failed to decode base64 patch: %v", err)
	}

	var ops []JSONPatchOperation
	if err := json.Unmarshal(patchBytes, &ops); err != nil {
		t.Fatalf("failed to unmarshal patch ops: %v", err)
	}

	pathsFound := make(map[string]bool)
	for _, op := range ops {
		pathsFound[op.Path] = true
	}

	expectedPaths := []string{
		"/spec/minReplicas",
		"/spec/maxReplicas",
		"/spec/targetRPSPerPod",
		"/spec/headroomFactor",
		"/spec/security",
	}

	for _, p := range expectedPaths {
		if !pathsFound[p] {
			t.Errorf("missing expected patch for path %s", p)
		}
	}
}

func TestWebhookErrors(t *testing.T) {
	server := NewWebhookServer()

	// 1. GET method on validate
	req := httptest.NewRequest(http.MethodGet, "/validate", nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for GET, got %d", rec.Code)
	}

	// 2. Malformed JSON body
	req = httptest.NewRequest(http.MethodPost, "/validate", bytes.NewReader([]byte("{invalid-json")))
	rec = httptest.NewRecorder()
	server.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for invalid JSON, got %d", rec.Code)
	}
}
