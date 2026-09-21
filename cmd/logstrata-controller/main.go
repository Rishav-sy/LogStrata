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
	listenAddr := flag.String("listen-addr", ":8081", "Controller HTTP status listen address")
	daemonURL := flag.String("daemon-url", "http://localhost:8080/api/v1/status", "URL to LogStrata daemon status endpoint")
	reconcileInterval := flag.Duration("reconcile-interval", 2*time.Second, "Reconciliation loop interval")
	webhookURL := flag.String("webhook-url", "", "Optional webhook URL for scaling and threat notifications")
	targetDeployment := flag.String("target-deployment", "commerce-frontend", "Kubernetes target deployment name")
	flag.Parse()

	log.Println("[LogStrata Controller] Starting Kubernetes Operator Control Loop...")

	cfg := ControllerConfig{
		ListenAddr:        *listenAddr,
		DaemonURL:         *daemonURL,
		ReconcileInterval: *reconcileInterval,
		WebhookURL:        *webhookURL,
		TargetDeployment:  *targetDeployment,
	}

	cs := NewControllerServer(cfg)
	cs.StartReconciliationLoop()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigCh
		log.Println("[LogStrata Controller] Shutting down operator gracefully...")
		cs.Stop()
		os.Exit(0)
	}()

	log.Printf("[LogStrata Controller] Listening on %s (Health: /healthz, Audit: /api/v1/reconciliations)", *listenAddr)
	if err := http.ListenAndServe(*listenAddr, cs); err != nil {
		log.Fatalf("[LogStrata Controller FATAL] Server failed: %v", err)
	}
}
