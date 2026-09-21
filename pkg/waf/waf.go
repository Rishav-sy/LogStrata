package waf

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

// BlockedIPEntry holds metadata regarding an isolated IP address.
type BlockedIPEntry struct {
	IP        string    `json:"ip"`
	Reason    string    `json:"reason"`
	BlockedAt time.Time `json:"blocked_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// BlocklistManager provides thread-safe IP isolation with TTL automatic expiration.
type BlocklistManager struct {
	mu      sync.RWMutex
	entries map[string]BlockedIPEntry
}

// NewBlocklistManager creates an initialized blocklist cache.
func NewBlocklistManager() *BlocklistManager {
	mgr := &BlocklistManager{
		entries: make(map[string]BlockedIPEntry),
	}
	// Background cleanup routine running every 30 seconds
	go mgr.startCleanupRoutine(30 * time.Second)
	return mgr
}

// BlockIP adds or refreshes an IP address in the blocklist with a given TTL duration.
func (m *BlocklistManager) BlockIP(ip, reason string, duration time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	m.entries[ip] = BlockedIPEntry{
		IP:        ip,
		Reason:    reason,
		BlockedAt: now,
		ExpiresAt: now.Add(duration),
	}
}

// IsBlocked checks if an IP is currently actively blocked.
func (m *BlocklistManager) IsBlocked(ip string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entry, exists := m.entries[ip]
	if !exists {
		return false
	}
	return time.Now().Before(entry.ExpiresAt)
}

// GetActiveBlockedIPs returns a slice of all unexpired blocked IP addresses.
func (m *BlocklistManager) GetActiveBlockedIPs() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	now := time.Now()
	var ips []string
	for ip, entry := range m.entries {
		if now.Before(entry.ExpiresAt) {
			ips = append(ips, ip)
		}
	}
	return ips
}

func (m *BlocklistManager) startCleanupRoutine(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		m.cleanupExpired()
	}
}

func (m *BlocklistManager) cleanupExpired() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for ip, entry := range m.entries {
		if now.After(entry.ExpiresAt) {
			delete(m.entries, ip)
		}
	}
}

// GenerateNginxIngressConfigMap returns an NGINX Ingress blocklist map snippet.
func GenerateNginxIngressConfigMap(cmName string, blockedIPs []string) string {
	var rules strings.Builder
	for _, ip := range blockedIPs {
		rules.WriteString(fmt.Sprintf("deny %s;\n", ip))
	}
	rules.WriteString("allow all;\n")

	return fmt.Sprintf(`apiVersion: v1
kind: ConfigMap
metadata:
  name: %s
  labels:
    app.kubernetes.io/managed-by: logstrata
data:
  blocklist.conf: |
%s`, cmName, indent(rules.String(), 4))
}

// GenerateCiliumNetworkPolicy returns a CiliumClusterwideNetworkPolicy manifest.
func GenerateCiliumNetworkPolicy(policyName, targetApp string, blockedIPs []string) string {
	yaml := fmt.Sprintf(`apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: "%s"
  labels:
    app.kubernetes.io/managed-by: "logstrata"
spec:
  endpointSelector:
    matchLabels:
      app: "%s"
  ingressDeny:
    - fromCIDR:`, policyName, targetApp)

	for _, ip := range blockedIPs {
		yaml += fmt.Sprintf("\n        - \"%s/32\"", ip)
	}

	return yaml
}

func indent(text string, spaces int) string {
	pad := strings.Repeat(" ", spaces)
	lines := strings.Split(text, "\n")
	for i, line := range lines {
		if len(line) > 0 {
			lines[i] = pad + line
		}
	}
	return strings.Join(lines, "\n")
}
