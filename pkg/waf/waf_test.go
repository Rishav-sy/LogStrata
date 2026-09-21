package waf

import (
	"strings"
	"testing"
	"time"
)

func TestBlocklistManagerTTL(t *testing.T) {
	mgr := &BlocklistManager{
		entries: make(map[string]BlockedIPEntry),
	}

	ip := "194.26.29.11"
	// Block for 50 milliseconds
	mgr.BlockIP(ip, "brute force login scan", 50*time.Millisecond)

	if !mgr.IsBlocked(ip) {
		t.Fatalf("expected IP %s to be blocked immediately", ip)
	}

	active := mgr.GetActiveBlockedIPs()
	if len(active) != 1 || active[0] != ip {
		t.Fatalf("expected active blocked list to contain %s, got %v", ip, active)
	}

	// Wait for expiration
	time.Sleep(70 * time.Millisecond)

	if mgr.IsBlocked(ip) {
		t.Fatalf("expected IP %s to have expired after TTL", ip)
	}

	mgr.cleanupExpired()
	if len(mgr.GetActiveBlockedIPs()) != 0 {
		t.Fatalf("expected active blocked list to be empty after cleanup")
	}
}

func TestGenerateNginxConfigMap(t *testing.T) {
	cm := GenerateNginxIngressConfigMap("nginx-blocked-ips", []string{"1.2.3.4", "5.6.7.8"})
	if !strings.Contains(cm, "deny 1.2.3.4;") {
		t.Errorf("expected config map to contain deny 1.2.3.4;, got:\n%s", cm)
	}
	if !strings.Contains(cm, "allow all;") {
		t.Errorf("expected config map to contain allow all;, got:\n%s", cm)
	}
}

func TestGenerateCiliumNetworkPolicy(t *testing.T) {
	yaml := GenerateCiliumNetworkPolicy("cilium-ingress-drop", "commerce-frontend", []string{"45.154.255.8"})
	if !strings.Contains(yaml, `cilium.io/v2`) {
		t.Errorf("expected apiVersion cilium.io/v2, got:\n%s", yaml)
	}
	if !strings.Contains(yaml, `"45.154.255.8/32"`) {
		t.Errorf("expected CIDR 45.154.255.8/32, got:\n%s", yaml)
	}
}
