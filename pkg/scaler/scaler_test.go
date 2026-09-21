package scaler

import (
	"testing"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
)

func TestScaleUpCalculation(t *testing.T) {
	pol := DefaultPolicy()
	pol.TargetRPSPerPod = 100.0
	pol.HeadroomFactor = 1.2
	pol.MinReplicas = 2
	pol.MaxReplicas = 10

	eng := NewDecisionEngine(pol)

	// 500 RPS: (500 / 100) * 1.2 = 6 replicas
	snap := engine.MetricsSnapshot{
		RPS: 500.0,
	}

	dec := eng.Evaluate(2, snap, false)
	if dec.Action != "SCALE_UP" {
		t.Errorf("expected SCALE_UP action, got %s", dec.Action)
	}
	if dec.DesiredReplicas != 6 {
		t.Errorf("expected 6 desired replicas, got %d", dec.DesiredReplicas)
	}
}

func TestScaleDownSecurityLock(t *testing.T) {
	pol := DefaultPolicy()
	pol.MinReplicas = 2
	eng := NewDecisionEngine(pol)

	// 0 RPS should want min replicas (2), but current is 8
	snap := engine.MetricsSnapshot{
		RPS: 10.0,
	}

	// When security lock is engaged:
	dec := eng.Evaluate(8, snap, true)
	if dec.Action != "LOCKED" {
		t.Errorf("expected LOCKED action under active threat, got %s", dec.Action)
	}
	if dec.DesiredReplicas != 8 {
		t.Errorf("expected replicas to remain at 8, got %d", dec.DesiredReplicas)
	}
}

func TestBoundsClamping(t *testing.T) {
	pol := DefaultPolicy()
	pol.MinReplicas = 3
	pol.MaxReplicas = 12
	pol.TargetRPSPerPod = 50.0
	eng := NewDecisionEngine(pol)

	// Extremely high RPS (100,000) should clamp to MaxReplicas (12)
	snap := engine.MetricsSnapshot{
		RPS: 100000.0,
	}
	dec := eng.Evaluate(3, snap, false)
	if dec.DesiredReplicas != 12 {
		t.Errorf("expected clamp to max replicas 12, got %d", dec.DesiredReplicas)
	}
}
