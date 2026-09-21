package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/controller"
	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/notifier"
)

// ControllerConfig holds flags and runtime configurations for the operator
type ControllerConfig struct {
	ListenAddr        string
	DaemonURL         string
	ReconcileInterval time.Duration
	WebhookURL        string
	TargetDeployment  string
}

// DefaultControllerConfig provides standard operator settings
func DefaultControllerConfig() ControllerConfig {
	return ControllerConfig{
		ListenAddr:        ":8081",
		DaemonURL:         "http://localhost:8080/api/v1/status",
		ReconcileInterval: 2 * time.Second,
		TargetDeployment:  "commerce-frontend",
	}
}

// DaemonTelemetry mirrors the JSON payload from LogStrata daemon /api/v1/status
type DaemonTelemetry struct {
	Status          string   `json:"status"`
	RPS             float64  `json:"rps"`
	CurrentReplicas int      `json:"current_replicas"`
	BlockedIPs      []string `json:"blocked_ips"`
	ScaleDownLocked bool     `json:"scale_down_locked"`
}

// ControllerServer manages Kubernetes CRD reconciliation and forensic audit logging
type ControllerServer struct {
	Config     ControllerConfig
	Reconciler *controller.PolicyReconciler
	Notifier   *notifier.WebhookDispatcher
	Mux        *http.ServeMux

	mu             sync.RWMutex
	history        []controller.ReconcileResult
	policies       map[string]controller.LogAutoscalerPolicySpec
	activeReplicas map[string]int
	stopCh         chan struct{}
}

// NewControllerServer constructs and sets up an operator server instance
func NewControllerServer(cfg ControllerConfig) *ControllerServer {
	defaultSpec := controller.LogAutoscalerPolicySpec{
		ScaleTargetRef: controller.ScaleTargetRef{
			Name: cfg.TargetDeployment,
			Kind: "Deployment",
		},
		MinReplicas:     3,
		MaxReplicas:     20,
		TargetRPSPerPod: 120.0,
		HeadroomFactor:  1.2,
		Security: controller.SecuritySpec{
			LockScaleDownOnThreat: true,
			AutoBlockMaliciousIPs: true,
		},
	}

	cs := &ControllerServer{
		Config:         cfg,
		Reconciler:     controller.NewPolicyReconciler(defaultSpec),
		Mux:            http.NewServeMux(),
		policies:       make(map[string]controller.LogAutoscalerPolicySpec),
		activeReplicas: make(map[string]int),
		stopCh:         make(chan struct{}),
	}

	if cfg.WebhookURL != "" {
		cs.Notifier = notifier.NewWebhookDispatcher(cfg.WebhookURL)
	}

	cs.policies["frontend-log-scaler"] = defaultSpec
	cs.activeReplicas[cfg.TargetDeployment] = defaultSpec.MinReplicas

	cs.registerRoutes()
	return cs
}

// ServeHTTP implements the http.Handler interface
func (cs *ControllerServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	cs.Mux.ServeHTTP(w, r)
}

func (cs *ControllerServer) registerRoutes() {
	cs.Mux.HandleFunc("/healthz", cs.handleHealthz)
	cs.Mux.HandleFunc("/api/v1/reconciliations", cs.handleReconciliations)
	cs.Mux.HandleFunc("/api/v1/policies", cs.handlePolicies)
}

func (cs *ControllerServer) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK\n"))
}

func (cs *ControllerServer) handleReconciliations(w http.ResponseWriter, r *http.Request) {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":             "RUNNING",
		"active_policies":    len(cs.policies),
		"recent_evaluations": cs.history,
	})
}

func (cs *ControllerServer) handlePolicies(w http.ResponseWriter, r *http.Request) {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cs.policies)
}

// Step runs a single reconciliation iteration, returning the result
func (cs *ControllerServer) Step(telemetry *DaemonTelemetry) controller.ReconcileResult {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	target := cs.Config.TargetDeployment
	spec := cs.policies["frontend-log-scaler"]
	currReplicas := cs.activeReplicas[target]

	if telemetry.CurrentReplicas > 0 {
		currReplicas = telemetry.CurrentReplicas
	}

	snap := engine.MetricsSnapshot{
		RPS: telemetry.RPS,
	}

	res := cs.Reconciler.Reconcile(
		"frontend-log-scaler",
		spec,
		currReplicas,
		snap,
		telemetry.BlockedIPs,
		telemetry.ScaleDownLocked,
	)

	if res.ScalePatchDispatched {
		cs.activeReplicas[target] = res.DesiredReplicas
		log.Printf("[K8s PATCH] %s: %s -> Replicas: %d (Patch: %s)",
			res.TargetDeployment, res.ActionTaken, res.DesiredReplicas, res.JSONPatch)

		if cs.Notifier != nil {
			evtType := notifier.EventScaleUp
			if res.ActionTaken == "SCALE_DOWN" {
				evtType = notifier.EventScaleDown
			}
			go func() {
				_ = cs.Notifier.Dispatch(notifier.NotificationEvent{
					Type:        evtType,
					Title:       fmt.Sprintf("Autoscaling patch applied to %s", res.TargetDeployment),
					Message:     res.Reason,
					Workload:    res.TargetDeployment,
					Replicas:    res.DesiredReplicas,
					RPS:         telemetry.RPS,
					Timestamp:   time.Now(),
				})
			}()
		}
	}

	if res.NetworkPolicyYAML != "" {
		log.Printf("[K8s NETWORKPOLICY] Generated ingress filter dropping %d blocked IPs", len(telemetry.BlockedIPs))
	}

	cs.history = append(cs.history, res)
	if len(cs.history) > 50 {
		cs.history = cs.history[1:]
	}

	return res
}

// FetchTelemetry queries the running LogStrata daemon status endpoint
func (cs *ControllerServer) FetchTelemetry(client *http.Client) (*DaemonTelemetry, error) {
	resp, err := client.Get(cs.Config.DaemonURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("daemon responded with status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var telemetry DaemonTelemetry
	if err := json.Unmarshal(body, &telemetry); err != nil {
		return nil, err
	}

	return &telemetry, nil
}

// StartReconciliationLoop spins up the background loop
func (cs *ControllerServer) StartReconciliationLoop() {
	client := &http.Client{Timeout: 3 * time.Second}
	ticker := time.NewTicker(cs.Config.ReconcileInterval)

	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-cs.stopCh:
				return
			case <-ticker.C:
				telemetry, err := cs.FetchTelemetry(client)
				if err != nil {
					// Daemon may be restarting or not ready; skip cycle
					continue
				}
				cs.Step(telemetry)
			}
		}
	}()
}

// Stop cleanly terminates the background loop
func (cs *ControllerServer) Stop() {
	select {
	case <-cs.stopCh:
	default:
		close(cs.stopCh)
	}
}
