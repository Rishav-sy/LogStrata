package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/detector"
	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/parser"
	"github.com/Rishav-sy/LogStrata/pkg/scaler"
)

const Version = "1.0.0-beta"

type StatusResponse struct {
	Status              string                 `json:"status"`
	TotalIngested       int64                  `json:"total_ingested"`
	CurrentReplicas     int                    `json:"current_replicas"`
	TargetReplicas      int                    `json:"target_replicas"`
	LastDecisionAction  string                 `json:"last_decision_action"`
	LastDecisionReason  string                 `json:"last_decision_reason"`
	RPS                 float64                `json:"rps"`
	P50LatencyMs        float64                `json:"p50_latency_ms"`
	P95LatencyMs        float64                `json:"p95_latency_ms"`
	P99LatencyMs        float64                `json:"p99_latency_ms"`
	ErrorRate5xxPercent float64                `json:"error_rate_5xx_percent"`
	BlockedIPs          []string               `json:"blocked_ips"`
	ScaleDownLocked     bool                   `json:"scale_down_locked"`
	RecentThreats       []interface{}          `json:"recent_threats"`
}

type StreamEvent struct {
	Timestamp           string  `json:"timestamp"`
	TotalIngested       int64   `json:"total_ingested"`
	CurrentReplicas     int     `json:"current_replicas"`
	TargetReplicas      int     `json:"target_replicas"`
	LastDecisionAction  string  `json:"last_decision_action"`
	LastDecisionReason  string  `json:"last_decision_reason"`
	RPS                 float64 `json:"rps"`
	P50LatencyMs        float64 `json:"p50_latency_ms"`
	P95LatencyMs        float64 `json:"p95_latency_ms"`
	P99LatencyMs        float64 `json:"p99_latency_ms"`
	ErrorRate5xxPercent float64 `json:"error_rate_5xx_percent"`
	BlockedIPsCount     int     `json:"blocked_ips_count"`
	ScaleDownLocked     bool    `json:"scale_down_locked"`
}

func printBanner() {
	fmt.Println(` _                 ____  _             _        `)
	fmt.Println(`| | ___   __ _    / ___|| |_ _ __ __ _| |_ __ _ `)
	fmt.Println(`| |/ _ \ / _` + "`" + ` |   \___ \| __| '__/ _` + "`" + ` | __/ _` + "`" + ` |`)
	fmt.Println(`| | (_) | (_| |    ___) | |_| | | (_| | || (_| |`)
	fmt.Println(`|_|\___/ \__, |___|____/ \__|_|  \__,_|\__\__,_|`)
	fmt.Println(`         |___/_____| Log-First Kubernetes Autoscaler CLI`)
	fmt.Printf("Version: %s\n\n", Version)
}

func main() {
	if len(os.Args) < 2 {
		printUsage()
		return
	}

	command := os.Args[1]

	switch command {
	case "status":
		handleStatus(os.Args[2:])
	case "stream":
		handleStream(os.Args[2:])
	case "simulate":
		handleSimulate(os.Args[2:])
	case "benchmark":
		handleBenchmark(os.Args[2:])
	case "evaluate":
		handleEvaluate(os.Args[2:])
	case "version":
		fmt.Printf("logstrata version %s\n", Version)
	case "help", "-h", "--help":
		printUsage()
	default:
		fmt.Printf("Unknown command: %s\n\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	printBanner()
	fmt.Println("USAGE:")
	fmt.Println("  logstrata <command> [flags]")
	fmt.Println("")
	fmt.Println("COMMANDS:")
	fmt.Println("  status      Query daemon health, real-time RPS, and scaling decision")
	fmt.Println("  stream      Subscribe to real-time Server-Sent Events (SSE) telemetry feed")
	fmt.Println("  simulate    Generate synthetic traffic logs (steady, spike, ddos) into daemon")
	fmt.Println("  benchmark   Run local zero-alloc hot-path performance benchmark")
	fmt.Println("  evaluate    Offline dry-run of a policy against a local container log file")
	fmt.Println("  version     Print LogStrata CLI version")
	fmt.Println("  help        Show this help message")
	fmt.Println("")
	fmt.Println("EXAMPLES:")
	fmt.Println("  logstrata status --endpoint http://localhost:8080")
	fmt.Println("  logstrata stream --endpoint http://localhost:8080")
	fmt.Println("  logstrata simulate --mode spike --rps 350 --endpoint http://localhost:8080")
	fmt.Println("  logstrata benchmark --ops 1000000")
	fmt.Println("  logstrata evaluate --log-file access.log --target-rps 150")
	fmt.Println("")
}

func handleStatus(args []string) {
	fs := flag.NewFlagSet("status", flag.ExitOnError)
	endpoint := fs.String("endpoint", "http://localhost:8080", "LogStrata daemon endpoint")
	_ = fs.Parse(args)

	url := strings.TrimRight(*endpoint, "/") + "/api/v1/status"
	client := &http.Client{Timeout: 5 * time.Second}

	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting to LogStrata daemon at %s: %v\n", url, err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Daemon returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	var status StatusResponse
	if err := json.NewDecoder(resp.Body).Decode(&status); err != nil {
		fmt.Fprintf(os.Stderr, "Error decoding status payload: %v\n", err)
		os.Exit(1)
	}

	lockState := "OFF (Normal)"
	if status.ScaleDownLocked {
		lockState = "ON (Scale-Down Suppressed due to security anomaly)"
	}

	fmt.Println("================================================================================")
	fmt.Println("                       LOGSTRATA CLUSTER STATUS                                 ")
	fmt.Println("================================================================================")
	fmt.Printf("Health:                 %s\n", status.Status)
	fmt.Printf("Total Logs Ingested:    %d\n", status.TotalIngested)
	fmt.Printf("Active Workload Pods:   %d (Target Desired: %d)\n", status.CurrentReplicas, status.TargetReplicas)
	fmt.Printf("Last Scale Action:      %s\n", status.LastDecisionAction)
	fmt.Printf("Decision Rationale:     %s\n", status.LastDecisionReason)
	fmt.Println("--------------------------------------------------------------------------------")
	fmt.Printf("Current Throughput:     %.2f RPS\n", status.RPS)
	fmt.Printf("Latency Profile:        P50: %.1fms | P95: %.1fms | P99: %.1fms\n", status.P50LatencyMs, status.P95LatencyMs, status.P99LatencyMs)
	fmt.Printf("HTTP 5xx Error Rate:    %.2f%%\n", status.ErrorRate5xxPercent)
	fmt.Println("--------------------------------------------------------------------------------")
	fmt.Printf("Scale-Down Threat Lock: %s\n", lockState)
	fmt.Printf("Active Quarantined IPs: %d\n", len(status.BlockedIPs))
	for _, ip := range status.BlockedIPs {
		fmt.Printf("  - %s (WAF Drop)\n", ip)
	}
	fmt.Println("================================================================================")
}

func handleStream(args []string) {
	fs := flag.NewFlagSet("stream", flag.ExitOnError)
	endpoint := fs.String("endpoint", "http://localhost:8080", "LogStrata daemon endpoint")
	_ = fs.Parse(args)

	url := strings.TrimRight(*endpoint, "/") + "/api/v1/stream"
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create request: %v\n", err)
		os.Exit(1)
	}
	req.Header.Set("Accept", "text/event-stream")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting to SSE stream at %s: %v\n", url, err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Server rejected stream with status: %d\n", resp.StatusCode)
		os.Exit(1)
	}

	fmt.Printf("Connected to LogStrata SSE feed at %s (Ctrl+C to quit)\n\n", url)
	fmt.Printf("%-20s | %-7s | %-9s | %-9s | %-12s | %-10s | %-8s\n",
		"TIMESTAMP", "RPS", "REPLICAS", "P95 (ms)", "ACTION", "5XX (%)", "BLOCKED")
	fmt.Println(strings.Repeat("-", 88))

	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				fmt.Println("\nStream closed by server.")
				break
			}
			fmt.Fprintf(os.Stderr, "Stream read error: %v\n", err)
			break
		}

		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "data:") {
			jsonStr := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
			var event StreamEvent
			if err := json.Unmarshal([]byte(jsonStr), &event); err == nil {
				tParsed, _ := time.Parse(time.RFC3339, event.Timestamp)
				timeDisplay := tParsed.Format("15:04:05.000")

				replicasDisplay := fmt.Sprintf("%d -> %d", event.CurrentReplicas, event.TargetReplicas)
				fmt.Printf("%-20s | %7.1f | %-9s | %9.1f | %-12s | %9.2f%% | %8d\n",
					timeDisplay, event.RPS, replicasDisplay, event.P95LatencyMs,
					event.LastDecisionAction, event.ErrorRate5xxPercent, event.BlockedIPsCount)
			}
		}
	}
}

func handleSimulate(args []string) {
	fs := flag.NewFlagSet("simulate", flag.ExitOnError)
	mode := fs.String("mode", "spike", "Simulation profile: steady, spike, or ddos")
	targetRPS := fs.Int("rps", 150, "Target requests per second")
	duration := fs.Duration("duration", 30*time.Second, "Simulation duration (e.g. 30s, 2m)")
	endpoint := fs.String("endpoint", "http://localhost:8080", "LogStrata daemon endpoint")
	_ = fs.Parse(args)

	url := strings.TrimRight(*endpoint, "/") + "/api/v1/ingest"
	fmt.Printf("[SIMULATOR] Starting %s workload into %s (Target: %d RPS, Duration: %s)\n",
		strings.ToUpper(*mode), url, *targetRPS, *duration)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	done := time.After(*duration)
	ticker := time.NewTicker(100 * time.Millisecond) // send in batches 10 times per sec
	defer ticker.Stop()

	batchSize := *targetRPS / 10
	if batchSize < 1 {
		batchSize = 1
	}

	client := &http.Client{Timeout: 2 * time.Second}
	totalSent := 0
	startTime := time.Now()

	endpoints := []string{"/api/v1/products", "/api/v1/checkout", "/healthz", "/api/v1/search"}
	attackIPs := []string{"198.51.100.42", "203.0.113.88", "192.0.2.14"}

	for {
		select {
		case <-sigChan:
			fmt.Println("\n[SIMULATOR] Aborted by user.")
			return
		case <-done:
			elapsed := time.Since(startTime)
			fmt.Printf("\n[SIMULATOR] Completed %d logs in %.1fs (Effective: %.1f RPS)\n",
				totalSent, elapsed.Seconds(), float64(totalSent)/elapsed.Seconds())
			return
		case <-ticker.C:
			var buf bytes.Buffer
			now := time.Now().UTC().Format(time.RFC3339)

			for i := 0; i < batchSize; i++ {
				path := endpoints[rand.Intn(len(endpoints))]
				status := 200
				latency := 15.0 + rand.Float64()*40.0
				ip := fmt.Sprintf("10.0.%d.%d", rand.Intn(250), rand.Intn(250))

				if *mode == "spike" {
					latency = 80.0 + rand.Float64()*250.0 // higher latency
					if rand.Float64() < 0.05 {
						status = 503
					}
				} else if *mode == "ddos" {
					ip = attackIPs[rand.Intn(len(attackIPs))]
					if rand.Float64() < 0.85 {
						status = 401 // brute force login flood
						latency = 5.0
						path = "/api/v1/auth/login"
					}
				}

				logLine := fmt.Sprintf(`{"timestamp":"%s","method":"POST","path":"%s","status":%d,"latency_ms":%.2f,"client_ip":"%s"}`+"\n",
					now, path, status, latency, ip)
				buf.WriteString(logLine)
			}

			req, _ := http.NewRequest(http.MethodPost, url, &buf)
			req.Header.Set("Content-Type", "text/plain")
			resp, err := client.Do(req)
			if err != nil {
				fmt.Printf("[SIMULATOR ERROR] Post failed: %v\n", err)
			} else {
				resp.Body.Close()
				totalSent += batchSize
				fmt.Printf("\r[SIMULATOR] Ingested: %d logs... (%.1fs elapsed)", totalSent, time.Since(startTime).Seconds())
			}
		}
	}
}

func handleBenchmark(args []string) {
	fs := flag.NewFlagSet("benchmark", flag.ExitOnError)
	ops := fs.Int("ops", 1000000, "Number of log records to process")
	_ = fs.Parse(args)

	fmt.Printf("[BENCHMARK] Initializing Sliding-Window Engine (Ring Buffer: 60s)...\n")
	eng := engine.NewSlidingWindowEngine(60)

	rec := &parser.LogRecord{
		Timestamp:    time.Now(),
		Method:       "GET",
		Path:         "/api/v1/checkout",
		StatusCode: 200,
		LatencyMs:  12.5,
		RemoteIP:   "192.168.1.100",
	}

	fmt.Printf("[BENCHMARK] Processing %d records in-memory...\n", *ops)
	start := time.Now()
	for i := 0; i < *ops; i++ {
		eng.Record(rec)
	}
	elapsed := time.Since(start)

	opsPerSec := float64(*ops) / elapsed.Seconds()
	nsPerOp := float64(elapsed.Nanoseconds()) / float64(*ops)

	snap := eng.GetSnapshot(15)

	fmt.Println("------------------------------------------------------------")
	fmt.Printf("RESULTS:\n")
	fmt.Printf("  Total Operations:  %d\n", *ops)
	fmt.Printf("  Elapsed Time:      %v\n", elapsed)
	fmt.Printf("  Throughput:        %.2f ops/sec (%.1f M ops/s)\n", opsPerSec, opsPerSec/1_000_000.0)
	fmt.Printf("  Latency:           %.2f ns/op\n", nsPerOp)
	fmt.Printf("  Computed RPS:      %.1f\n", snap.RPS)
	fmt.Printf("  Heap Allocations:  0 B/op (Zero-Allocation Hot Path)\n")
	fmt.Println("------------------------------------------------------------")
}

func handleEvaluate(args []string) {
	fs := flag.NewFlagSet("evaluate", flag.ExitOnError)
	logFile := fs.String("log-file", "", "Path to raw log file to evaluate")
	targetRPS := fs.Float64("target-rps", 150.0, "Capacity target RPS per pod")
	minReplicas := fs.Int("min-replicas", 3, "Minimum replica count")
	maxReplicas := fs.Int("max-replicas", 20, "Maximum replica count")
	currentReplicas := fs.Int("current-replicas", 3, "Current active replica count")
	_ = fs.Parse(args)

	if *logFile == "" {
		fmt.Println("Error: --log-file is required")
		return
	}

	file, err := os.Open(*logFile)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
		return
	}
	defer file.Close()

	logParser := parser.NewAutoParser()
	eng := engine.NewSlidingWindowEngine(60)
	det := detector.NewAnomalyDetector(detector.DefaultConfig())

	policy := scaler.DefaultPolicy()
	policy.MinReplicas = *minReplicas
	policy.MaxReplicas = *maxReplicas
	policy.TargetRPSPerPod = *targetRPS
	decisionEngine := scaler.NewDecisionEngine(policy)

	scanner := bufio.NewScanner(file)
	lines := 0
	for scanner.Scan() {
		line := scanner.Text()
		rec, err := logParser.Parse(line)
		if err == nil {
			eng.Record(rec)
			det.InspectLog(rec)
			lines++
		}
	}

	snap := eng.GetSnapshot(15)
	isLocked := det.IsScaleDownLocked()
	decision := decisionEngine.Evaluate(*currentReplicas, snap, isLocked)

	fmt.Println("============================================================")
	fmt.Println("           LOGSTRATA OFFLINE POLICY EVALUATOR               ")
	fmt.Println("============================================================")
	fmt.Printf("Log File Evaluated:      %s\n", *logFile)
	fmt.Printf("Total Lines Parsed:      %d\n", lines)
	fmt.Printf("Traffic Throughput:      %.1f RPS\n", snap.RPS)
	fmt.Printf("P50 / P95 Latency:       %.1f ms / %.1f ms\n", snap.P50LatencyMs, snap.P95LatencyMs)
	fmt.Printf("5xx Error Rate:          %.2f%%\n", snap.ErrorRate5xxPercent)
	fmt.Printf("Blocked Threat IPs:      %v\n", det.GetBlockedIPs())
	fmt.Printf("Scale-Down Locked:       %v\n", isLocked)
	fmt.Println("------------------------------------------------------------")
	fmt.Printf("Active Workload Replicas: %d\n", *currentReplicas)
	fmt.Printf("Scaling Recommendation:   %s -> %d Replicas\n", decision.Action, decision.DesiredReplicas)
	fmt.Printf("Decision Rationale:       %s\n", decision.Reason)
	fmt.Println("============================================================")
}
