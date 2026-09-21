package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	listenAddr := flag.String("listen-addr", ":8080", "HTTP server listen address")
	logFile := flag.String("log-file", "", "Path to container stdout log file to tail (empty for stdin/HTTP only)")
	minReplicas := flag.Int("min-replicas", 3, "Minimum replica count")
	maxReplicas := flag.Int("max-replicas", 20, "Maximum replica count")
	targetRPS := flag.Float64("target-rps-per-pod", 150.0, "Target RPS capacity per pod")
	flag.Parse()

	log.Println("[LogStrata] Initializing Log-Driven Scaling & Threat Mitigation Daemon...")

	cfg := DaemonConfig{
		ListenAddr:         *listenAddr,
		LogFile:            *logFile,
		MinReplicas:        *minReplicas,
		MaxReplicas:        *maxReplicas,
		TargetRPS:          *targetRPS,
		EvaluationInterval: 1 * time.Second,
	}

	ds := NewDaemonServer(cfg)
	ds.StartEvaluationLoop()

	if *logFile != "" {
		if err := ds.StartFileTailer(*logFile); err != nil {
			log.Printf("[LogStrata ERROR] Could not tail log file %s: %v", *logFile, err)
		}
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigCh
		log.Println("[LogStrata] Gracefully shutting down daemon...")
		ds.Stop()
		os.Exit(0)
	}()

	log.Printf("[LogStrata] Daemon listening on %s (Metrics: /metrics, Status: /api/v1/status, Stream: /api/v1/stream)", *listenAddr)
	if err := http.ListenAndServe(*listenAddr, ds); err != nil {
		log.Fatalf("[LogStrata FATAL] Server failed: %v", err)
	}
}
