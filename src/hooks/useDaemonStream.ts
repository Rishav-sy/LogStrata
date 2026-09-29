/**
 * useDaemonStream — Subscribe to the LogStrata daemon SSE stream.
 *
 * Connects to the daemon's `/api/v1/stream` endpoint via Server-Sent Events
 * and returns live telemetry. Falls back to simulated data when the daemon
 * is unreachable (e.g., when running the dashboard standalone without the Go
 * backend).
 */
import { useEffect, useRef, useState } from "react";

export interface DaemonStreamPayload {
  timestamp: string;
  total_ingested: number;
  current_replicas: number;
  target_replicas: number;
  last_decision_action: string;
  last_decision_reason: string;
  rps: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate_5xx_percent: number;
  blocked_ips_count: number;
  scale_down_locked: boolean;
}

export type DaemonConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "simulated";

interface UseDaemonStreamOptions {
  /** Base URL of the daemon HTTP server */
  daemonUrl?: string;
  /** Auto-reconnect delay in ms. 0 = disabled. Default: 4000 */
  reconnectMs?: number;
  /** Callback fired on each new SSE message */
  onMessage?: (payload: DaemonStreamPayload) => void;
  /** Enable simulated telemetry ticks when daemon is unreachable. Default: true */
  enableSimulation?: boolean;
}

const DEFAULT_DAEMON_URL =
  process.env.NEXT_PUBLIC_DAEMON_URL ?? "http://localhost:8080";

function createSimulatedTick(prev: DaemonStreamPayload | null): DaemonStreamPayload {
  const now = new Date().toISOString();
  if (!prev) {
    return {
      timestamp: now,
      total_ingested: 148200,
      current_replicas: 3,
      target_replicas: 3,
      last_decision_action: "NOOP",
      last_decision_reason: "Load within target bounds (320 RPS / target 120 RPS/pod)",
      rps: 320,
      p50_latency_ms: 1.84,
      p95_latency_ms: 4.12,
      p99_latency_ms: 8.65,
      error_rate_5xx_percent: 0.04,
      blocked_ips_count: 12,
      scale_down_locked: false,
    };
  }

  // Smooth sinusoidal drift + stochastic noise
  const drift = Math.sin(Date.now() / 12000) * 90;
  const jitter = (Math.random() - 0.48) * 35;
  const nextRps = Math.max(90, Math.min(1150, Math.round(prev.rps + jitter * 0.4 + drift * 0.04)));

  const targetReplicas = Math.max(2, Math.min(10, Math.ceil(nextRps / 115)));
  let currentReplicas = prev.current_replicas;
  let action = "NOOP";
  let reason = "Load within target bounds";

  if (targetReplicas > currentReplicas) {
    currentReplicas += 1;
    action = "SCALE_UP";
    reason = `Traffic surge (${nextRps} RPS > ${currentReplicas * 115} capacity threshold)`;
  } else if (targetReplicas < currentReplicas) {
    if (Math.random() > 0.65) {
      currentReplicas -= 1;
      action = "SCALE_DOWN";
      reason = `Traffic normalized (${nextRps} RPS, releasing idle replica)`;
    }
  }

  const p50 = +(1.2 + (nextRps / 850) * 1.4 + Math.random() * 0.25).toFixed(2);
  const p95 = +(p50 * 2.3 + Math.random() * 0.7).toFixed(2);
  const p99 = +(p95 * 1.8 + (Math.random() > 0.9 ? 10.5 : 1.1)).toFixed(2);
  const errRate = +(Math.random() > 0.94 ? 0.35 + Math.random() * 0.9 : 0.02 + Math.random() * 0.04).toFixed(3);
  const blockedIps = prev.blocked_ips_count + (Math.random() > 0.88 ? 1 : 0);

  return {
    timestamp: now,
    total_ingested: prev.total_ingested + Math.round(nextRps * 1.5),
    current_replicas: currentReplicas,
    target_replicas: targetReplicas,
    last_decision_action: action,
    last_decision_reason: reason,
    rps: nextRps,
    p50_latency_ms: p50,
    p95_latency_ms: p95,
    p99_latency_ms: p99,
    error_rate_5xx_percent: errRate,
    blocked_ips_count: blockedIps,
    scale_down_locked: targetReplicas < currentReplicas && action === "NOOP",
  };
}

export function useDaemonStream({
  daemonUrl = DEFAULT_DAEMON_URL,
  reconnectMs = 4000,
  onMessage,
  enableSimulation = true,
}: UseDaemonStreamOptions = {}) {
  const [data, setData] = useState<DaemonStreamPayload | null>(null);
  const [connectionState, setConnectionState] =
    useState<DaemonConnectionState>(() => {
      if (typeof window === "undefined" || typeof EventSource === "undefined") {
        return enableSimulation ? "simulated" : "disconnected";
      }
      return "connecting";
    });

  // Stable refs
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessageRef = useRef<typeof onMessage>(undefined);
  const reconnectMsRef = useRef(reconnectMs);
  const enableSimRef = useRef(enableSimulation);
  const dataRef = useRef<DaemonStreamPayload | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });
  useEffect(() => {
    reconnectMsRef.current = reconnectMs;
  });
  useEffect(() => {
    enableSimRef.current = enableSimulation;
  });
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Simulation loop effect
  useEffect(() => {
    if (connectionState !== "simulated" || !enableSimulation) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    // Generate initial tick immediately if no data yet
    if (!dataRef.current) {
      const initial = createSimulatedTick(null);
      setData(initial);
      onMessageRef.current?.(initial);
    }

    simIntervalRef.current = setInterval(() => {
      const next = createSimulatedTick(dataRef.current);
      setData(next);
      onMessageRef.current?.(next);
    }, 1500);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [connectionState, enableSimulation]);

  // EventSource stream manager
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    let cancelled = false;
    let failCount = 0;

    function scheduleReconnect() {
      if (cancelled) return;
      failCount++;
      const baseDelay = reconnectMsRef.current;
      const delay = Math.min(30000, baseDelay * Math.pow(1.5, Math.min(5, failCount - 1)));
      if (delay > 0) {
        reconnectTimerRef.current = setTimeout(openStream, delay);
      }
    }

    function openStream() {
      if (cancelled) return;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      let es: EventSource;
      try {
        es = new EventSource(`${daemonUrl}/api/v1/stream`);
      } catch {
        if (!cancelled) {
          setConnectionState(enableSimRef.current ? "simulated" : "disconnected");
          scheduleReconnect();
        }
        return;
      }

      esRef.current = es;
      setConnectionState("connecting");

      es.onopen = () => {
        if (!cancelled) {
          failCount = 0;
          setConnectionState("connected");
        }
      };

      es.onmessage = (event) => {
        if (cancelled) return;
        try {
          const payload: DaemonStreamPayload = JSON.parse(event.data as string);
          setData(payload);
          onMessageRef.current?.(payload);
        } catch {
          // Ignore malformed frames
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!cancelled) {
          setConnectionState(enableSimRef.current ? "simulated" : "disconnected");
          scheduleReconnect();
        }
      };
    }

    openStream();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [daemonUrl]);

  return {
    data,
    connectionState,
    connected: connectionState === "connected",
    isSimulated: connectionState === "simulated",
  };
}
