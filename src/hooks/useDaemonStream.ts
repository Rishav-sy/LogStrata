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
  /** Auto-reconnect delay in ms. 0 = disabled. Default: 3000 */
  reconnectMs?: number;
  /** Callback fired on each new SSE message */
  onMessage?: (payload: DaemonStreamPayload) => void;
}

const DEFAULT_DAEMON_URL =
  process.env.NEXT_PUBLIC_DAEMON_URL ?? "http://localhost:8080";

export function useDaemonStream({
  daemonUrl = DEFAULT_DAEMON_URL,
  reconnectMs = 3000,
  onMessage,
}: UseDaemonStreamOptions = {}) {
  const [data, setData] = useState<DaemonStreamPayload | null>(null);
  const [connectionState, setConnectionState] =
    useState<DaemonConnectionState>(() => {
      // On the server or in environments without EventSource, start as simulated
      if (typeof window === "undefined" || typeof EventSource === "undefined") {
        return "simulated";
      }
      return "connecting";
    });

  // Stable refs so effects don't need them in deps
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef<typeof onMessage>(undefined);
  const reconnectMsRef = useRef(reconnectMs);

  // Keep refs up to date without causing re-renders
  useEffect(() => {
    onMessageRef.current = onMessage;
  });
  useEffect(() => {
    reconnectMsRef.current = reconnectMs;
  });

  useEffect(() => {
    // SSE is a browser-only API — state already initialised as 'simulated' if unavailable
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    let cancelled = false;

    function scheduleReconnect() {
      if (cancelled) return;
      const delay = reconnectMsRef.current;
      if (delay > 0) {
        reconnectTimerRef.current = setTimeout(openStream, delay);
      }
    }

    function openStream() {
      if (cancelled) return;

      // Clear any pending reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Close previous connection
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      let es: EventSource;
      try {
        es = new EventSource(`${daemonUrl}/api/v1/stream`);
      } catch {
        setConnectionState("simulated");
        return;
      }

      esRef.current = es;
      setConnectionState("connecting");

      es.onopen = () => {
        if (!cancelled) setConnectionState("connected");
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
          setConnectionState("disconnected");
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
    // Only re-run when the daemon URL changes
  }, [daemonUrl]);

  return {
    data,
    connectionState,
    connected: connectionState === "connected",
  };
}
