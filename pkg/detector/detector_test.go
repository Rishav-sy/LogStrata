package detector

import (
	"testing"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/parser"
)

func TestBruteForceDetection(t *testing.T) {
	cfg := DefaultConfig()
	cfg.BruteForce4xxPerMinuteIP = 5 // lower threshold for test
	det := NewAnomalyDetector(cfg)

	attackerIP := "194.26.29.11"
	now := time.Now()

	var event *ThreatEvent
	for i := 0; i < 5; i++ {
		event = det.InspectLog(&parser.LogRecord{
			Timestamp:  now,
			RemoteIP:   attackerIP,
			StatusCode: 401,
		})
	}

	if event == nil {
		t.Fatalf("expected threat event to be triggered on 5th attempt")
	}

	if event.Type != AnomalyBruteForce {
		t.Errorf("expected AnomalyBruteForce, got %s", event.Type)
	}

	if !det.IsScaleDownLocked() {
		t.Errorf("expected scale down to be locked following threat")
	}

	blocked := det.GetBlockedIPs()
	if len(blocked) != 1 || blocked[0] != attackerIP {
		t.Errorf("expected IP %s in blocked list, got %v", attackerIP, blocked)
	}
}

func TestTrafficSurgeDetection(t *testing.T) {
	cfg := DefaultConfig()
	cfg.SurgeRPSThreshold = 100.0
	cfg.SurgeDeltaRatio = 2.0
	det := NewAnomalyDetector(cfg)

	shortSnap := engine.MetricsSnapshot{
		RPS: 250.0,
	}
	longSnap := engine.MetricsSnapshot{
		RPS: 50.0,
	}

	event := det.EvaluateWindow(shortSnap, longSnap)
	if event == nil {
		t.Fatalf("expected surge event to trigger on 5x jump")
	}

	if event.Type != AnomalyTrafficSurge {
		t.Errorf("expected AnomalyTrafficSurge, got %s", event.Type)
	}
}
