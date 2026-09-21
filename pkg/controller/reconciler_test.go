package controller

import (
	"strings"
	"testing"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
)

func TestReconcileScaleUp(t *testing.T) {
	spec := LogAutoscalerPolicySpec{
		ScaleTargetRef: ScaleTargetRef{
			Name: "commerce-frontend",
		},
		MinReplicas:     3,
		MaxReplicas:     20,
		TargetRPSPerPod: 100.0,
		HeadroomFactor:  1.2,
	}

	reconciler := NewPolicyReconciler(spec)
	snap := engine.MetricsSnapshot{
		RPS: 800.0, // (800 / 100) * 1.2 = 10 replicas
	}

	res := reconciler.Reconcile("test-policy", spec, 3, snap, nil, false)

	if !res.ScalePatchDispatched {
		t.Errorf("expected scale patch to be dispatched")
	}
	if res.DesiredReplicas != 10 {
		t.Errorf("expected 10 desired replicas, got %d", res.DesiredReplicas)
	}
	if !strings.Contains(res.JSONPatch, `[{"op":"replace","path":"/spec/replicas","value":10}]`) {
		t.Errorf("expected atomic JSON patch for replicas=10, got: %s", res.JSONPatch)
	}
}

func TestReconcileSecurityLockAndNetworkPolicy(t *testing.T) {
	spec := LogAutoscalerPolicySpec{
		ScaleTargetRef: ScaleTargetRef{
			Name: "commerce-frontend",
		},
		MinReplicas: 3,
		MaxReplicas: 20,
		Security: SecuritySpec{
			LockScaleDownOnThreat: true,
			AutoBlockMaliciousIPs: true,
		},
	}

	reconciler := NewPolicyReconciler(spec)
	snap := engine.MetricsSnapshot{
		RPS: 20.0, // low RPS should normally want 3 replicas
	}
	blockedIPs := []string{"194.26.29.11", "45.154.255.8"}

	// Current is 9, threat is active
	res := reconciler.Reconcile("test-policy", spec, 9, snap, blockedIPs, true)

	if res.ActionTaken != "LOCKED" {
		t.Errorf("expected action to be LOCKED, got %s", res.ActionTaken)
	}
	if res.DesiredReplicas != 9 {
		t.Errorf("expected desired replicas to remain at 9, got %d", res.DesiredReplicas)
	}
	if res.ScalePatchDispatched {
		t.Errorf("expected NO scale down patch when locked")
	}
	if !strings.Contains(res.NetworkPolicyYAML, "194.26.29.11/32") {
		t.Errorf("expected NetworkPolicy to contain blocked IP 194.26.29.11/32, got: %s", res.NetworkPolicyYAML)
	}
}
