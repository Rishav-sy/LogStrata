package controller

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/scaler"
)

// ReconcileResult encapsulates the actions decided during a reconcile cycle.
type ReconcileResult struct {
	PolicyName         string                 `json:"policy_name"`
	TargetDeployment   string                 `json:"target_deployment"`
	CurrentReplicas    int                    `json:"current_replicas"`
	DesiredReplicas    int                    `json:"desired_replicas"`
	ScalePatchDispatched bool                 `json:"scale_patch_dispatched"`
	JSONPatch          string                 `json:"json_patch,omitempty"`
	NetworkPolicyYAML  string                 `json:"network_policy_yaml,omitempty"`
	ScaleDownLocked    bool                   `json:"scale_down_locked"`
	ThreatLevel        string                 `json:"threat_level"`
	ActionTaken        string                 `json:"action_taken"`
	Reason             string                 `json:"reason"`
	ReconciledAt       time.Time              `json:"reconciled_at"`
}

// PolicyReconciler manages reconciliation of LogAutoscalerPolicy resources.
type PolicyReconciler struct {
	decisionEngine *scaler.DecisionEngine
}

// NewPolicyReconciler creates an initialized reconciler for a policy.
func NewPolicyReconciler(spec LogAutoscalerPolicySpec) *PolicyReconciler {
	pol := scaler.Policy{
		MinReplicas:       spec.MinReplicas,
		MaxReplicas:       spec.MaxReplicas,
		TargetRPSPerPod:   spec.TargetRPSPerPod,
		HeadroomFactor:    spec.HeadroomFactor,
		ScaleUpCooldown:   10 * time.Second,
		ScaleDownCooldown: 120 * time.Second,
	}
	if pol.TargetRPSPerPod <= 0 {
		pol.TargetRPSPerPod = 150.0
	}
	if pol.HeadroomFactor <= 0 {
		pol.HeadroomFactor = 1.2
	}

	return &PolicyReconciler{
		decisionEngine: scaler.NewDecisionEngine(pol),
	}
}

// Reconcile performs an evaluation loop step.
func (r *PolicyReconciler) Reconcile(
	policyName string,
	spec LogAutoscalerPolicySpec,
	currentReplicas int,
	snap engine.MetricsSnapshot,
	blockedIPs []string,
	isThreatActive bool,
) ReconcileResult {
	now := time.Now()
	threatLevel := "NORMAL"
	if isThreatActive {
		threatLevel = "CRITICAL"
	}

	isScaleDownLocked := spec.Security.LockScaleDownOnThreat && isThreatActive

	// 1. Evaluate scaling decision
	dec := r.decisionEngine.Evaluate(currentReplicas, snap, isScaleDownLocked)

	result := ReconcileResult{
		PolicyName:       policyName,
		TargetDeployment: spec.ScaleTargetRef.Name,
		CurrentReplicas:  currentReplicas,
		DesiredReplicas:  dec.DesiredReplicas,
		ScaleDownLocked:  isScaleDownLocked,
		ThreatLevel:      threatLevel,
		ActionTaken:      dec.Action,
		Reason:           dec.Reason,
		ReconciledAt:     now,
	}

	// 2. Build JSON Patch if scale adjustment is required
	if dec.Action == "SCALE_UP" || dec.Action == "SCALE_DOWN" {
		patchObj := []map[string]interface{}{
			{
				"op":    "replace",
				"path":  "/spec/replicas",
				"value": dec.DesiredReplicas,
			},
		}
		patchBytes, _ := json.Marshal(patchObj)
		result.JSONPatch = string(patchBytes)
		result.ScalePatchDispatched = true
	}

	// 3. Build NetworkPolicy manifest if active threats and auto-block enabled
	if spec.Security.AutoBlockMaliciousIPs && len(blockedIPs) > 0 {
		result.NetworkPolicyYAML = generateNetworkPolicy(spec.ScaleTargetRef.Name, blockedIPs)
	}

	return result
}

func generateNetworkPolicy(targetName string, blockedIPs []string) string {
	yaml := fmt.Sprintf(`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: logstrata-mitigate-%s
  labels:
    app.kubernetes.io/managed-by: logstrata
spec:
  podSelector:
    matchLabels:
      app: %s
  policyTypes:
    - Ingress
  ingress:
    - from:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:`, targetName, targetName)

	for _, ip := range blockedIPs {
		yaml += fmt.Sprintf("\n              - %s/32", ip)
	}

	return yaml
}
