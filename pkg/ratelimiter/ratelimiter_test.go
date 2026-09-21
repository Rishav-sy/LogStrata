package ratelimiter_test

import (
	"strings"
	"testing"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/ratelimiter"
)

func TestDefaultConfig(t *testing.T) {
	cfg := ratelimiter.DefaultConfig("test-service")
	if cfg.ServiceName != "test-service" {
		t.Errorf("expected ServiceName=test-service, got %s", cfg.ServiceName)
	}
	if len(cfg.Rules) == 0 {
		t.Error("expected at least one rule in default config")
	}
}

func TestGenerateNginxConfig_ContainsZones(t *testing.T) {
	cfg := ratelimiter.Config{
		ServiceName: "api-gateway",
		Rules: []ratelimiter.RateLimitRule{
			{
				Path:              "/api/",
				RequestsPerSecond: 50,
				BurstMultiplier:   2.0,
				Period:            time.Second,
				StatusCode:        429,
			},
		},
	}

	out := ratelimiter.GenerateNginxConfig(cfg)

	if !strings.Contains(out, "limit_req_zone") {
		t.Error("expected limit_req_zone directive in nginx config")
	}
	if !strings.Contains(out, "50r/s") {
		t.Error("expected 50r/s rate in nginx config")
	}
	if !strings.Contains(out, "location /api/") {
		t.Error("expected location /api/ block")
	}
	if !strings.Contains(out, "limit_req_status 429") {
		t.Error("expected limit_req_status 429")
	}
}

func TestGenerateNginxConfig_BlockedIPs(t *testing.T) {
	cfg := ratelimiter.Config{
		ServiceName:      "api-gateway",
		Rules:            ratelimiter.DefaultConfig("x").Rules,
		GlobalBlockedIPs: []string{"1.2.3.4", "5.6.7.8"},
	}

	out := ratelimiter.GenerateNginxConfig(cfg)

	if !strings.Contains(out, "1.2.3.4") {
		t.Error("expected blocked IP 1.2.3.4 in nginx config")
	}
	if !strings.Contains(out, "return 403") {
		t.Error("expected return 403 for blocked IPs")
	}
}

func TestGenerateEnvoyRateLimit_ContainsDescriptors(t *testing.T) {
	cfg := ratelimiter.DefaultConfig("checkout-service")
	out := ratelimiter.GenerateEnvoyRateLimit(cfg)

	if !strings.Contains(out, "domain: logstrata_ratelimit") {
		t.Error("expected domain: logstrata_ratelimit in envoy config")
	}
	if !strings.Contains(out, "descriptors:") {
		t.Error("expected descriptors: block in envoy config")
	}
	if !strings.Contains(out, "requests_per_unit:") {
		t.Error("expected requests_per_unit in envoy config")
	}
}

func TestGenerateTraefikMiddleware_ContainsCRD(t *testing.T) {
	cfg := ratelimiter.Config{
		ServiceName: "auth_service",
		Rules: []ratelimiter.RateLimitRule{
			{
				Path:              "/login",
				RequestsPerSecond: 5,
				BurstMultiplier:   1.0,
				Period:            time.Second,
				StatusCode:        429,
			},
		},
	}

	out := ratelimiter.GenerateTraefikMiddleware(cfg, "production")

	if !strings.Contains(out, "kind: Middleware") {
		t.Error("expected kind: Middleware in traefik config")
	}
	if !strings.Contains(out, "namespace: production") {
		t.Error("expected namespace: production")
	}
	if !strings.Contains(out, "app.kubernetes.io/managed-by: logstrata") {
		t.Error("expected managed-by label")
	}
}

func TestGenerateCiliumNetworkPolicyWithRateLimit(t *testing.T) {
	cfg := ratelimiter.Config{
		ServiceName: "frontend",
		Rules: []ratelimiter.RateLimitRule{
			{Path: "/", RequestsPerSecond: 100, BurstMultiplier: 2, Period: time.Second, StatusCode: 429},
		},
		GlobalBlockedIPs: []string{"10.0.0.1"},
	}
	podSelector := map[string]string{"app": "frontend"}

	out := ratelimiter.GenerateCiliumNetworkPolicyWithRateLimit(cfg, podSelector)

	if !strings.Contains(out, "kind: CiliumNetworkPolicy") {
		t.Error("expected CiliumNetworkPolicy kind")
	}
	if !strings.Contains(out, "ingressDeny:") {
		t.Error("expected ingressDeny block for blocked IPs")
	}
	if !strings.Contains(out, "10.0.0.1/32") {
		t.Error("expected CIDR for blocked IP")
	}
}

func BenchmarkGenerateNginxConfig(b *testing.B) {
	cfg := ratelimiter.DefaultConfig("bench-service")
	cfg.GlobalBlockedIPs = make([]string, 100)
	for i := range cfg.GlobalBlockedIPs {
		cfg.GlobalBlockedIPs[i] = "192.168.1." + string(rune('0'+i%10))
	}

	b.ResetTimer()
	for range b.N {
		_ = ratelimiter.GenerateNginxConfig(cfg)
	}
}
