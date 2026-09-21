package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"io"
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

type DaemonState struct {
	mu              sync.RWMutex
	currentReplicas int
	lastDecision    scaler.ScaleDecision
	activeThreats   []detector.ThreatEvent
	totalIngested   int64
}

func main() {
	listenAddr := flag.String("listen-addr", ":8080", "HTTP server listen address")
	logFile := flag.String("log-file", "", "Path to container stdout log file to tail (empty for stdin/HTTP only)")
	minReplicas := flag.Int("min-replicas", 3, "Minimum replica count")
	maxReplicas := flag.Int("max-replicas", 20, "Maximum replica count")
	targetRPS := flag.Float64("target-rps-per-pod", 150.0, "Target RPS capacity per pod")
	flag.Parse()

	log.Println("[LogStrata] Initializing Log-Driven Scaling & Threat Mitigation Daemon...")

	// 1. Initialize Engines
	logParser := parser.NewAutoParser()
	metricsEngine := engine.NewSlidingWindowEngine(60)
	anomalyDetector := detector.NewAnomalyDetector(detector.DefaultConfig())

	scalePolicy := scaler.DefaultPolicy()
	scalePolicy.MinReplicas = *minReplicas
	scalePolicy.MaxReplicas = *maxReplicas
	scalePolicy.TargetRPSPerPod = *targetRPS
	decisionEngine := scaler.NewDecisionEngine(scalePolicy)

	state := &DaemonState{
		currentReplicas: *minReplicas,
	}

	// 2. Log processing function
	processLine := func(line string) {
		rec, err := logParser.Parse(line)
		if err != nil {
			return
		}

		metricsEngine.Record(rec)

		state.mu.Lock()
		state.totalIngested++
		state.mu.Unlock()

		if threat := anomalyDetector.InspectLog(rec); threat != nil {
			state.mu.Lock()
			state.activeThreats = append(state.activeThreats, *threat)
			if len(state.activeThreats) > 20 {
				state.activeThreats = state.activeThreats[1:]
			}
			state.mu.Unlock()
			log.Printf("[THREAT DETECTED] %s - %s (Offenders: %v)", threat.Type, threat.Description, threat.OffenderIPs)
		}
	}

	// 3. Optional log file / stdin tailer
	if *logFile != "" {
		go func() {
			file, err := os.Open(*logFile)
			if err != nil {
				log.Printf("[LogStrata ERROR] Could not open log file %s: %v", *logFile, err)
				return
			}
			defer file.Close()

			reader := bufio.NewReader(file)
			log.Printf("[LogStrata] Tailing log file: %s", *logFile)
			for {
				line, err := reader.ReadString('\n')
				if len(line) > 0 {
					processLine(line)
				}
				if err != nil {
					if err == io.EOF {
						time.Sleep(100 * time.Millisecond)
						continue
					}
					break
				}
			}
		}()
	}

	// 4. Background Evaluation Control Loop (Every 1 second)
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			shortSnap := metricsEngine.GetSnapshot(5)
			longSnap := metricsEngine.GetSnapshot(30)

			// Macro anomaly checks
			if threat := anomalyDetector.EvaluateWindow(shortSnap, longSnap); threat != nil {
				state.mu.Lock()
				state.activeThreats = append(state.activeThreats, *threat)
				state.mu.Unlock()
				log.Printf("[ANOMALY DETECTED] %s: %s", threat.Type, threat.Description)
			}

			// Scaling evaluation
			state.mu.Lock()
			isLocked := anomalyDetector.IsScaleDownLocked()
			dec := decisionEngine.Evaluate(state.currentReplicas, shortSnap, isLocked)
			if dec.Action == "SCALE_UP" || dec.Action == "SCALE_DOWN" {
				state.currentReplicas = dec.DesiredReplicas
				log.Printf("[AUTOSCALER DECISION] %s -> Target Replicas: %d (Current RPS: %.1f, Reason: %s)",
					dec.Action, dec.DesiredReplicas, dec.RPS, dec.Reason)
			}
			state.lastDecision = dec
			state.mu.Unlock()
		}
	}()

	// 5. HTTP Endpoints
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK\n"))
	})

	http.HandleFunc("/api/v1/ingest", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		scanner := bufio.NewScanner(r.Body)
		count := 0
		for scanner.Scan() {
			processLine(scanner.Text())
			count++
		}

		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprintf(w, `{"status":"ingested","lines":%d}`+"\n", count)
	})

	http.HandleFunc("/api/v1/status", func(w http.ResponseWriter, r *http.Request) {
		state.mu.RLock()
		defer state.mu.RUnlock()

		snap := metricsEngine.GetSnapshot(15)

		resp := map[string]interface{}{
			"status":                 "HEALTHY",
			"total_ingested":         state.totalIngested,
			"current_replicas":       state.currentReplicas,
			"target_replicas":        state.lastDecision.DesiredReplicas,
			"last_decision_action":   state.lastDecision.Action,
			"last_decision_reason":   state.lastDecision.Reason,
			"rps":                    snap.RPS,
			"p50_latency_ms":         snap.P50LatencyMs,
			"p95_latency_ms":         snap.P95LatencyMs,
			"p99_latency_ms":         snap.P99LatencyMs,
			"error_rate_5xx_percent": snap.ErrorRate5xxPercent,
			"blocked_ips":            anomalyDetector.GetBlockedIPs(),
			"scale_down_locked":      anomalyDetector.IsScaleDownLocked(),
			"recent_threats":         state.activeThreats,
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	})

	http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		state.mu.RLock()
		defer state.mu.RUnlock()
		snap := metricsEngine.GetSnapshot(15)

		var b strings.Builder
		b.WriteString("# HELP logstrata_total_ingested Total log lines parsed\n")
		b.WriteString("# TYPE logstrata_total_ingested counter\n")
		b.WriteString(fmt.Sprintf("logstrata_total_ingested %d\n\n", state.totalIngested))

		b.WriteString("# HELP logstrata_current_replicas Current active workload replicas\n")
		b.WriteString("# TYPE logstrata_current_replicas gauge\n")
		b.WriteString(fmt.Sprintf("logstrata_current_replicas %d\n\n", state.currentReplicas))

		b.WriteString("# HELP logstrata_desired_replicas Target desired workload replicas\n")
		b.WriteString("# TYPE logstrata_desired_replicas gauge\n")
		b.WriteString(fmt.Sprintf("logstrata_desired_replicas %d\n\n", state.lastDecision.DesiredReplicas))

		b.WriteString("# HELP logstrata_rps Current requests per second\n")
		b.WriteString("# TYPE logstrata_rps gauge\n")
		b.WriteString(fmt.Sprintf("logstrata_rps %.2f\n\n", snap.RPS))

		b.WriteString("# HELP logstrata_p95_latency_ms Rolling P95 latency in ms\n")
		b.WriteString("# TYPE logstrata_p95_latency_ms gauge\n")
		b.WriteString(fmt.Sprintf("logstrata_p95_latency_ms %.2f\n\n", snap.P95LatencyMs))

		b.WriteString("# HELP logstrata_blocked_ips_count Active blocked offender IPs\n")
		b.WriteString("# TYPE logstrata_blocked_ips_count gauge\n")
		b.WriteString(fmt.Sprintf("logstrata_blocked_ips_count %d\n", len(anomalyDetector.GetBlockedIPs())))

		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		_, _ = w.Write([]byte(b.String()))
	})

	log.Printf("[LogStrata] Daemon listening on %s (Metrics: /metrics, Status: /api/v1/status)", *listenAddr)
	if err := http.ListenAndServe(*listenAddr, nil); err != nil {
		log.Fatalf("[LogStrata FATAL] Server failed: %v", err)
	}
}
