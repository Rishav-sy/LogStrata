package scaler

import (
	"math"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
)

// Policy defines autoscaling bounds, targets, and stability timers.
type Policy struct {
	MinReplicas      int     `json:"min_replicas"`
	MaxReplicas      int     `json:"max_replicas"`
	TargetRPSPerPod  float64 `json:"target_rps_per_pod"`
	HeadroomFactor   float64 `json:"headroom_factor"`   // e.g. 1.25 for 25% safety margin
	ScaleUpCooldown  time.Duration `json:"scale_up_cooldown"`
	ScaleDownCooldown time.Duration `json:"scale_down_cooldown"`
}

// DefaultPolicy provides recommended production defaults.
func DefaultPolicy() Policy {
	return Policy{
		MinReplicas:       3,
		MaxReplicas:       20,
		TargetRPSPerPod:   150.0,
		HeadroomFactor:    1.2,
		ScaleUpCooldown:   10 * time.Second,
		ScaleDownCooldown: 120 * time.Second,
	}
}

// ScaleDecision represents an evaluation step outcome.
type ScaleDecision struct {
	CurrentReplicas int       `json:"current_replicas"`
	DesiredReplicas int       `json:"desired_replicas"`
	Action          string    `json:"action"` // SCALE_UP, SCALE_DOWN, MAINTAIN, LOCKED
	Reason          string    `json:"reason"`
	RPS             float64   `json:"rps"`
	Timestamp       time.Time `json:"timestamp"`
}

// DecisionEngine computes replica changes from real-time log telemetry.
type DecisionEngine struct {
	policy         Policy
	lastScaleTime  time.Time
	lastScaleType  string
}

// NewDecisionEngine creates an initialized scaling evaluator.
func NewDecisionEngine(policy Policy) *DecisionEngine {
	return &DecisionEngine{
		policy: policy,
	}
}

// Evaluate evaluates telemetry against the policy and active security locks.
func (e *DecisionEngine) Evaluate(
	currentReplicas int,
	snap engine.MetricsSnapshot,
	isScaleDownLocked bool,
) ScaleDecision {
	now := time.Now()
	rps := snap.RPS

	// 1. Compute baseline desired replicas from incoming RPS
	var rawDesired float64
	if e.policy.TargetRPSPerPod > 0 {
		rawDesired = (rps / e.policy.TargetRPSPerPod) * e.policy.HeadroomFactor
	}
	desired := int(math.Ceil(rawDesired))

	// Clamp within configured replica bounds
	if desired < e.policy.MinReplicas {
		desired = e.policy.MinReplicas
	}
	if desired > e.policy.MaxReplicas {
		desired = e.policy.MaxReplicas
	}

	decision := ScaleDecision{
		CurrentReplicas: currentReplicas,
		DesiredReplicas: desired,
		RPS:             rps,
		Timestamp:       now,
	}

	// 2. Action determination
	if desired > currentReplicas {
		// Scale Up Check
		if e.lastScaleType == "UP" && now.Sub(e.lastScaleTime) < e.policy.ScaleUpCooldown {
			decision.Action = "MAINTAIN"
			decision.DesiredReplicas = currentReplicas
			decision.Reason = "Scale up requested but inside cooldown period."
			return decision
		}

		decision.Action = "SCALE_UP"
		decision.Reason = "Proactive transaction rate jump detected in log streams."
		e.lastScaleTime = now
		e.lastScaleType = "UP"
		return decision
	}

	if desired < currentReplicas {
		// Security Lock Check: Prevent scale down during ongoing threat
		if isScaleDownLocked {
			decision.Action = "LOCKED"
			decision.DesiredReplicas = currentReplicas
			decision.Reason = "Scale down prohibited: active ingress threat mitigation lock engaged."
			return decision
		}

		// Scale Down Cooldown Check
		if now.Sub(e.lastScaleTime) < e.policy.ScaleDownCooldown {
			decision.Action = "MAINTAIN"
			decision.DesiredReplicas = currentReplicas
			decision.Reason = "Scale down requested but inside stabilization cooldown."
			return decision
		}

		decision.Action = "SCALE_DOWN"
		decision.Reason = "Traffic volume subsided gracefully across evaluation window."
		e.lastScaleTime = now
		e.lastScaleType = "DOWN"
		return decision
	}

	decision.Action = "MAINTAIN"
	decision.Reason = "Current capacity matches workload transaction rate bounds."
	return decision
}
