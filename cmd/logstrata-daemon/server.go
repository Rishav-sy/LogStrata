package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/detector"
	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/parser"
	"github.com/Rishav-sy/LogStrata/pkg/scaler"
)

// DaemonConfig contains configuration options for the LogStrata daemon
type DaemonConfig struct {
	ListenAddr        string
	LogFile           string
	MinReplicas       int
	MaxReplicas       int
	TargetRPS         float64
	EvaluationInterval time.Duration
}

// DefaultDaemonConfig provides sensible production defaults
func DefaultDaemonConfig() DaemonConfig {
	return DaemonConfig{
		ListenAddr:        ":8080",
		MinReplicas:       3,
		MaxReplicas:       20,
		TargetRPS:         150.0,
		EvaluationInterval: 1 * time.Second,
	}
}

// DaemonServer encapsulates engines, state, background workers, and HTTP routing
type DaemonServer struct {
	Config          DaemonConfig
	LogParser       *parser.AutoParser
	MetricsEngine   *engine.SlidingWindowEngine
	AnomalyDetector *detector.AnomalyDetector
	DecisionEngine  *scaler.DecisionEngine
	Mux             *http.ServeMux

	mu              sync.RWMutex
	currentReplicas int
	lastDecision    scaler.ScaleDecision
	activeThreats   []detector.ThreatEvent
	totalIngested   int64

	stopCh chan struct{}
}

// NewDaemonServer constructs and initializes an operational DaemonServer
func NewDaemonServer(cfg DaemonConfig) *DaemonServer {
	scalePolicy := scaler.DefaultPolicy()
	scalePolicy.MinReplicas = cfg.MinReplicas
	scalePolicy.MaxReplicas = cfg.MaxReplicas
	scalePolicy.TargetRPSPerPod = cfg.TargetRPS

	ds := &DaemonServer{
		Config:          cfg,
		LogParser:       parser.NewAutoParser(),
		MetricsEngine:   engine.NewSlidingWindowEngine(60),
		AnomalyDetector: detector.NewAnomalyDetector(detector.DefaultConfig()),
		DecisionEngine:  scaler.NewDecisionEngine(scalePolicy),
		Mux:             http.NewServeMux(),
		currentReplicas: cfg.MinReplicas,
		stopCh:          make(chan struct{}),
	}

	ds.registerRoutes()
	return ds
}

// ProcessLine feeds a single log line through parser, metrics engine, and threat detector
func (ds *DaemonServer) ProcessLine(line string) {
	rec, err := ds.LogParser.Parse(line)
	if err != nil {
		return
	}

	ds.MetricsEngine.Record(rec)

	ds.mu.Lock()
	ds.totalIngested++
	ds.mu.Unlock()

	if threat := ds.AnomalyDetector.InspectLog(rec); threat != nil {
		ds.mu.Lock()
		ds.activeThreats = append(ds.activeThreats, *threat)
		if len(ds.activeThreats) > 20 {
			ds.activeThreats = ds.activeThreats[1:]
		}
		ds.mu.Unlock()
		log.Printf("[THREAT DETECTED] %s - %s (Offenders: %v)", threat.Type, threat.Description, threat.OffenderIPs)
	}
}

// StartEvaluationLoop runs periodic anomaly detection and autoscaling calculations
func (ds *DaemonServer) StartEvaluationLoop() {
	ticker := time.NewTicker(ds.Config.EvaluationInterval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ds.stopCh:
				return
			case <-ticker.C:
				shortSnap := ds.MetricsEngine.GetSnapshot(5)
				longSnap := ds.MetricsEngine.GetSnapshot(30)

				if threat := ds.AnomalyDetector.EvaluateWindow(shortSnap, longSnap); threat != nil {
					ds.mu.Lock()
					ds.activeThreats = append(ds.activeThreats, *threat)
					ds.mu.Unlock()
					log.Printf("[ANOMALY DETECTED] %s: %s", threat.Type, threat.Description)
				}

				ds.mu.Lock()
				isLocked := ds.AnomalyDetector.IsScaleDownLocked()
				dec := ds.DecisionEngine.Evaluate(ds.currentReplicas, shortSnap, isLocked)
				if dec.Action == "SCALE_UP" || dec.Action == "SCALE_DOWN" {
					ds.currentReplicas = dec.DesiredReplicas
					log.Printf("[AUTOSCALER DECISION] %s -> Target Replicas: %d (Current RPS: %.1f, Reason: %s)",
						dec.Action, dec.DesiredReplicas, dec.RPS, dec.Reason)
				}
				ds.lastDecision = dec
				ds.mu.Unlock()
			}
		}
	}()
}

// StartFileTailer opens and tails the specified log file in background
func (ds *DaemonServer) StartFileTailer(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}

	go func() {
		defer file.Close()
		reader := bufio.NewReader(file)
		log.Printf("[LogStrata] Tailing log file: %s", path)
		for {
			select {
			case <-ds.stopCh:
				return
			default:
				line, err := reader.ReadString('\n')
				if len(line) > 0 {
					ds.ProcessLine(line)
				}
				if err != nil {
					time.Sleep(100 * time.Millisecond)
				}
			}
		}
	}()
	return nil
}

// Stop shuts down background evaluation and tailers
func (ds *DaemonServer) Stop() {
	select {
	case <-ds.stopCh:
		// already closed
	default:
		close(ds.stopCh)
	}
}

// ServeHTTP satisfies http.Handler interface
func (ds *DaemonServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ds.Mux.ServeHTTP(w, r)
}

func (ds *DaemonServer) registerRoutes() {
	ds.Mux.HandleFunc("/healthz", ds.handleHealthz)
	ds.Mux.HandleFunc("/api/v1/ingest", ds.handleIngest)
	ds.Mux.HandleFunc("/api/v1/status", ds.handleStatus)
	ds.Mux.HandleFunc("/metrics", ds.handleMetrics)
	ds.Mux.HandleFunc("/api/v1/stream", ds.handleStream)
}

func (ds *DaemonServer) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK\n"))
}

func (ds *DaemonServer) handleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	scanner := bufio.NewScanner(r.Body)
	count := 0
	for scanner.Scan() {
		ds.ProcessLine(scanner.Text())
		count++
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = fmt.Fprintf(w, `{"status":"ingested","lines":%d}`+"\n", count)
}

func (ds *DaemonServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	snap := ds.MetricsEngine.GetSnapshot(15)

	resp := map[string]interface{}{
		"status":                 "HEALTHY",
		"total_ingested":         ds.totalIngested,
		"current_replicas":       ds.currentReplicas,
		"target_replicas":        ds.lastDecision.DesiredReplicas,
		"last_decision_action":   ds.lastDecision.Action,
		"last_decision_reason":   ds.lastDecision.Reason,
		"rps":                    snap.RPS,
		"p50_latency_ms":         snap.P50LatencyMs,
		"p95_latency_ms":         snap.P95LatencyMs,
		"p99_latency_ms":         snap.P99LatencyMs,
		"error_rate_5xx_percent": snap.ErrorRate5xxPercent,
		"blocked_ips":            ds.AnomalyDetector.GetBlockedIPs(),
		"scale_down_locked":      ds.AnomalyDetector.IsScaleDownLocked(),
		"recent_threats":         ds.activeThreats,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (ds *DaemonServer) handleMetrics(w http.ResponseWriter, r *http.Request) {
	ds.mu.RLock()
	defer ds.mu.RUnlock()
	snap := ds.MetricsEngine.GetSnapshot(15)

	var b strings.Builder
	b.WriteString("# HELP logstrata_total_ingested Total log lines parsed\n")
	b.WriteString("# TYPE logstrata_total_ingested counter\n")
	b.WriteString(fmt.Sprintf("logstrata_total_ingested %d\n\n", ds.totalIngested))

	b.WriteString("# HELP logstrata_current_replicas Current active workload replicas\n")
	b.WriteString("# TYPE logstrata_current_replicas gauge\n")
	b.WriteString(fmt.Sprintf("logstrata_current_replicas %d\n\n", ds.currentReplicas))

	b.WriteString("# HELP logstrata_desired_replicas Target desired workload replicas\n")
	b.WriteString("# TYPE logstrata_desired_replicas gauge\n")
	b.WriteString(fmt.Sprintf("logstrata_desired_replicas %d\n\n", ds.lastDecision.DesiredReplicas))

	b.WriteString("# HELP logstrata_rps Current requests per second\n")
	b.WriteString("# TYPE logstrata_rps gauge\n")
	b.WriteString(fmt.Sprintf("logstrata_rps %.2f\n\n", snap.RPS))

	b.WriteString("# HELP logstrata_p95_latency_ms Rolling P95 latency in ms\n")
	b.WriteString("# TYPE logstrata_p95_latency_ms gauge\n")
	b.WriteString(fmt.Sprintf("logstrata_p95_latency_ms %.2f\n\n", snap.P95LatencyMs))

	b.WriteString("# HELP logstrata_blocked_ips_count Active blocked offender IPs\n")
	b.WriteString("# TYPE logstrata_blocked_ips_count gauge\n")
	b.WriteString(fmt.Sprintf("logstrata_blocked_ips_count %d\n", len(ds.AnomalyDetector.GetBlockedIPs())))

	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	_, _ = w.Write([]byte(b.String()))
}

func (ds *DaemonServer) handleStream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ds.mu.RLock()
			snap := ds.MetricsEngine.GetSnapshot(5)
			payload, _ := json.Marshal(map[string]interface{}{
				"timestamp":              time.Now().UTC().Format(time.RFC3339),
				"total_ingested":         ds.totalIngested,
				"current_replicas":       ds.currentReplicas,
				"target_replicas":        ds.lastDecision.DesiredReplicas,
				"last_decision_action":   ds.lastDecision.Action,
				"last_decision_reason":   ds.lastDecision.Reason,
				"rps":                    snap.RPS,
				"p50_latency_ms":         snap.P50LatencyMs,
				"p95_latency_ms":         snap.P95LatencyMs,
				"p99_latency_ms":         snap.P99LatencyMs,
				"error_rate_5xx_percent": snap.ErrorRate5xxPercent,
				"blocked_ips_count":      len(ds.AnomalyDetector.GetBlockedIPs()),
				"scale_down_locked":      ds.AnomalyDetector.IsScaleDownLocked(),
			})
			ds.mu.RUnlock()

			_, _ = fmt.Fprintf(w, "data: %s\n\n", payload)
			flusher.Flush()
		}
	}
}
