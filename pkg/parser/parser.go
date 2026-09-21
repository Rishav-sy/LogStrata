package parser

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// LogRecord represents a parsed HTTP access transaction extracted from container stdout.
type LogRecord struct {
	Timestamp  time.Time `json:"timestamp"`
	RemoteIP   string    `json:"remote_ip"`
	Method     string    `json:"method"`
	Path       string    `json:"path"`
	StatusCode int       `json:"status_code"`
	BytesSent  int64     `json:"bytes_sent"`
	LatencyMs  float64   `json:"latency_ms"`
	UserAgent  string    `json:"user_agent"`
	Raw        string    `json:"raw,omitempty"`
}

// Parser defines the interface for parsing container stdout log lines.
type Parser interface {
	Parse(line string) (*LogRecord, error)
}

// AutoParser inspects log line format (CRI wrapper, JSON, or NGINX Combined) and extracts LogRecord.
type AutoParser struct{}

// NewAutoParser creates a new AutoParser instance.
func NewAutoParser() *AutoParser {
	return &AutoParser{}
}

// Parse extracts a LogRecord from raw string lines.
func (p *AutoParser) Parse(line string) (*LogRecord, error) {
	trimmed := strings.TrimSpace(line)
	if len(trimmed) == 0 {
		return nil, fmt.Errorf("empty log line")
	}

	// 1. Unwrap CRI log prefix if present:
	// Example: "2026-09-21T10:00:00.123456789Z stdout F <actual-log>"
	if strings.HasPrefix(trimmed, "20") && len(trimmed) > 35 {
		parts := strings.SplitN(trimmed, " ", 4)
		if len(parts) == 4 && (parts[1] == "stdout" || parts[1] == "stderr") && (parts[2] == "F" || parts[2] == "P") {
			trimmed = strings.TrimSpace(parts[3])
		}
	}

	// 2. Fast Path: JSON formatted access log
	if strings.HasPrefix(trimmed, "{") && strings.HasSuffix(trimmed, "}") {
		return p.parseJSON(trimmed)
	}

	// 3. Fallback: Combined/Common NGINX or Envoy log format
	return p.parseCombined(trimmed)
}

// jsonLogSchema defines common JSON keys used across Kubernetes ingress and services.
type jsonLogSchema struct {
	Timestamp   string          `json:"timestamp"`
	Time        string          `json:"time"`
	Status      json.RawMessage `json:"status"`
	StatusCode  json.RawMessage `json:"status_code"`
	Method      string          `json:"method"`
	Path        string          `json:"path"`
	URI         string          `json:"uri"`
	RequestURI  string          `json:"request_uri"`
	RemoteAddr  string          `json:"remote_addr"`
	ClientIP    string          `json:"client_ip"`
	IP          string          `json:"ip"`
	Latency     json.RawMessage `json:"latency"`
	ReqTime     json.RawMessage `json:"request_time"`
	DurationMs  json.RawMessage `json:"duration_ms"`
	BytesSent   json.RawMessage `json:"bytes_sent"`
	UserAgent   string          `json:"user_agent"`
	Log         string          `json:"log"` // nested Docker/containerd wrapper
}

func (p *AutoParser) parseJSON(raw string) (*LogRecord, error) {
	var s jsonLogSchema
	if err := json.Unmarshal([]byte(raw), &s); err != nil {
		return nil, fmt.Errorf("json parse error: %w", err)
	}

	// Check if this is a Docker daemon JSON wrapper: {"log":"...", "stream":"stdout"}
	if s.Log != "" && s.Method == "" && s.Status == nil {
		return p.Parse(s.Log)
	}

	rec := &LogRecord{
		Timestamp: time.Now(),
		Raw:       raw,
	}

	// Method & Path
	rec.Method = strings.ToUpper(s.Method)
	if rec.Method == "" {
		rec.Method = "GET"
	}
	if s.Path != "" {
		rec.Path = s.Path
	} else if s.URI != "" {
		rec.Path = s.URI
	} else if s.RequestURI != "" {
		rec.Path = s.RequestURI
	} else {
		rec.Path = "/"
	}

	// Remote IP
	if s.RemoteAddr != "" {
		rec.RemoteIP = s.RemoteAddr
	} else if s.ClientIP != "" {
		rec.RemoteIP = s.ClientIP
	} else if s.IP != "" {
		rec.RemoteIP = s.IP
	}

	// Status code parsing
	statusRaw := s.Status
	if len(statusRaw) == 0 {
		statusRaw = s.StatusCode
	}
	if len(statusRaw) > 0 {
		var code int
		if err := json.Unmarshal(statusRaw, &code); err == nil {
			rec.StatusCode = code
		} else {
			var codeStr string
			if err := json.Unmarshal(statusRaw, &codeStr); err == nil {
				rec.StatusCode, _ = strconv.Atoi(codeStr)
			}
		}
	}
	if rec.StatusCode == 0 {
		rec.StatusCode = 200
	}

	// Latency parsing (seconds vs ms)
	latRaw := s.Latency
	if len(latRaw) == 0 {
		latRaw = s.ReqTime
	}
	if len(latRaw) == 0 {
		latRaw = s.DurationMs
	}
	if len(latRaw) > 0 {
		var latFloat float64
		if err := json.Unmarshal(latRaw, &latFloat); err == nil {
			// If latency is < 10.0, assume it is in seconds (e.g. 0.045s -> 45ms)
			if latFloat < 15.0 && len(s.DurationMs) == 0 {
				rec.LatencyMs = latFloat * 1000.0
			} else {
				rec.LatencyMs = latFloat
			}
		} else {
			var latStr string
			if err := json.Unmarshal(latRaw, &latStr); err == nil {
				val, _ := strconv.ParseFloat(latStr, 64)
				if val < 15.0 {
					rec.LatencyMs = val * 1000.0
				} else {
					rec.LatencyMs = val
				}
			}
		}
	}

	rec.UserAgent = s.UserAgent
	return rec, nil
}

// parseCombined parses standard NGINX/Apache combined access logs:
// e.g.: 192.168.1.10 - - [21/Sep/2026:10:00:00 +0000] "GET /checkout HTTP/1.1" 200 1024 "-" "Mozilla/5.0" 0.042
func (p *AutoParser) parseCombined(line string) (*LogRecord, error) {
	rec := &LogRecord{
		Timestamp: time.Now(),
		StatusCode: 200,
		Raw:       line,
	}

	// Extract Remote IP
	firstSpace := strings.IndexByte(line, ' ')
	if firstSpace > 0 {
		rec.RemoteIP = line[:firstSpace]
	}

	// Extract Request Quotes: "GET /path HTTP/1.1"
	firstQuote := strings.IndexByte(line, '"')
	if firstQuote >= 0 {
		remaining := line[firstQuote+1:]
		secondQuote := strings.IndexByte(remaining, '"')
		if secondQuote > 0 {
			reqStr := remaining[:secondQuote]
			reqParts := strings.Split(reqStr, " ")
			if len(reqParts) >= 1 {
				rec.Method = strings.ToUpper(reqParts[0])
			}
			if len(reqParts) >= 2 {
				rec.Path = reqParts[1]
			}

			// Post-request parameters: StatusCode, BytesSent, Duration
			postReq := strings.TrimSpace(remaining[secondQuote+1:])
			fields := strings.Fields(postReq)
			if len(fields) >= 1 {
				rec.StatusCode, _ = strconv.Atoi(fields[0])
			}
			if len(fields) >= 2 {
				rec.BytesSent, _ = strconv.ParseInt(fields[1], 10, 64)
			}
			// Look for floating latency at end of line if present
			if len(fields) >= 3 {
				lastField := fields[len(fields)-1]
				if dur, err := strconv.ParseFloat(lastField, 64); err == nil {
					if dur < 15.0 {
						rec.LatencyMs = dur * 1000.0
					} else {
						rec.LatencyMs = dur
					}
				}
			}
		}
	}

	if rec.Method == "" {
		rec.Method = "GET"
	}
	if rec.Path == "" {
		rec.Path = "/"
	}

	return rec, nil
}
