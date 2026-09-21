package notifier

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestBuildSlackPayload(t *testing.T) {
	d := NewWebhookDispatcher("")

	evt := NotificationEvent{
		Type:      EventThreatDetected,
		Title:     "Brute-Force Anomaly",
		Message:   "Blocked IP 194.26.29.11",
		Workload:  "commerce-frontend",
		Replicas:  6,
		RPS:       1450.0,
		Timestamp: time.Now(),
	}

	payload := d.BuildSlackPayload(evt)
	attachments, ok := payload["attachments"].([]map[string]interface{})
	if !ok || len(attachments) == 0 {
		t.Fatalf("expected attachments in slack payload")
	}

	color := attachments[0]["color"]
	if color != "#e01e5a" {
		t.Errorf("expected red color #e01e5a for threat event, got %v", color)
	}
}

func TestDispatchWebhook(t *testing.T) {
	var receivedPayload map[string]interface{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewDecoder(r.Body).Decode(&receivedPayload)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	d := NewWebhookDispatcher(server.URL)
	evt := NotificationEvent{
		Type:      EventScaleUp,
		Title:     "Scale Up Triggered",
		Workload:  "commerce-frontend",
		Replicas:  9,
		RPS:       850.0,
		Timestamp: time.Now(),
	}

	if err := d.Dispatch(evt); err != nil {
		t.Fatalf("expected dispatch to succeed, got: %v", err)
	}

	if receivedPayload == nil {
		t.Fatalf("expected server to receive payload")
	}
}
