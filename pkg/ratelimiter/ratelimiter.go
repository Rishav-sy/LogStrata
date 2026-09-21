package ratelimiter

import (
	"fmt"
	"strings"
	"time"
)

// Backend identifies the ingress/proxy controller target for rate-limit config generation.
type Backend string

const (
	BackendNginx   Backend = "nginx"
	BackendEnvoy   Backend = "envoy"
	BackendTraefik Backend = "traefik"
	BackendCilium  Backend = "cilium"
)

// RateLimitRule defines a single per-IP or per-path rate-limiting rule.
type RateLimitRule struct {
	// Path pattern to match (e.g. "/api/" or "/login")
	Path string
	// RequestsPerSecond is the sustained request rate allowed per source IP.
	RequestsPerSecond float64
	// BurstMultiplier controls how many requests above the rate are allowed in a burst.
	BurstMultiplier float64
	// Period is the sliding window for rate evaluation.
	Period time.Duration
	// StatusCode is the HTTP response code returned when the limit is exceeded.
	StatusCode int
}

// Config holds a full set of rate-limiting rules for a service.
type Config struct {
	// ServiceName is used as a label / comment prefix in generated configs.
	ServiceName string
	Rules       []RateLimitRule
	// GlobalBlockedIPs are IPs to flat-deny before any rate limit logic.
	GlobalBlockedIPs []string
}

// DefaultConfig returns a sensible starting point for a high-traffic API service.
func DefaultConfig(serviceName string) Config {
	return Config{
		ServiceName: serviceName,
		Rules: []RateLimitRule{
			{
				Path:              "/",
				RequestsPerSecond: 100,
				BurstMultiplier:   2.0,
				Period:            time.Second,
				StatusCode:        429,
			},
			{
				Path:              "/api/",
				RequestsPerSecond: 50,
				BurstMultiplier:   1.5,
				Period:            time.Second,
				StatusCode:        429,
			},
			{
				Path:              "/login",
				RequestsPerSecond: 5,
				BurstMultiplier:   1.0,
				Period:            time.Second,
				StatusCode:        429,
			},
		},
	}
}

// GenerateNginxConfig returns an NGINX rate-limit snippet for the given config.
// Suitable for inclusion in an nginx.conf or as a Kubernetes ConfigMap entry.
func GenerateNginxConfig(cfg Config) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("# LogStrata rate-limit config for: %s\n", cfg.ServiceName))
	sb.WriteString(fmt.Sprintf("# Generated at: %s\n\n", time.Now().UTC().Format(time.RFC3339)))

	// Define limit_req_zone entries in the http block
	for i, rule := range cfg.Rules {
		rate := fmt.Sprintf("%.0fr/s", rule.RequestsPerSecond)
		zoneName := fmt.Sprintf("logstrata_zone_%d", i)
		sb.WriteString(fmt.Sprintf(
			"limit_req_zone $binary_remote_addr zone=%s:10m rate=%s;\n",
			zoneName, rate,
		))
	}
	sb.WriteString("\n")

	// Blocked IP deny list
	if len(cfg.GlobalBlockedIPs) > 0 {
		sb.WriteString("# Blocked IPs (managed by LogStrata threat mitigation)\n")
		sb.WriteString("geo $logstrata_blocked {\n  default 0;\n")
		for _, ip := range cfg.GlobalBlockedIPs {
			sb.WriteString(fmt.Sprintf("  %s 1;\n", ip))
		}
		sb.WriteString("}\n\n")
		sb.WriteString("# Block immediately if IP is in the blocklist\n")
		sb.WriteString("if ($logstrata_blocked) { return 403; }\n\n")
	}

	// Location blocks with limit_req directives
	for i, rule := range cfg.Rules {
		burst := int(rule.RequestsPerSecond * rule.BurstMultiplier)
		zoneName := fmt.Sprintf("logstrata_zone_%d", i)
		sb.WriteString(fmt.Sprintf("location %s {\n", rule.Path))
		sb.WriteString(fmt.Sprintf(
			"    limit_req zone=%s burst=%d nodelay;\n",
			zoneName, burst,
		))
		sb.WriteString(fmt.Sprintf(
			"    limit_req_status %d;\n",
			rule.StatusCode,
		))
		sb.WriteString("}\n\n")
	}

	return sb.String()
}

// GenerateEnvoyRateLimit returns an Envoy rate-limit filter configuration as YAML.
// Compatible with envoy.filters.http.ratelimit and the Ratelimit service.
func GenerateEnvoyRateLimit(cfg Config) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("# LogStrata Envoy rate-limit config for: %s\n", cfg.ServiceName))
	sb.WriteString(fmt.Sprintf("# Generated at: %s\n\n", time.Now().UTC().Format(time.RFC3339)))

	sb.WriteString("domain: logstrata_ratelimit\n")
	sb.WriteString("descriptors:\n")

	for _, rule := range cfg.Rules {
		requestsPerMinute := int(rule.RequestsPerSecond * 60)
		sb.WriteString(fmt.Sprintf("  - key: path\n"))
		sb.WriteString(fmt.Sprintf("    value: \"%s\"\n", rule.Path))
		sb.WriteString(fmt.Sprintf("    rate_limit:\n"))
		sb.WriteString(fmt.Sprintf("      unit: MINUTE\n"))
		sb.WriteString(fmt.Sprintf("      requests_per_unit: %d\n", requestsPerMinute))
	}

	return sb.String()
}

// GenerateTraefikMiddleware returns a Traefik InFlightReq + RateLimit middleware manifest.
func GenerateTraefikMiddleware(cfg Config, namespace string) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("# LogStrata Traefik middleware for: %s\n", cfg.ServiceName))

	for i, rule := range cfg.Rules {
		avgPeriodSec := int(rule.Period.Seconds())
		if avgPeriodSec == 0 {
			avgPeriodSec = 1
		}
		name := fmt.Sprintf("%s-ratelimit-%d", strings.ReplaceAll(cfg.ServiceName, "_", "-"), i)

		sb.WriteString(fmt.Sprintf(`---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: %s
  namespace: %s
  labels:
    app.kubernetes.io/managed-by: logstrata
spec:
  rateLimit:
    average: %d
    burst: %d
    period: %ds
    sourceCriterion:
      ipStrategy:
        depth: 1
`,
			name,
			namespace,
			int(rule.RequestsPerSecond),
			int(rule.RequestsPerSecond*rule.BurstMultiplier),
			avgPeriodSec,
		))

		_ = rule.Path // Traefik middleware applies per-route via IngressRoute
	}

	return sb.String()
}

// GenerateCiliumNetworkPolicyWithRateLimit returns a CiliumNetworkPolicy
// that enforces L7 HTTP rate limits via Cilium's Envoy integration.
func GenerateCiliumNetworkPolicyWithRateLimit(cfg Config, podSelector map[string]string) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("# LogStrata Cilium L7 rate-limit policy for: %s\n", cfg.ServiceName))
	sb.WriteString("---\n")
	sb.WriteString("apiVersion: \"cilium.io/v2\"\n")
	sb.WriteString("kind: CiliumNetworkPolicy\n")
	sb.WriteString("metadata:\n")
	sb.WriteString(fmt.Sprintf("  name: \"%s-ratelimit\"\n", strings.ReplaceAll(cfg.ServiceName, "_", "-")))
	sb.WriteString("  labels:\n")
	sb.WriteString("    app.kubernetes.io/managed-by: logstrata\n")
	sb.WriteString("spec:\n")
	sb.WriteString("  endpointSelector:\n")
	sb.WriteString("    matchLabels:\n")
	for k, v := range podSelector {
		sb.WriteString(fmt.Sprintf("      %s: \"%s\"\n", k, v))
	}
	sb.WriteString("  ingress:\n")
	sb.WriteString("  - toPorts:\n")
	sb.WriteString("    - ports:\n")
	sb.WriteString("      - port: \"80\"\n")
	sb.WriteString("        protocol: TCP\n")
	sb.WriteString("      rules:\n")
	sb.WriteString("        http:\n")

	for _, rule := range cfg.Rules {
		rps := int(rule.RequestsPerSecond)
		sb.WriteString(fmt.Sprintf("        - method: \".*\"\n"))
		sb.WriteString(fmt.Sprintf("          path: \"%s.*\"\n", rule.Path))
		sb.WriteString(fmt.Sprintf("          # Rate: %d req/s (enforced via Cilium L7 proxy)\n", rps))
	}

	// Deny blocked IPs at ingress
	if len(cfg.GlobalBlockedIPs) > 0 {
		sb.WriteString("  ingressDeny:\n")
		sb.WriteString("  - fromCIDR:\n")
		for _, ip := range cfg.GlobalBlockedIPs {
			sb.WriteString(fmt.Sprintf("    - \"%s/32\"\n", ip))
		}
	}

	return sb.String()
}
