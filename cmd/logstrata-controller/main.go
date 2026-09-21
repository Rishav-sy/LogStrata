package main

import (
	"encoding/json"
	"flag"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/controller"
	"github.com/Rishav-sy/LogStrata/pkg/engine"
)

type ControllerState struct {
	mu            sync.RWMutex
	history       []controller.ReconcileResult
	policies      map[string]controller.LogAutoscalerPolicySpec
	activeReplicas map[string]int
}

func main() {
	listenAddr := flag.String("listen-addr", ":8081", "Controller HTTP status listen address")
	daemonURL := flag.String("daemon-url", "http://localhost:8080/api/v1/status", "URL to LogStrata daemon status endpoint")
	reconcileInterval := flag.Duration("reconcile-interval", 2*time.Second, "Reconciliation loop interval")
	flag.Parse()

	log.Println("[LogStrata Controller] Starting Kubernetes Operator Control Loop...")

	state := &ControllerState{
		policies:       make(map[string]controller.LogAutoscalerPolicySpec),
		activeReplicas: make(map[string]int),
	}

	// Register default baseline policy for commerce-frontend
	defaultPolicyName := "frontend-log-scaler"
	defaultSpec := controller.LogAutoscalerPolicySpec{
		ScaleTargetRef: controller.ScaleTargetRef{
			Name: "commerce-frontend",
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
	state.policies[defaultPolicyName] = defaultSpec
	state.activeReplicas["commerce-frontend"] = 3

	reconciler := controller.NewPolicyReconciler(defaultSpec)

	// Background Reconciliation Loop
	go func() {
		ticker := time.NewTicker(*reconcileInterval)
		defer ticker.Stop()

		for range ticker.C {
			// 1. Fetch live telemetry from daemon
			resp, err := http.Get(*daemonURL)
			if err != nil {
				// Daemon may not be up yet or unreachable; continue
				continue
			}

			body, err := io.ReadAll(resp.Body)
			_ = resp.Body.Close()
			if err != nil {
				continue
			}

			var daemonStatus struct {
				RPS             float64  `json:"rps"`
				CurrentReplicas int      `json:"current_replicas"`
				BlockedIPs      []string `json:"blocked_ips"`
				ScaleDownLocked bool     `json:"scale_down_locked"`
			}
			if err := json.Unmarshal(body, &daemonStatus); err != nil {
				continue
			}

			snap := engine.MetricsSnapshot{
				RPS: daemonStatus.RPS,
			}

			state.mu.Lock()
			currReplicas := state.activeReplicas["commerce-frontend"]
			if daemonStatus.CurrentReplicas > 0 {
				currReplicas = daemonStatus.CurrentReplicas
			}

			res := reconciler.Reconcile(
				defaultPolicyName,
				defaultSpec,
				currReplicas,
				snap,
				daemonStatus.BlockedIPs,
				daemonStatus.ScaleDownLocked,
			)

			if res.ScalePatchDispatched {
				state.activeReplicas["commerce-frontend"] = res.DesiredReplicas
				log.Printf("[K8s PATCH] %s: %s -> Replicas: %d (Patch: %s)",
					res.TargetDeployment, res.ActionTaken, res.DesiredReplicas, res.JSONPatch)
			}

			if res.NetworkPolicyYAML != "" {
				log.Printf("[K8s NETWORKPOLICY] Generated ingress filter dropping %d blocked IPs", len(daemonStatus.BlockedIPs))
			}

			state.history = append(state.history, res)
			if len(state.history) > 50 {
				state.history = state.history[1:]
			}
			state.mu.Unlock()
		}
	}()

	// HTTP Status and Forensics API
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK\n"))
	})

	http.HandleFunc("/api/v1/reconciliations", func(w http.ResponseWriter, r *http.Request) {
		state.mu.RLock()
		defer state.mu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":             "RUNNING",
			"active_policies":    len(state.policies),
			"recent_evaluations": state.history,
		})
	})

	log.Printf("[LogStrata Controller] Listening on %s (Health: /healthz, Audit: /api/v1/reconciliations)", *listenAddr)
	if err := http.ListenAndServe(*listenAddr, nil); err != nil {
		log.Fatalf("[LogStrata Controller FATAL] Server failed: %v", err)
	}
}
