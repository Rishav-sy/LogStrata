package controller

import (
	"time"
)

// ScaleTargetRef references a target Kubernetes resource.
type ScaleTargetRef struct {
	APIVersion string `json:"apiVersion,omitempty"`
	Kind       string `json:"kind"`
	Name       string `json:"name"`
}

// SecuritySpec configures threat detection and scale-down locks.
type SecuritySpec struct {
	LockScaleDownOnThreat bool    `json:"lockScaleDownOnThreat"`
	AutoBlockMaliciousIPs bool    `json:"autoBlockMaliciousIPs"`
	ThreatThreshold       float64 `json:"threatThreshold,omitempty"`
}

// LogAutoscalerPolicySpec defines the desired autoscaling state.
type LogAutoscalerPolicySpec struct {
	ScaleTargetRef  ScaleTargetRef `json:"scaleTargetRef"`
	MinReplicas     int            `json:"minReplicas"`
	MaxReplicas     int            `json:"maxReplicas"`
	TargetRPSPerPod float64        `json:"targetRPSPerPod,omitempty"`
	HeadroomFactor  float64        `json:"headroomFactor,omitempty"`
	Security        SecuritySpec   `json:"security,omitempty"`
}

// LogAutoscalerPolicyStatus reflects observed cluster state.
type LogAutoscalerPolicyStatus struct {
	CurrentReplicas   int       `json:"currentReplicas"`
	DesiredReplicas   int       `json:"desiredReplicas"`
	LastScaleTime     time.Time `json:"lastScaleTime"`
	ActiveThreatLevel string    `json:"activeThreatLevel"`
}

// LogThreatPolicySpec defines ingress defense parameters.
type LogThreatPolicySpec struct {
	TargetIngressRef ScaleTargetRef     `json:"targetIngressRef"`
	ThreatMetrics    []ThreatMetricRule `json:"threatMetrics"`
}

// ThreatMetricRule defines a pattern to watch in logs.
type ThreatMetricRule struct {
	Type               string         `json:"type"`
	Pattern            string         `json:"pattern"`
	ThresholdPerMinute int            `json:"thresholdPerMinute"`
	Action             []ThreatAction `json:"action"`
}

// ThreatAction specifies the mitigation behavior.
type ThreatAction struct {
	Type               string `json:"type"` // IPBlocklist, ScalingModifierLock
	Duration           string `json:"duration"`
	BlocklistConfigMap string `json:"blocklistConfigMap,omitempty"`
	LockMinReplicas    int    `json:"lockMinReplicas,omitempty"`
}
