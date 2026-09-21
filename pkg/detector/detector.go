package detector

import (
	"sync"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/parser"
)

// AnomalyType defines categories of detected traffic or security deviations.
type AnomalyType string

const (
	AnomalyNone        AnomalyType = "NONE"
	AnomalyTrafficSurge AnomalyType = "TRAFFIC_SURGE"
	AnomalyBruteForce   AnomalyType = "BRUTE_FORCE"
	AnomalyErrorSpike   AnomalyType = "ERROR_SPIKE"
	AnomalyDDoS         AnomalyType = "DDOS_FLOOD"
)

// ThreatEvent details a security or scaling anomaly triggered by the detector.
type ThreatEvent struct {
	Type        AnomalyType `json:"type"`
	Timestamp   time.Time   `json:"timestamp"`
	Severity    string      `json:"severity"` // LOW, MEDIUM, HIGH, CRITICAL
	Description string      `json:"description"`
	OffenderIPs []string    `json:"offender_ips,omitempty"`
	MetricValue float64     `json:"metric_value"`
	Threshold   float64     `json:"threshold"`
}

// Config holds detector sensitivity thresholds.
type Config struct {
	SurgeRPSThreshold         float64 // Minimum RPS jump to trigger surge
	SurgeDeltaRatio           float64 // Ratio e.g. 2.5x increase in 5s
	Error5xxPercentThreshold  float64 // e.g. 5.0%
	BruteForce4xxPerMinuteIP  int     // e.g. 30 401/403s per minute from single IP
	ScaleDownLockDurationSec  int     // Duration to hold scale-down lock after threat
}

// DefaultConfig provides recommended baseline thresholds.
func DefaultConfig() Config {
	return Config{
		SurgeRPSThreshold:        50.0,
		SurgeDeltaRatio:          2.0,
		Error5xxPercentThreshold: 5.0,
		BruteForce4xxPerMinuteIP: 20,
		ScaleDownLockDurationSec: 300, // 5 minutes
	}
}

// AnomalyDetector analyzes incoming log streams and window snapshots for anomalies.
type AnomalyDetector struct {
	mu           sync.RWMutex
	cfg          Config
	ipAuthFails  map[string][]int64 // IP -> timestamps of 401/403
	blockedIPs   map[string]time.Time
	scaleLockExp time.Time
}

// NewAnomalyDetector creates an initialized detector.
func NewAnomalyDetector(cfg Config) *AnomalyDetector {
	return &AnomalyDetector{
		cfg:         cfg,
		ipAuthFails: make(map[string][]int64),
		blockedIPs:  make(map[string]time.Time),
	}
}

// InspectLog processes individual records for fast-path IP threat detection.
func (d *AnomalyDetector) InspectLog(rec *parser.LogRecord) *ThreatEvent {
	if rec == nil || rec.RemoteIP == "" {
		return nil
	}

	// Track 401/403 credential scanning
	if rec.StatusCode == 401 || rec.StatusCode == 403 {
		d.mu.Lock()
		defer d.mu.Unlock()

		nowUnix := rec.Timestamp.Unix()
		windowStart := nowUnix - 60 // 60-second sliding window

		// Prune older timestamps
		var recent []int64
		for _, ts := range d.ipAuthFails[rec.RemoteIP] {
			if ts >= windowStart {
				recent = append(recent, ts)
			}
		}
		recent = append(recent, nowUnix)
		d.ipAuthFails[rec.RemoteIP] = recent

		// Check if threshold breached
		if len(recent) >= d.cfg.BruteForce4xxPerMinuteIP {
			d.blockedIPs[rec.RemoteIP] = time.Now().Add(time.Duration(d.cfg.ScaleDownLockDurationSec) * time.Second)
			d.scaleLockExp = time.Now().Add(time.Duration(d.cfg.ScaleDownLockDurationSec) * time.Second)

			return &ThreatEvent{
				Type:        AnomalyBruteForce,
				Timestamp:   time.Now(),
				Severity:    "CRITICAL",
				Description: "High-frequency credential scanning / unauthorized attempts detected.",
				OffenderIPs: []string{rec.RemoteIP},
				MetricValue: float64(len(recent)),
				Threshold:   float64(d.cfg.BruteForce4xxPerMinuteIP),
			}
		}
	}

	return nil
}

// EvaluateWindow analyzes macro trends from the sliding-window engine.
func (d *AnomalyDetector) EvaluateWindow(shortSnap, longSnap engine.MetricsSnapshot) *ThreatEvent {
	d.mu.Lock()
	defer d.mu.Unlock()

	// 1. Check for sudden traffic surge: short window RPS >> long window RPS
	if shortSnap.RPS >= d.cfg.SurgeRPSThreshold && longSnap.RPS > 0 {
		ratio := shortSnap.RPS / longSnap.RPS
		if ratio >= d.cfg.SurgeDeltaRatio {
			return &ThreatEvent{
				Type:        AnomalyTrafficSurge,
				Timestamp:   time.Now(),
				Severity:    "HIGH",
				Description: "Rapid transaction surge detected ahead of CPU resource lag.",
				MetricValue: shortSnap.RPS,
				Threshold:   longSnap.RPS * d.cfg.SurgeDeltaRatio,
			}
		}
	}

	// 2. Check for 5xx cascading error spike
	if shortSnap.TotalRequests >= 20 && shortSnap.ErrorRate5xxPercent >= d.cfg.Error5xxPercentThreshold {
		return &ThreatEvent{
			Type:        AnomalyErrorSpike,
			Timestamp:   time.Now(),
			Severity:    "HIGH",
			Description: "Downstream 5xx server error rate elevated.",
			MetricValue: shortSnap.ErrorRate5xxPercent,
			Threshold:   d.cfg.Error5xxPercentThreshold,
		}
	}

	return nil
}

// IsScaleDownLocked checks if an active security lock prevents scaling down.
func (d *AnomalyDetector) IsScaleDownLocked() bool {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return time.Now().Before(d.scaleLockExp)
}

// GetBlockedIPs returns the list of currently active blocked IP addresses.
func (d *AnomalyDetector) GetBlockedIPs() []string {
	d.mu.RLock()
	defer d.mu.RUnlock()

	now := time.Now()
	var active []string
	for ip, exp := range d.blockedIPs {
		if now.Before(exp) {
			active = append(active, ip)
		}
	}
	return active
}
