package notifier

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// EventType categorizes dispatch notifications.
type EventType string

const (
	EventScaleUp         EventType = "SCALE_UP"
	EventScaleDown       EventType = "SCALE_DOWN"
	EventThreatDetected  EventType = "THREAT_DETECTED"
	EventScaleDownLocked EventType = "SCALE_DOWN_LOCKED"
)

// NotificationEvent represents an incident or scaling state payload.
type NotificationEvent struct {
	Type        EventType `json:"type"`
	Title       string    `json:"title"`
	Message     string    `json:"message"`
	Workload    string    `json:"workload"`
	Replicas    int       `json:"replicas"`
	RPS         float64   `json:"rps"`
	OffenderIPs []string  `json:"offender_ips,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
}

// WebhookDispatcher delivers alerts to configured notification targets.
type WebhookDispatcher struct {
	client     *http.Client
	webhookURL string
}

// NewWebhookDispatcher creates a dispatcher instance.
func NewWebhookDispatcher(webhookURL string) *WebhookDispatcher {
	return &WebhookDispatcher{
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		webhookURL: webhookURL,
	}
}

// BuildSlackPayload formats the notification as a rich Slack incoming webhook payload.
func (d *WebhookDispatcher) BuildSlackPayload(evt NotificationEvent) map[string]interface{} {
	color := "#36a64f" // Green
	if evt.Type == EventThreatDetected {
		color = "#e01e5a" // Red
	} else if evt.Type == EventScaleDownLocked {
		color = "#ecb22e" // Amber
	}

	return map[string]interface{}{
		"text": fmt.Sprintf("*[LogStrata Alert]* %s: %s", evt.Type, evt.Title),
		"attachments": []map[string]interface{}{
			{
				"color": color,
				"fields": []map[string]interface{}{
					{"title": "Workload", "value": evt.Workload, "short": true},
					{"title": "Target Replicas", "value": fmt.Sprintf("%d", evt.Replicas), "short": true},
					{"title": "Current RPS", "value": fmt.Sprintf("%.1f", evt.RPS), "short": true},
					{"title": "Details", "value": evt.Message, "short": false},
				},
				"footer": "LogStrata Intelligent Cluster Autoscaler",
				"ts":     evt.Timestamp.Unix(),
			},
		},
	}
}

// Dispatch sends the event to the configured webhook endpoint if present.
func (d *WebhookDispatcher) Dispatch(evt NotificationEvent) error {
	if d.webhookURL == "" {
		return nil
	}

	payload := d.BuildSlackPayload(evt)
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload error: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, d.webhookURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("create request error: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := d.client.Do(req)
	if err != nil {
		return fmt.Errorf("dispatch webhook error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("webhook responded with status: %d", resp.StatusCode)
	}

	return nil
}
