package controller

import (
	"errors"
	"testing"
	"time"
)

func TestCircuitBreaker_NormalOperation(t *testing.T) {
	cfg := WatchdogConfig{
		MaxConsecutiveFailures: 3,
		HeartbeatTimeout:       5 * time.Second,
		CooloffDuration:        10 * time.Second,
	}
	wb := NewCircuitBreakerWatchdog(cfg)

	action := wb.RecordHeartbeat()
	if action.State != CircuitStateClosed {
		t.Fatalf("expected state CLOSED, got %s", action.State)
	}
	if action.YieldToHPA {
		t.Fatal("expected YieldToHPA to be false")
	}
	if wb.ShouldYieldToHPA() {
		t.Fatal("expected ShouldYieldToHPA to be false")
	}
}

func TestCircuitBreaker_TrippedAfterConsecutiveFailures(t *testing.T) {
	cfg := WatchdogConfig{
		MaxConsecutiveFailures: 3,
		HeartbeatTimeout:       5 * time.Second,
		CooloffDuration:        10 * time.Second,
	}
	wb := NewCircuitBreakerWatchdog(cfg)

	// 1st failure
	a1 := wb.RecordFailure(errors.New("connection refused"))
	if a1.State != CircuitStateClosed || a1.YieldToHPA {
		t.Fatalf("circuit should remain CLOSED on 1st failure: %v", a1)
	}

	// 2nd failure
	a2 := wb.RecordFailure(errors.New("connection reset"))
	if a2.State != CircuitStateClosed || a2.YieldToHPA {
		t.Fatalf("circuit should remain CLOSED on 2nd failure: %v", a2)
	}

	// 3rd failure -> trips to OPEN
	a3 := wb.RecordFailure(errors.New("i/o timeout"))
	if a3.State != CircuitStateOpen {
		t.Fatalf("expected state OPEN on 3rd failure, got %s", a3.State)
	}
	if !a3.YieldToHPA {
		t.Fatal("expected YieldToHPA to be true after tripping")
	}
	if !wb.ShouldYieldToHPA() {
		t.Fatal("expected ShouldYieldToHPA() = true")
	}
	if a3.AnnotationPatch != `{"metadata":{"annotations":{"logstrata.io/yielded-to-hpa":"true"}}}` {
		t.Fatalf("unexpected annotation patch: %s", a3.AnnotationPatch)
	}
}

func TestCircuitBreaker_HeartbeatTimeoutTripping(t *testing.T) {
	cfg := WatchdogConfig{
		MaxConsecutiveFailures: 5,
		HeartbeatTimeout:       50 * time.Millisecond,
		CooloffDuration:        100 * time.Millisecond,
	}
	wb := NewCircuitBreakerWatchdog(cfg)

	time.Sleep(60 * time.Millisecond)
	action := wb.CheckLiveness()

	if action.State != CircuitStateOpen {
		t.Fatalf("expected state OPEN due to heartbeat timeout, got %s", action.State)
	}
	if !action.YieldToHPA {
		t.Fatal("expected YieldToHPA to be true on timeout")
	}
}

func TestCircuitBreaker_RecoveryThroughHalfOpen(t *testing.T) {
	cfg := WatchdogConfig{
		MaxConsecutiveFailures: 2,
		HeartbeatTimeout:       5 * time.Second,
		CooloffDuration:        20 * time.Millisecond,
	}
	wb := NewCircuitBreakerWatchdog(cfg)

	wb.RecordFailure(errors.New("fail 1"))
	wb.RecordFailure(errors.New("fail 2"))
	if wb.GetState() != CircuitStateOpen {
		t.Fatalf("expected OPEN state, got %s", wb.GetState())
	}

	// Wait for cooloff
	time.Sleep(30 * time.Millisecond)
	live := wb.CheckLiveness()
	if live.State != CircuitStateHalfOpen {
		t.Fatalf("expected HALF_OPEN state after cooloff, got %s", live.State)
	}

	// 1st successful probe
	wb.RecordHeartbeat()
	if wb.GetState() != CircuitStateHalfOpen {
		t.Fatalf("expected still HALF_OPEN after 1 success, got %s", wb.GetState())
	}

	// 2nd successful probe -> recovers to CLOSED
	wb.RecordHeartbeat()
	if wb.GetState() != CircuitStateClosed {
		t.Fatalf("expected recovery to CLOSED after 2 successes, got %s", wb.GetState())
	}
	if wb.ShouldYieldToHPA() {
		t.Fatal("expected YieldToHPA to be false after recovery")
	}
}

func TestCircuitBreaker_HalfOpenFailureReTrips(t *testing.T) {
	cfg := WatchdogConfig{
		MaxConsecutiveFailures: 2,
		HeartbeatTimeout:       5 * time.Second,
		CooloffDuration:        10 * time.Millisecond,
	}
	wb := NewCircuitBreakerWatchdog(cfg)

	wb.RecordFailure(errors.New("fail 1"))
	wb.RecordFailure(errors.New("fail 2"))

	time.Sleep(15 * time.Millisecond)
	wb.CheckLiveness() // Transitions to HALF_OPEN

	// Probe fails immediately
	action := wb.RecordFailure(errors.New("failed probe"))
	if action.State != CircuitStateOpen {
		t.Fatalf("expected immediate re-trip to OPEN, got %s", action.State)
	}
}
