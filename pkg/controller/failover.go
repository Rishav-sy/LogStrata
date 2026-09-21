package controller

import (
	"fmt"
	"sync"
	"time"
)

// CircuitState represents the operational state of the fail-safe watchdog
type CircuitState string

const (
	CircuitStateClosed   CircuitState = "CLOSED"    // Normal: LogStrata in full control
	CircuitStateHalfOpen CircuitState = "HALF_OPEN" // Probing: verifying daemon recovery
	CircuitStateOpen     CircuitState = "OPEN"      // Tripped: daemon unhealthy, yield to HPA
)

// WatchdogConfig holds timing and threshold settings for circuit breaking
type WatchdogConfig struct {
	MaxConsecutiveFailures int           // Number of failures before tripping circuit (e.g. 3)
	HeartbeatTimeout       time.Duration // Time without telemetry before tripping (e.g. 8s)
	CooloffDuration        time.Duration // Duration to stay OPEN before attempting HALF_OPEN probe (e.g. 15s)
}

// DefaultWatchdogConfig provides production-safe defaults
func DefaultWatchdogConfig() WatchdogConfig {
	return WatchdogConfig{
		MaxConsecutiveFailures: 3,
		HeartbeatTimeout:       8 * time.Second,
		CooloffDuration:        15 * time.Second,
	}
}

// FailoverAction encapsulates the recommendation when telemetry degrades
type FailoverAction struct {
	State               CircuitState `json:"state"`
	YieldToHPA          bool         `json:"yield_to_hpa"`
	Reason              string       `json:"reason"`
	ConsecutiveFailures int          `json:"consecutive_failures"`
	LastHeartbeat       time.Time    `json:"last_heartbeat"`
	LastFailure         time.Time    `json:"last_failure,omitempty"`
	AnnotationPatch     string       `json:"annotation_patch,omitempty"`
}

// CircuitBreakerWatchdog monitors daemon liveness and safeguards against flapping
type CircuitBreakerWatchdog struct {
	mu                  sync.RWMutex
	config              WatchdogConfig
	state               CircuitState
	consecutiveFailures int
	consecutiveSuccesses int
	lastHeartbeat       time.Time
	lastFailure         time.Time
	stateChangeTime     time.Time
}

// NewCircuitBreakerWatchdog creates an initialized watchdog
func NewCircuitBreakerWatchdog(cfg WatchdogConfig) *CircuitBreakerWatchdog {
	now := time.Now()
	return &CircuitBreakerWatchdog{
		config:          cfg,
		state:           CircuitStateClosed,
		lastHeartbeat:   now,
		stateChangeTime: now,
	}
}

// RecordHeartbeat records a successful telemetry pull
func (w *CircuitBreakerWatchdog) RecordHeartbeat() FailoverAction {
	w.mu.Lock()
	defer w.mu.Unlock()

	now := time.Now()
	w.lastHeartbeat = now
	w.consecutiveFailures = 0
	w.consecutiveSuccesses++

	if w.state == CircuitStateHalfOpen && w.consecutiveSuccesses >= 2 {
		w.state = CircuitStateClosed
		w.stateChangeTime = now
	} else if w.state == CircuitStateOpen {
		// First success after trip initiates half-open probe
		w.state = CircuitStateHalfOpen
		w.stateChangeTime = now
		w.consecutiveSuccesses = 1
	}

	return w.buildActionLocked("Daemon heartbeat healthy")
}

// RecordFailure records a failed communication with the daemon
func (w *CircuitBreakerWatchdog) RecordFailure(err error) FailoverAction {
	w.mu.Lock()
	defer w.mu.Unlock()

	now := time.Now()
	w.lastFailure = now
	w.consecutiveFailures++
	w.consecutiveSuccesses = 0

	errStr := "unknown error"
	if err != nil {
		errStr = err.Error()
	}

	if w.state == CircuitStateClosed {
		if w.consecutiveFailures >= w.config.MaxConsecutiveFailures || now.Sub(w.lastHeartbeat) > w.config.HeartbeatTimeout {
			w.state = CircuitStateOpen
			w.stateChangeTime = now
			return w.buildActionLocked(fmt.Sprintf("Circuit tripped to OPEN: %d failures (%s)", w.consecutiveFailures, errStr))
		}
	} else if w.state == CircuitStateHalfOpen {
		// Any failure in half-open immediately returns to open
		w.state = CircuitStateOpen
		w.stateChangeTime = now
		return w.buildActionLocked(fmt.Sprintf("Probe failed during HALF_OPEN, re-tripped to OPEN: %s", errStr))
	}

	return w.buildActionLocked(fmt.Sprintf("Daemon fetch failed (%d/%d): %s",
		w.consecutiveFailures, w.config.MaxConsecutiveFailures, errStr))
}

// CheckLiveness evaluates timeouts even if no explicit failure was recorded
func (w *CircuitBreakerWatchdog) CheckLiveness() FailoverAction {
	w.mu.Lock()
	defer w.mu.Unlock()

	now := time.Now()
	if w.state == CircuitStateClosed && now.Sub(w.lastHeartbeat) > w.config.HeartbeatTimeout {
		w.state = CircuitStateOpen
		w.stateChangeTime = now
		return w.buildActionLocked(fmt.Sprintf("Heartbeat timed out after %v without signal", now.Sub(w.lastHeartbeat)))
	}

	if w.state == CircuitStateOpen && now.Sub(w.stateChangeTime) > w.config.CooloffDuration {
		w.state = CircuitStateHalfOpen
		w.stateChangeTime = now
		return w.buildActionLocked("Cooloff elapsed, transitioning to HALF_OPEN to probe daemon")
	}

	return w.buildActionLocked("Liveness check normal")
}

// ShouldYieldToHPA returns true if the controller must suspend replica mutations
func (w *CircuitBreakerWatchdog) ShouldYieldToHPA() bool {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.state == CircuitStateOpen
}

// GetState returns current circuit state
func (w *CircuitBreakerWatchdog) GetState() CircuitState {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.state
}

func (w *CircuitBreakerWatchdog) buildActionLocked(reason string) FailoverAction {
	yield := (w.state == CircuitStateOpen)
	patch := ""
	if yield {
		patch = `{"metadata":{"annotations":{"logstrata.io/yielded-to-hpa":"true"}}}`
	} else {
		patch = `{"metadata":{"annotations":{"logstrata.io/yielded-to-hpa":"false"}}}`
	}

	return FailoverAction{
		State:               w.state,
		YieldToHPA:          yield,
		Reason:              reason,
		ConsecutiveFailures: w.consecutiveFailures,
		LastHeartbeat:       w.lastHeartbeat,
		LastFailure:         w.lastFailure,
		AnnotationPatch:     patch,
	}
}
