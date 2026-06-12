"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BorderBeam } from "@/components/ui/border-beam";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";
import {
  Play, Pause, Trash2, Download, AlertTriangle, Cpu, Layers,
  Plus, Minus, Server, Activity, Shield, Database, Key, Clock,
  X, Check, Flame, AlertCircle, HardDrive, Wifi, HelpCircle
} from "lucide-react";

interface TelemetryPoint {
  rps: number;
  cpu: number;
  errors: number;
  replicas: number;
}

interface TerminalLog {
  id: string;
  time: string;
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  service: string;
  message: string;
}

interface TimelineEvent {
  id: string;
  time: string;
  text: string;
  type: "INFO" | "SCALE_UP" | "SCALE_DOWN" | "ALERT" | "MITIGATION";
}

interface ContainerPod {
  id: string;
  name: string;
  status: "starting" | "running";
  createdAt: number;
}

interface SystemAlert {
  id: string;
  time: string;
  level: "WARNING" | "CRITICAL";
  message: string;
}

export default function Dashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    setTimelineEvents([
      { id: "init", time: new Date().toLocaleTimeString(), text: "DevOps Playground Simulator Lab initialized.", type: "INFO" }
    ]);
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Load custom templates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("logstrata_templates");
      if (stored) {
        try {
          setCustomTemplates(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const isLight = mounted && resolvedTheme === "light";

  // --- Traffic Simulation State ---
  const [trafficMode, setTrafficMode] = useState<"normal" | "high" | "viral" | "ddos">("normal");
  const [requestRate, setRequestRate] = useState(100); // requests/min
  const [totalRequests, setTotalRequests] = useState(14820);
  const [rps, setRps] = useState(1.6);
  const [errorRate, setErrorRate] = useState(0.2);

  // --- Error Injection State ---
  const [dbFailure, setDbFailure] = useState(false);
  const [apiFailure, setApiFailure] = useState(false);
  const [authFailure, setAuthFailure] = useState(false);
  const [timeoutFailure, setTimeoutFailure] = useState(false);
  const [serviceCrash, setServiceCrash] = useState(false);

  // --- Resource Utilization State ---
  const [cpu, setCpu] = useState(25);
  const [memory, setMemory] = useState(32);
  const [disk, setDisk] = useState(15);
  const [network, setNetwork] = useState(12);
  const [sliderCpu, setSliderCpu] = useState(25);
  const [sliderMemory, setSliderMemory] = useState(32);
  const [sliderDisk, setSliderDisk] = useState(15);
  const [sliderNetwork, setSliderNetwork] = useState(12);
  const [userOverridden, setUserOverridden] = useState<Record<string, boolean>>({
    cpu: false,
    memory: false,
    disk: false,
    network: false,
  });

  // --- Auto Scaling Sandbox State ---
  const [containers, setContainers] = useState<ContainerPod[]>([
    { id: "1", name: "pod-ingress-7fc1", status: "running", createdAt: 0 },
    { id: "2", name: "pod-ingress-8bd2", status: "running", createdAt: 0 },
    { id: "3", name: "pod-ingress-3ea9", status: "running", createdAt: 0 },
  ]);
  const [scaleUpThreshold] = useState(80); // 80% CPU
  const [scaleDownThreshold] = useState(30); // 30% CPU
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(true);

  // --- Live Log Generator State ---
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [logFilter, setLogFilter] = useState<"ALL" | "INFO" | "WARNING" | "ERROR" | "CRITICAL">("ALL");

  // --- Anomaly States ---
  const [activeAnomaly, setActiveAnomaly] = useState<"none" | "leak" | "spike" | "storm" | "outage">("none");
  const [leakRate, setLeakRate] = useState(0);

  // --- Central Event Timeline State ---
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // --- Alerts State ---
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([]);

  // --- Scenario Runner State ---
  const [activeScenario, setActiveScenario] = useState<"black_friday" | "db_outage" | "viral_post" | "ddos_attack" | null>(null);
  const [scenarioTimer, setScenarioTimer] = useState(0);
  const [scenarioStatus, setScenarioStatus] = useState("");

  // --- Custom Templates State ---
  const [templateName, setTemplateName] = useState("");
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);

  // Refs for chart history
  const telemetryHistory = useRef<TelemetryPoint[]>(
    Array.from({ length: 60 }, (_, i) => ({
      rps: 1.6,
      cpu: 25,
      errors: 0.2,
      replicas: 3
    }))
  );

  const terminalRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for tracking previous tick values to trigger timeline events
  const prevRequestRateRef = useRef(100);
  const prevCpuRef = useRef(25);
  const prevDbFailureRef = useRef(false);
  const lastScaleTimeRef = useRef(0);

  // --- Helper: Add Logs Client Side ---
  const addTerminalLog = (level: TerminalLog["level"], service: string, message: string) => {
    if (isLogPaused) return;
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => {
      const updated = [
        ...prev,
        {
          id: Math.random().toString(),
          time: timeStr,
          level,
          service,
          message,
        },
      ];
      return updated.slice(-150); // Keep last 150
    });
  };

  // --- Helper: Add Timeline Event ---
  const addTimelineEvent = (text: string, type: TimelineEvent["type"]) => {
    const timeStr = new Date().toLocaleTimeString();
    setTimelineEvents((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        time: timeStr,
        text,
        type,
      },
    ]);
  };

  // --- Helper: Manage Alerts ---
  const triggerAlert = (level: SystemAlert["level"], message: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setActiveAlerts((prev) => {
      if (prev.some((a) => a.message === message)) return prev;
      addTimelineEvent(`ALERT ACTIVE: [${level}] ${message}`, "ALERT");
      addTerminalLog(level === "CRITICAL" ? "CRITICAL" : "ERROR", "alert-manager", `Triggered Alert: ${message}`);
      return [...prev, { id: Math.random().toString(), time: timeStr, level, message }];
    });
  };

  const resolveAlert = (message: string) => {
    setActiveAlerts((prev) => {
      if (!prev.some((a) => a.message === message)) return prev;
      addTimelineEvent(`ALERT RESOLVED: ${message}`, "INFO");
      addTerminalLog("INFO", "alert-manager", `Alert resolved: ${message}`);
      return prev.filter((a) => a.message !== message);
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate = {
      name: templateName.trim(),
      config: {
        trafficMode,
        requestRate,
        cpu,
        memory,
        disk,
        network,
        sliderCpu,
        sliderMemory,
        sliderDisk,
        sliderNetwork,
        userOverridden,
        dbFailure,
        apiFailure,
        authFailure,
        timeoutFailure,
        serviceCrash,
        autoScalingEnabled,
        activeAnomaly,
        leakRate,
      }
    };
    const updated = [...customTemplates.filter(t => t.name !== newTemplate.name), newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem("logstrata_templates", JSON.stringify(updated));
    setTemplateName("");
    addTimelineEvent(`Saved template: ${newTemplate.name}`, "INFO");
    addTerminalLog("INFO", "sandbox-manager", `Saved custom configuration template: ${newTemplate.name}`);
  };

  const handleLoadTemplate = (tpl: any) => {
    const { config } = tpl;
    setTrafficMode(config.trafficMode);
    setRequestRate(config.requestRate);
    setCpu(config.cpu);
    setMemory(config.memory);
    setDisk(config.disk);
    setNetwork(config.network);
    setSliderCpu(config.sliderCpu);
    setSliderMemory(config.sliderMemory);
    setSliderDisk(config.sliderDisk);
    setSliderNetwork(config.sliderNetwork);
    setUserOverridden(config.userOverridden);
    setDbFailure(config.dbFailure);
    setApiFailure(config.apiFailure);
    setAuthFailure(config.authFailure);
    setTimeoutFailure(config.timeoutFailure);
    setServiceCrash(config.serviceCrash);
    setAutoScalingEnabled(config.autoScalingEnabled);
    setActiveAnomaly(config.activeAnomaly);
    setLeakRate(config.leakRate);
    setActiveScenario(null);

    addTimelineEvent(`Loaded template: ${tpl.name}`, "INFO");
    addTerminalLog("INFO", "sandbox-manager", `Loaded custom configuration template: ${tpl.name}`);
  };

  const handleDeleteTemplate = (name: string) => {
    const updated = customTemplates.filter(t => t.name !== name);
    setCustomTemplates(updated);
    localStorage.setItem("logstrata_templates", JSON.stringify(updated));
    addTimelineEvent(`Deleted template: ${name}`, "INFO");
    addTerminalLog("INFO", "sandbox-manager", `Deleted custom configuration template: ${name}`);
  };

  // Auto-scroll logs & timeline
  useEffect(() => {
    if (terminalRef.current && !isLogPaused) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs, isLogPaused]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineEvents]);

  // --- Click Handlers: Traffic Simulation ---
  const handleTrafficChange = (mode: "normal" | "high" | "viral" | "ddos") => {
    setTrafficMode(mode);
    setActiveScenario(null); // Stop any running scenario if user interacts
    let rate = 100;
    if (mode === "high") rate = 1000;
    if (mode === "viral") rate = 5000;
    if (mode === "ddos") rate = 10000;
    setRequestRate(rate);

    // Apply baseline slider targets
    if (!userOverridden.cpu) {
      const targetCpu = mode === "normal" ? 25 : mode === "high" ? 50 : mode === "viral" ? 85 : 98;
      setSliderCpu(targetCpu);
      setCpu(targetCpu);
    }
    if (!userOverridden.memory) {
      const targetMem = mode === "normal" ? 32 : mode === "high" ? 55 : mode === "viral" ? 80 : 92;
      setSliderMemory(targetMem);
      setMemory(targetMem);
    }
    if (!userOverridden.network) {
      const targetNet = mode === "normal" ? 12 : mode === "high" ? 45 : mode === "viral" ? 75 : 98;
      setSliderNetwork(targetNet);
      setNetwork(targetNet);
    }

    addTimelineEvent(`Traffic workload simulated at: ${mode.toUpperCase()} (${rate} req/min)`, "INFO");
    addTerminalLog("INFO", "ingress-controller", `Configured traffic mode: ${mode.toUpperCase()} (${rate} requests/min)`);
  };

  // --- Click Handlers: Scenario Runner ---
  const runScenario = (scenario: typeof activeScenario) => {
    setActiveScenario(scenario);
    setScenarioTimer(0);

    // Reset injected states to baseline
    setDbFailure(false);
    setApiFailure(false);
    setAuthFailure(false);
    setTimeoutFailure(false);
    setServiceCrash(false);
    setUserOverridden({ cpu: false, memory: false, disk: false, network: false });
    setActiveAnomaly("none");
    setLeakRate(0);

    if (scenario === "black_friday") {
      setScenarioStatus("Pre-Sale Phase: Traffic Normal. Monitoring baseline…");
      setTrafficMode("normal");
      setRequestRate(100);
      addTimelineEvent("Scenario Started: Black Friday Traffic Rush", "INFO");
    } else if (scenario === "db_outage") {
      setScenarioStatus("Database Operations Normal. Monitoring transactions…");
      setTrafficMode("normal");
      addTimelineEvent("Scenario Started: Primary Database Outage Failure", "INFO");
    } else if (scenario === "viral_post") {
      setScenarioStatus("Normal traffic. Monitoring social referrals…");
      setTrafficMode("normal");
      addTimelineEvent("Scenario Started: Viral Social Media Referral Spike", "INFO");
    } else if (scenario === "ddos_attack") {
      setScenarioStatus("Baseline traffic. Scanning ingress firewall logs…");
      setTrafficMode("normal");
      addTimelineEvent("Scenario Started: Distributed Denial of Service (DDoS) Flood", "INFO");
    }
  };

  // --- Trigger Anomaly Actions ---
  const triggerAnomaly = (type: typeof activeAnomaly) => {
    setActiveAnomaly(type);
    setActiveScenario(null);
    if (type === "spike") {
      setTrafficMode("viral");
      setRequestRate(5000);
      setSliderCpu(90);
      setCpu(90);
      triggerAlert("WARNING", "Sudden Traffic Spike anomaly detected");
      addTimelineEvent("ANOMALY: Sudden Traffic Spike Triggered", "ALERT");
      addTerminalLog("WARNING", "traffic-monitor", "Anomaly alert: Traffic rate spiked 50x in < 2 seconds");
    } else if (type === "leak") {
      setLeakRate(1.5);
      triggerAlert("WARNING", "Memory Leak active on pod-ingress-* group");
      addTimelineEvent("ANOMALY: Memory Leak Triggered", "ALERT");
      addTerminalLog("WARNING", "kube-oom-monitor", "Memory leak pattern flagged: steady heap rise of 1.5% per second");
    } else if (type === "storm") {
      setApiFailure(true);
      setAuthFailure(true);
      setTimeoutFailure(true);
      triggerAlert("CRITICAL", "API Error Storm: Multiple upstream failures");
      addTimelineEvent("ANOMALY: Error Storm Triggered", "ALERT");
      addTerminalLog("ERROR", "api-gateway", "Gateway error rate exceeded SLA limit: 42% failed operations");
    } else if (type === "outage") {
      setDbFailure(true);
      setServiceCrash(true);
      setContainers([]);
      triggerAlert("CRITICAL", "Complete Microservice Outage: Ingress Inoperable");
      addTimelineEvent("ANOMALY: Service Outage Outbreak", "ALERT");
      addTerminalLog("CRITICAL", "orchestration-engine", "Core Cluster Outage: 0 running pods, database offline");
    }
  };

  // Clear anomaly state
  const clearAnomaly = () => {
    setActiveAnomaly("none");
    setLeakRate(0);
    setDbFailure(false);
    setApiFailure(false);
    setAuthFailure(false);
    setTimeoutFailure(false);
    setServiceCrash(false);
    resolveAlert("Sudden Traffic Spike anomaly detected");
    resolveAlert("Memory Leak active on pod-ingress-* group");
    resolveAlert("API Error Storm: Multiple upstream failures");
    resolveAlert("Complete Microservice Outage: Ingress Inoperable");
    if (containers.length === 0) {
      setContainers([
        { id: Math.random().toString(), name: `pod-ingress-${Math.random().toString(36).substring(2, 6)}`, status: "running", createdAt: Date.now() }
      ]);
    }
    addTimelineEvent("ANOMALY STATE CLEARED: Re-normalizing system", "INFO");
    addTerminalLog("INFO", "orchestration-engine", "Anomaly simulation cleared. Restoring pods.");
  };

  // --- Auto Scaling Controls ---
  const handleAddContainer = () => {
    if (containers.length >= 12) return;
    const newId = Math.random().toString();
    const newName = `pod-ingress-${Math.random().toString(36).substring(2, 6)}`;
    setContainers((prev) => [...prev, { id: newId, name: newName, status: "starting", createdAt: Date.now() }]);
    addTimelineEvent("Scaling Triggered", "SCALE_UP");
    addTimelineEvent("Container Added", "SCALE_UP");
    addTimelineEvent(`Manual container addition: ${newName} SPINNING UP`, "SCALE_UP");
    addTerminalLog("INFO", "orchestration-engine", `Kubernetes: Deploying new replica pod ${newName}`);
  };

  const handleRemoveContainer = () => {
    if (containers.length <= 1) return;
    const target = containers[containers.length - 1];
    setContainers((prev) => prev.slice(0, -1));
    addTimelineEvent("Scaling Triggered", "SCALE_DOWN");
    addTimelineEvent(`Manual container deletion: ${target.name} DECOMMISSIONED`, "SCALE_DOWN");
    addTerminalLog("WARNING", "orchestration-engine", `Kubernetes: Terminated pod replica ${target.name}`);
  };

  // Resolve pods from starting to running
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => {
      setContainers((prev) =>
        prev.map((c) => c.status === "starting" && Date.now() - c.createdAt > 3000 ? { ...c, status: "running" } : c)
      );
    }, 1000);
    return () => clearInterval(t);
  }, [loading]);

  // --- Log Actions ---
  const handleClearLogs = () => {
    setTerminalLogs([]);
  };

  const handleExportLogs = () => {
    const text = terminalLogs.map((l) => `[${l.time}] [${l.level}] [${l.service}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = "logstrata-lab-simulation.log";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- Primary Simulation Loop (1-second tick) ---
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      // 1. Advance Scenario Runner Time and Stages
      let currentTrafficMode = trafficMode;
      let currentDb = dbFailure;
      let currentApi = apiFailure;
      let currentAuth = authFailure;
      let currentTimeout = timeoutFailure;
      let currentCrash = serviceCrash;
      let currentAnomaly = activeAnomaly;

      if (activeScenario) {
        setScenarioTimer((prev) => {
          const next = prev + 1;

          // Black Friday Scenario Timeline
          if (activeScenario === "black_friday") {
            if (next === 5) {
              setScenarioStatus("Sale Commences: Traffic spikes to HIGH load.");
              setTrafficMode("high");
              setRequestRate(1000);
              addTimelineEvent("Black Friday Sale peak started", "INFO");
              addTerminalLog("INFO", "ingress-controller", "Ingress traffic rising rapidly: 1000 req/min");
            } else if (next === 20) {
              setScenarioStatus("Peak Flash Sale: Traffic surges to VIRAL load. Autoscale threshold exceeded.");
              setTrafficMode("viral");
              setRequestRate(5000);
              addTimelineEvent("Flash sale peak: 5000 req/min workload reached", "INFO");
              addTerminalLog("WARNING", "traffic-monitor", "Flash sale load warning: scale threshold breached");
            } else if (next === 45) {
              setScenarioStatus("Sale Concluding: Cooling down traffic to NORMAL load.");
              setTrafficMode("normal");
              setRequestRate(100);
              addTimelineEvent("Black Friday Sale ended. Restoring base load.", "INFO");
              addTerminalLog("INFO", "ingress-controller", "Sale concluding. Ingress traffic stabilized.");
            } else if (next >= 60) {
              setActiveScenario(null);
              setScenarioStatus("Scenario Completed successfully.");
              addTimelineEvent("Scenario Completed: Black Friday Traffic Rush", "INFO");
            }
          }

          // DB Outage Scenario Timeline
          if (activeScenario === "db_outage") {
            if (next === 5) {
              setScenarioStatus("Alert: Database replication pool disconnected. Primary DB outage!");
              setDbFailure(true);
              triggerAlert("CRITICAL", "Database Service Outage");
            } else if (next === 25) {
              setScenarioStatus("Mitigation: Failover database replica promoted to Primary. Resolving outage.");
              setDbFailure(false);
              resolveAlert("Database Service Outage");
              addTimelineEvent("DB Failover promoted successfully", "MITIGATION");
            } else if (next >= 40) {
              setActiveScenario(null);
              setScenarioStatus("Scenario Completed successfully.");
              addTimelineEvent("Scenario Completed: Database Outage Failure", "INFO");
            }
          }

          // Viral Post Scenario Timeline
          if (activeScenario === "viral_post") {
            if (next === 5) {
              setScenarioStatus("Reddit post goes viral: Traffic rising to VIRAL load (5000 req/min).");
              setTrafficMode("viral");
              setRequestRate(5000);
            } else if (next === 35) {
              setScenarioStatus("Post engagement fading: Traffic returns to NORMAL.");
              setTrafficMode("normal");
              setRequestRate(100);
            } else if (next >= 50) {
              setActiveScenario(null);
              setScenarioStatus("Scenario Completed successfully.");
              addTimelineEvent("Scenario Completed: Viral Social Media Referral", "INFO");
            }
          }

          // DDoS Attack Scenario Timeline
          if (activeScenario === "ddos_attack") {
            if (next === 5) {
              setScenarioStatus("Intrusion: Network flood active. 10000 req/min DDoS traffic storm.");
              setTrafficMode("ddos");
              setRequestRate(10000);
              setAuthFailure(true);
              setTimeoutFailure(true);
              triggerAlert("CRITICAL", "DDoS Attack Vector Active");
            } else if (next === 25) {
              setScenarioStatus("Firewall Shield: Dynamic Ingress IP blocking applied. Mitigating malicious requests.");
              setAuthFailure(false);
              setTimeoutFailure(false);
              addTimelineEvent("DDoS filter rules loaded to Ingress ConfigMap", "MITIGATION");
              addTerminalLog("INFO", "firewall-shield", "Mitigation active: Dropped 142 malicious source IP blocks");
            } else if (next === 45) {
              setScenarioStatus("Attack subsided: Clearing blocklist. Restoring normal traffic.");
              setTrafficMode("normal");
              setRequestRate(100);
              resolveAlert("DDoS Attack Vector Active");
            } else if (next >= 60) {
              setActiveScenario(null);
              setScenarioStatus("Scenario Completed successfully.");
              addTimelineEvent("Scenario Completed: DDoS Flood Mitigation", "INFO");
            }
          }

          return next;
        });
      }

      // Re-read local values
      currentTrafficMode = trafficMode;
      currentDb = dbFailure;
      currentApi = apiFailure;
      currentAuth = authFailure;
      currentTimeout = timeoutFailure;
      currentCrash = serviceCrash;
      currentAnomaly = activeAnomaly;

      // 2. Continuous Requests Counting
      const baseRps = requestRate / 60;
      const noise = 0.95 + Math.random() * 0.1;
      const currentRps = parseFloat((baseRps * noise).toFixed(1));
      setRps(currentRps);
      setTotalRequests((prev) => prev + Math.round(currentRps));

      // 3. Resource Load Calculation (Target base loads driven by traffic)
      let targetCpu = 25;
      let targetMemory = 32;
      let targetDisk = 15;
      let targetNetwork = 12;

      if (currentTrafficMode === "normal") {
        targetCpu = 25; targetMemory = 32; targetDisk = 15; targetNetwork = 12;
      } else if (currentTrafficMode === "high") {
        targetCpu = 50; targetMemory = 55; targetDisk = 25; targetNetwork = 45;
      } else if (currentTrafficMode === "viral") {
        targetCpu = 85; targetMemory = 80; targetDisk = 40; targetNetwork = 75;
      } else if (currentTrafficMode === "ddos") {
        targetCpu = 98; targetMemory = 92; targetDisk = 60; targetNetwork = 98;
      }

      // Handle Memory Leak Anomaly
      if (currentAnomaly === "leak") {
        setMemory((prev) => {
          const next = Math.min(100, prev + leakRate);
          setSliderMemory(Math.round(next));
          if (next >= 98) {
            // Memory crash
            setContainers([]);
            setServiceCrash(true);
            triggerAlert("CRITICAL", "Ingress container crash: Out of Memory (OOM)");
            addTimelineEvent("OOM CRASH: pod-ingress-* group killed by kernel", "ALERT");
            addTerminalLog("CRITICAL", "kube-oom-monitor", "Heap memory exhaustion (100%). Pods terminated.");
            return 20; // reset memory
          }
          return next;
        });
      }

      // Handle Service Crash anomaly recovery
      if (currentCrash && containers.length > 0) {
        setServiceCrash(false);
        resolveAlert("Ingress container crash: Out of Memory (OOM)");
        resolveAlert("Complete Microservice Outage: Ingress Inoperable");
        addTimelineEvent("Cluster recovered: replicas restarted successfully", "INFO");
      }

      // Apply Load-balancing Scaling Effect:
      // More containers distribute the load, reducing average CPU and memory usage!
      const activeRunningCount = containers.filter((c) => c.status === "running").length || 1;
      const scaleReduction = 3 / activeRunningCount; // Baseline is 3 containers

      const finalCpu = userOverridden.cpu
        ? sliderCpu
        : Math.max(5, Math.min(100, Math.round(targetCpu * scaleReduction)));
      const finalMemory = currentAnomaly === "leak"
        ? memory
        : userOverridden.memory
          ? sliderMemory
          : Math.max(10, Math.min(100, Math.round(targetMemory * scaleReduction)));
      const finalDisk = userOverridden.disk ? sliderDisk : targetDisk;
      const finalNetwork = userOverridden.network ? sliderNetwork : targetNetwork;

      setCpu(finalCpu);
      if (currentAnomaly !== "leak") setMemory(finalMemory);
      setDisk(finalDisk);
      setNetwork(finalNetwork);

      if (!userOverridden.cpu) setSliderCpu(finalCpu);
      if (!userOverridden.memory && currentAnomaly !== "leak") setSliderMemory(finalMemory);
      if (!userOverridden.disk) setSliderDisk(finalDisk);
      if (!userOverridden.network) setSliderNetwork(finalNetwork);

      // 4. Error Rate Calculation
      let calcErrors = 0.2;
      if (currentDb) calcErrors += 75.0;
      if (currentApi) calcErrors += 18.0;
      if (currentAuth) calcErrors += 9.5;
      if (currentTimeout) calcErrors += 12.0;
      if (currentCrash || containers.length === 0) calcErrors = 100.0;

      const jitter = (Math.random() - 0.5) * 0.2;
      const finalErrors = parseFloat(Math.max(0, Math.min(100, calcErrors + jitter)).toFixed(2));
      setErrorRate(finalErrors);

      // Trigger Alerts based on resources / errors
      if (finalCpu >= 90) {
        triggerAlert("CRITICAL", "High CPU Load: Cluster CPU exceeding 90%");
      } else {
        resolveAlert("High CPU Load: Cluster CPU exceeding 90%");
      }

      if (finalErrors >= 10 && !currentDb && !currentCrash) {
        triggerAlert("WARNING", "Elevated Transaction Error Rate active");
      } else {
        resolveAlert("Elevated Transaction Error Rate active");
      }

      // 5. Dynamic Event Timeline Triggers
      if (requestRate > prevRequestRateRef.current) {
        addTimelineEvent("Traffic Increased", "INFO");
      }
      prevRequestRateRef.current = requestRate;

      if ((finalCpu > scaleUpThreshold && prevCpuRef.current <= scaleUpThreshold) || (finalCpu >= 90 && prevCpuRef.current < 90)) {
        addTimelineEvent("CPU Threshold Crossed", "ALERT");
      }
      prevCpuRef.current = finalCpu;

      if (currentDb && !prevDbFailureRef.current) {
        addTimelineEvent("Database Failure Detected", "ALERT");
      }
      prevDbFailureRef.current = currentDb;

      // 6. Autoscale Logic Check
      if (autoScalingEnabled && !currentCrash && containers.length > 0) {
        // Scale Up condition: CPU > 80% or Traffic rate > 4000
        if (finalCpu > scaleUpThreshold || requestRate > 4000) {
          if (containers.length < 12) {
            const newId = Math.random().toString();
            const newName = `pod-ingress-${Math.random().toString(36).substring(2, 6)}`;
            setContainers((prev) => [...prev, { id: newId, name: newName, status: "starting", createdAt: Date.now() }]);
            addTimelineEvent("Scaling Triggered", "SCALE_UP");
            addTimelineEvent("Container Added", "SCALE_UP");
            addTimelineEvent(`AUTO SCALE UP: Added container ${newName}. Total: ${containers.length + 1}`, "SCALE_UP");
            addTerminalLog("WARNING", "autoscaler", `Scaling event triggered: CPU usage (${finalCpu}%) is above threshold (${scaleUpThreshold}%). Scaling up replica set.`);
          }
        }
        // Scale Down condition: CPU < 30% and Traffic rate < 1500
        else if (finalCpu < scaleDownThreshold && requestRate < 1500) {
          if (containers.length > 2) {
            const target = containers[containers.length - 1];
            setContainers((prev) => prev.slice(0, -1));
            addTimelineEvent("Scaling Triggered", "SCALE_DOWN");
            addTimelineEvent(`AUTO SCALE DOWN: Terminated container ${target.name}. Total: ${containers.length - 1}`, "SCALE_DOWN");
            addTerminalLog("INFO", "autoscaler", `Scaling event triggered: CPU usage (${finalCpu}%) is below threshold (${scaleDownThreshold}%). Decommissioning container ${target.name}.`);
          }
        }
      }

      // 7. Append logs periodically
      if (Math.random() > 0.3) {
        // Collect active failure logs to generate
        const activeFailures: Array<{ level: TerminalLog["level"]; service: string; message: string }> = [];

        if (currentDb) {
          activeFailures.push({ level: "ERROR", service: "db-connector", message: "Database Connection Lost" });
          activeFailures.push({ level: "CRITICAL", service: "db-pool", message: "Database pool exhausted: primary SQL node unreachable" });
        }
        if (currentTimeout) {
          activeFailures.push({ level: "ERROR", service: "api-gateway", message: "API Timeout" });
          activeFailures.push({ level: "WARNING", service: "load-balancer", message: "Upstream gateway request exceeded deadline threshold" });
        }
        if (currentCrash || containers.length === 0) {
          activeFailures.push({ level: "CRITICAL", service: "orchestration-engine", message: "Service Unavailable" });
          activeFailures.push({ level: "CRITICAL", service: "kube-dns", message: "No healthy ingress pods detected in namespace default" });
        }
        if (currentApi) {
          activeFailures.push({ level: "ERROR", service: "api-gateway", message: "API Failure: Upstream returned 502 Bad Gateway" });
        }
        if (currentAuth) {
          activeFailures.push({ level: "ERROR", service: "auth-provider", message: "Authentication Failure: JWT signature verification failed" });
        }

        if (activeFailures.length > 0) {
          const selected = activeFailures[Math.floor(Math.random() * activeFailures.length)];
          addTerminalLog(selected.level, selected.service, selected.message);
        } else {
          // Normal operations logs
          const endpoints = ["/api/v1/health", "/api/v1/user", "/static/assets/logo.svg", "/checkout"];
          const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
          const lat = Math.round(currentTimeout ? 2500 + Math.random() * 2000 : 25 + Math.random() * 150);

          if (currentTrafficMode === "ddos") {
            addTerminalLog("ERROR", "ingress-controller", `Rate-limit breach from IP 104.22.45.${Math.floor(Math.random() * 10)} - 429 Too Many Requests`);
          } else if (finalErrors > 15) {
            addTerminalLog("ERROR", "api-gateway", `GET ${ep} failed with 500 Internal Server Error`);
          } else {
            addTerminalLog("INFO", "ingress-controller", `GET ${ep} - 200 OK (${lat}ms)`);
          }
        }
      }

      // 8. Update Telemetry History Chart Data
      telemetryHistory.current.shift();
      telemetryHistory.current.push({
        rps: currentRps,
        cpu: finalCpu,
        errors: finalErrors,
        replicas: containers.length
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [
    trafficMode, requestRate, dbFailure, apiFailure, authFailure, timeoutFailure,
    serviceCrash, containers, autoScalingEnabled, activeAnomaly, leakRate,
    sliderCpu, sliderMemory, sliderDisk, sliderNetwork, userOverridden, activeScenario,
    addTerminalLog, memory, resolveAlert, scaleDownThreshold, scaleUpThreshold, triggerAlert,
    loading
  ]);

  // --- Chart Drawing Canvas Effect ---
  useEffect(() => {
    if (loading) return;
    let animationId: number;

    const drawChart = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      const padding = 12;
      const graphWidth = width - padding * 2;
      const graphHeight = height - padding * 2;

      const dark = document.documentElement.classList.contains("dark");
      ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
      ctx.lineWidth = 1;

      // Draw grid
      for (let j = 1; j < 4; j++) {
        const yVal = padding + (graphHeight / 4) * j;
        ctx.beginPath();
        ctx.moveTo(padding, yVal);
        ctx.lineTo(width - padding, yVal);
        ctx.stroke();
      }

      const drawLine = (dataKey: keyof TelemetryPoint, color: string, maxVal: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.lineJoin = "round";

        const points = telemetryHistory.current;
        for (let i = 0; i < points.length; i++) {
          const x = padding + (graphWidth / (points.length - 1)) * i;
          const val = points[i][dataKey];
          const y = padding + graphHeight - graphHeight * (val / maxVal);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      // Draw the metrics
      drawLine("cpu", "#f59e0b", 100);       // CPU (Amber)
      drawLine("errors", "#ef4444", 100);    // Errors (Red)
      drawLine("replicas", "#06b6d4", 12);   // Replicas (Blue)

      animationId = requestAnimationFrame(drawChart);
    };

    drawChart();
    return () => cancelAnimationFrame(animationId);
  }, [resolvedTheme, loading]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black font-mono text-xs text-body">
        <div className="flex flex-col items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border border-t-transparent border-[#50e3c2]" />
          <span className="tracking-widest">ESTABLISHING SECURE CREDENTIALS HANDSHAKE...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="py-10 px-4 md:px-6 bg-canvas border-b border-hairline font-sans">
      <div className="mx-auto max-w-[1400px]">

        {/* Playgound Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-[4px]">
              DevOps Simulation Lab
            </span>
            <h1 className="font-sans text-3xl font-bold text-ink tracking-tight mt-2">
              Auto Scaling & Chaos Playground
            </h1>
            <p className="text-xs text-body mt-1">
              Configure workloads, inject failures, manipulate hardware resources, and analyze orchestration responses in real-time.
            </p>
          </div>

          {/* User & Alert Ticker */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">

            <div className="flex items-center gap-2">
              {activeAlerts.length === 0 ? (
                <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success text-xs font-semibold px-3 py-1.5 rounded-[6px]">
                  <Check className="h-4.5 w-4.5" />
                  <span>SYSTEM HEALTHY: NO ACTIVE ALERTS</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error text-xs font-semibold px-3 py-1.5 rounded-[6px] animate-pulse">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <span>{activeAlerts.length} ACTIVE ALERTS DETECTED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Scenario Banner */}
        {activeScenario && (
          <div className="mb-6 bg-primary/5 border border-primary/20 p-4 rounded-[6px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-link animate-spin-slow" />
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Active Demo Scenario: {activeScenario.replace("_", " ").toUpperCase()}
                </h4>
                <p className="text-xs text-body mt-0.5">{scenarioStatus}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-bold text-mute bg-canvas-soft border border-hairline px-2.5 py-1 rounded-[4px]">
                TIME: {scenarioTimer}s
              </span>
              <button
                onClick={() => setActiveScenario(null)}
                className="stark-btn-secondary h-8 px-3 text-xs font-bold text-error border-error/20 hover:bg-error/5 cursor-pointer"
              >
                Abort Scenario
              </button>
            </div>
          </div>
        )}

        {/* Main Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">

          {/* 1. Traffic Simulation Card */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Traffic Workload Simulation
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-canvas-soft p-3 border border-hairline rounded-[6px] text-center">
                  <span className="font-mono text-2xl font-bold text-ink tabular-nums">{rps}</span>
                  <p className="text-[9px] text-body uppercase tracking-wider mt-0.5">Requests / Sec</p>
                </div>
                <div className="bg-canvas-soft p-3 border border-hairline rounded-[6px] text-center">
                  <span className="font-mono text-2xl font-bold text-mute tabular-nums">{totalRequests}</span>
                  <p className="text-[9px] text-body uppercase tracking-wider mt-0.5">Total Requests</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  id="btn-traffic-normal"
                  onClick={() => handleTrafficChange("normal")}
                  className={`flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer ${trafficMode === "normal" ? "border-primary bg-primary/5 text-primary" : ""
                    }`}
                >
                  <span>Normal Traffic</span>
                  <span className="font-mono text-[10px] text-mute">100 req/min</span>
                </button>
                <button
                  id="btn-traffic-high"
                  onClick={() => handleTrafficChange("high")}
                  className={`flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer ${trafficMode === "high" ? "border-warning bg-warning/5 text-warning" : ""
                    }`}
                >
                  <span>High Traffic</span>
                  <span className="font-mono text-[10px] text-mute">1000 req/min</span>
                </button>
                <button
                  id="btn-traffic-viral"
                  onClick={() => handleTrafficChange("viral")}
                  className={`flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer ${trafficMode === "viral" ? "border-primary bg-primary/5 text-primary" : ""
                    }`}
                >
                  <span>Viral Traffic</span>
                  <span className="font-mono text-[10px] text-mute">5000 req/min</span>
                </button>
                <button
                  id="btn-traffic-ddos"
                  onClick={() => handleTrafficChange("ddos")}
                  className={`flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer ${trafficMode === "ddos" ? "border-error bg-error/5 text-error font-bold" : ""
                    }`}
                >
                  <span>DDoS Simulation</span>
                  <span className="font-mono text-[10px] text-mute">10000 req/min</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-mute mt-4 leading-normal">
              Simulates client traffic load. Higher loads cause CPU usage spikes and trigger scale events.
            </p>
          </div>

          {/* 2. Resource Control Panel Card */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Resource Hardware Controls
                  </h3>
                </div>
                {Object.values(userOverridden).some(Boolean) && (
                  <button
                    onClick={() => {
                      setUserOverridden({ cpu: false, memory: false, disk: false, network: false });
                      setActiveAnomaly("none");
                      setLeakRate(0);
                      addTimelineEvent("Restored automatic resource load values", "INFO");
                    }}
                    className="text-[9px] text-mute hover:text-ink font-mono uppercase underline border-none bg-transparent cursor-pointer"
                  >
                    Reset Auto
                  </button>
                )}
              </div>

              {/* Sliders */}
              <div className="flex flex-col gap-4">
                {/* CPU */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-ink">
                      <Cpu className="h-3.5 w-3.5 text-mute" /> CPU Usage
                    </span>
                    <span className="font-bold">{sliderCpu}%</span>
                  </div>
                  <input
                    id="slider-cpu"
                    type="range"
                    min="5"
                    max="100"
                    value={sliderCpu}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSliderCpu(val);
                      setCpu(val);
                      setUserOverridden((prev) => ({ ...prev, cpu: true }));
                    }}
                    className="w-full h-1 bg-hairline rounded-[2px] appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Memory */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-ink">
                      <HardDrive className="h-3.5 w-3.5 text-mute" /> Memory Usage
                    </span>
                    <span className="font-bold">{Math.round(sliderMemory)}%</span>
                  </div>
                  <input
                    id="slider-memory"
                    type="range"
                    min="10"
                    max="100"
                    value={sliderMemory}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSliderMemory(val);
                      setMemory(val);
                      setUserOverridden((prev) => ({ ...prev, memory: true }));
                    }}
                    className="w-full h-1 bg-hairline rounded-[2px] appearance-none cursor-pointer accent-primary"
                  />
                </div>
                {/* Disk */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-ink">
                      <Server className="h-3.5 w-3.5 text-mute" /> Disk Usage
                    </span>
                    <span className="font-bold">{sliderDisk}%</span>
                  </div>
                  <input
                    id="slider-disk"
                    type="range"
                    min="5"
                    max="100"
                    value={sliderDisk}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSliderDisk(val);
                      setDisk(val);
                      setUserOverridden((prev) => ({ ...prev, disk: true }));
                    }}
                    className="w-full h-1 bg-hairline rounded-[2px] appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Network */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-ink">
                      <Wifi className="h-3.5 w-3.5 text-mute" /> Network Utilization
                    </span>
                    <span className="font-bold">{sliderNetwork}%</span>
                  </div>
                  <input
                    id="slider-network"
                    type="range"
                    min="5"
                    max="100"
                    value={sliderNetwork}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSliderNetwork(val);
                      setNetwork(val);
                      setUserOverridden((prev) => ({ ...prev, network: true }));
                    }}
                    className="w-full h-1 bg-hairline rounded-[2px] appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-mute mt-4 leading-normal">
              Manually adjusting resource sliders disables automated traffic-driven calculations for that specific hardware metric.
            </p>
          </div>

          {/* 3. Auto Scaling Sandbox Card */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Orchestrator Autoscaler Sandbox
                  </h3>
                </div>
              </div>

              {/* Scaling stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-mono">
                <div className="bg-canvas-soft py-1.5 border border-hairline rounded-[6px]">
                  <span className="font-bold text-ink">{containers.length}</span>
                  <p className="text-[8px] text-mute uppercase tracking-wider mt-0.5">Current Containers</p>
                </div>
                <div className="bg-canvas-soft py-1.5 border border-hairline rounded-[6px] text-error">
                  <span className="font-bold">{scaleUpThreshold}% CPU</span>
                  <p className="text-[8px] text-mute uppercase tracking-wider mt-0.5">Scale-Up Threshold</p>
                </div>
                <div className="bg-canvas-soft py-1.5 border border-hairline rounded-[6px] text-link">
                  <span className="font-bold">{scaleDownThreshold}% CPU</span>
                  <p className="text-[8px] text-mute uppercase tracking-wider mt-0.5">Scale-Down Threshold</p>
                </div>
              </div>

              {/* Visual Container Pod Grid */}
              <span className="font-mono text-[9px] uppercase tracking-wider text-mute mb-2 block">
                Cluster Pod Replica Array ({containers.length} / 12)
              </span>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {containers.map((c) => (
                  <div
                    key={c.id}
                    className={`p-1.5 border rounded-[4px] flex flex-col items-center justify-center text-center transition-all ${c.status === "starting"
                        ? "border-warning/40 bg-warning/5 text-warning animate-pulse"
                        : "border-success/30 bg-success/5 text-success"
                      }`}
                  >
                    <Server className="h-4 w-4 mb-1" />
                    <span className="font-mono text-[7px] text-mute">{c.name}</span>
                    <span className={`font-mono text-[6px] uppercase tracking-wide px-1 rounded-[2px] mt-0.5 ${c.status === "starting" ? "bg-warning/10" : "bg-success/10"
                      }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Adjust Replicas & Autoscaling Buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    id="btn-scale-up"
                    onClick={handleAddContainer}
                    disabled={containers.length >= 12}
                    className="flex-1 stark-btn-secondary h-8 px-2.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Container
                  </button>
                  <button
                    id="btn-scale-down"
                    onClick={handleRemoveContainer}
                    disabled={containers.length <= 1}
                    className="flex-1 stark-btn-secondary h-8 px-2.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Minus className="h-3.5 w-3.5 mr-1" /> Remove Container
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    id="btn-enable-autoscaling"
                    onClick={() => {
                      setAutoScalingEnabled(true);
                      addTimelineEvent("Autoscaling sandbox changed: ENABLED", "INFO");
                      addTerminalLog("INFO", "autoscaler", "Autoscaling rules engine status: ONLINE");
                    }}
                    className={`flex-1 stark-btn-secondary h-8 px-2 text-[10px] font-semibold cursor-pointer ${autoScalingEnabled ? "border-primary bg-primary/5 text-primary" : ""
                      }`}
                  >
                    Enable Auto Scaling
                  </button>
                  <button
                    id="btn-disable-autoscaling"
                    onClick={() => {
                      setAutoScalingEnabled(false);
                      addTimelineEvent("Autoscaling sandbox changed: DISABLED", "INFO");
                      addTerminalLog("INFO", "autoscaler", "Autoscaling rules engine status: OFFLINE");
                    }}
                    className={`flex-1 stark-btn-secondary h-8 px-2 text-[10px] font-semibold cursor-pointer ${!autoScalingEnabled ? "border-error bg-error/5 text-error" : ""
                      }`}
                  >
                    Disable Auto Scaling
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-mute mt-4 leading-normal">
              Autoscaler scales containers automatically if load exceeds threshold. High container counts distribute CPU stress.
            </p>
          </div>

        </div>

        {/* Second Row Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">

          {/* 4. Error Injection Panel */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Failure & Chaos Injection
                  </h3>
                </div>
                {(dbFailure || apiFailure || authFailure || timeoutFailure || serviceCrash) && (
                  <button
                    onClick={() => {
                      setDbFailure(false);
                      setApiFailure(false);
                      setAuthFailure(false);
                      setTimeoutFailure(false);
                      setServiceCrash(false);
                      resolveAlert("Database Service Outage");
                      resolveAlert("API Service Outage");
                      resolveAlert("Authentication Gate Fault");
                      resolveAlert("Upstream Timeout faults active");
                      resolveAlert("Primary Ingress Crash event");
                      addTimelineEvent("Cleared all injected active failures", "INFO");
                      addTerminalLog("INFO", "orchestration-engine", "Chaos mitigation: cleared all injected network faults");
                    }}
                    className="text-[9px] text-mute hover:text-ink font-mono uppercase underline border-none bg-transparent cursor-pointer"
                  >
                    Clear Faults
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2.5">

                {/* Database Failure */}
                <div className="flex items-center justify-between bg-canvas-soft p-2.5 border border-hairline rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <Database className={`h-4 w-4 ${dbFailure ? "text-error" : "text-mute"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">Database Failure</span>
                      <span className="text-[9px] text-mute">Disconnect primary SQL pool</span>
                    </div>
                  </div>
                  <button
                    id="btn-chaos-db"
                    onClick={() => {
                      setDbFailure(!dbFailure);
                      if (!dbFailure) {
                        triggerAlert("CRITICAL", "Database Service Outage");
                      } else {
                        resolveAlert("Database Service Outage");
                      }
                    }}
                    className={`relative inline-flex h-4 w-8 items-center shrink-0 cursor-pointer rounded-full border border-hairline transition-colors duration-200 px-[2px] ${dbFailure ? "bg-error border-error" : "bg-canvas"
                      }`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full transition duration-200 bg-canvas ${dbFailure ? "translate-x-4" : "translate-x-0 bg-mute"
                      }`} />
                  </button>
                </div>

                {/* API Gateway Failure */}
                <div className="flex items-center justify-between bg-canvas-soft p-2.5 border border-hairline rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <Server className={`h-4 w-4 ${apiFailure ? "text-error" : "text-mute"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">API Failure</span>
                      <span className="text-[9px] text-mute">Force 500 server errors</span>
                    </div>
                  </div>
                  <button
                    id="btn-chaos-api"
                    onClick={() => {
                      setApiFailure(!apiFailure);
                      if (!apiFailure) {
                        triggerAlert("WARNING", "API Service Outage");
                      } else {
                        resolveAlert("API Service Outage");
                      }
                    }}
                    className={`relative inline-flex h-4 w-8 items-center shrink-0 cursor-pointer rounded-full border border-hairline transition-colors duration-200 px-[2px] ${apiFailure ? "bg-error border-error" : "bg-canvas"
                      }`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full transition duration-200 bg-canvas ${apiFailure ? "translate-x-4" : "translate-x-0 bg-mute"
                      }`} />
                  </button>
                </div>

                {/* Authentication failure */}
                <div className="flex items-center justify-between bg-canvas-soft p-2.5 border border-hairline rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <Key className={`h-4 w-4 ${authFailure ? "text-error" : "text-mute"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">Authentication Failure</span>
                      <span className="text-[9px] text-mute">Force JWT validation failures</span>
                    </div>
                  </div>
                  <button
                    id="btn-chaos-auth"
                    onClick={() => {
                      setAuthFailure(!authFailure);
                      if (!authFailure) {
                        triggerAlert("WARNING", "Authentication Gate Fault");
                      } else {
                        resolveAlert("Authentication Gate Fault");
                      }
                    }}
                    className={`relative inline-flex h-4 w-8 items-center shrink-0 cursor-pointer rounded-full border border-hairline transition-colors duration-200 px-[2px] ${authFailure ? "bg-error border-error" : "bg-canvas"
                      }`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full transition duration-200 bg-canvas ${authFailure ? "translate-x-4" : "translate-x-0 bg-mute"
                      }`} />
                  </button>
                </div>

                {/* Gateway Timeout */}
                <div className="flex items-center justify-between bg-canvas-soft p-2.5 border border-hairline rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${timeoutFailure ? "text-error" : "text-mute"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">Timeout Errors</span>
                      <span className="text-[9px] text-mute">Inject 504 gateway delays</span>
                    </div>
                  </div>
                  <button
                    id="btn-chaos-timeout"
                    onClick={() => {
                      setTimeoutFailure(!timeoutFailure);
                      if (!timeoutFailure) {
                        triggerAlert("WARNING", "Upstream Timeout faults active");
                      } else {
                        resolveAlert("Upstream Timeout faults active");
                      }
                    }}
                    className={`relative inline-flex h-4 w-8 items-center shrink-0 cursor-pointer rounded-full border border-hairline transition-colors duration-200 px-[2px] ${timeoutFailure ? "bg-error border-error" : "bg-canvas"
                      }`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full transition duration-200 bg-canvas ${timeoutFailure ? "translate-x-4" : "translate-x-0 bg-mute"
                      }`} />
                  </button>
                </div>

                {/* Pod Crash */}
                <div className="flex items-center justify-between bg-canvas-soft p-2.5 border border-hairline rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <Server className={`h-4 w-4 ${serviceCrash ? "text-error" : "text-mute"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">Service Crash</span>
                      <span className="text-[9px] text-mute">Kill all active node replicas</span>
                    </div>
                  </div>
                  <button
                    id="btn-chaos-crash"
                    onClick={() => {
                      setServiceCrash(!serviceCrash);
                      if (!serviceCrash) {
                        setContainers([]);
                        triggerAlert("CRITICAL", "Primary Ingress Crash event");
                      } else {
                        setContainers([
                          { id: Math.random().toString(), name: "pod-ingress-7fc1", status: "running", createdAt: Date.now() }
                        ]);
                        resolveAlert("Primary Ingress Crash event");
                      }
                    }}
                    className={`relative inline-flex h-4 w-8 items-center shrink-0 cursor-pointer rounded-full border border-hairline transition-colors duration-200 px-[2px] ${serviceCrash ? "bg-error border-error" : "bg-canvas"
                      }`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full transition duration-200 bg-canvas ${serviceCrash ? "translate-x-4" : "translate-x-0 bg-mute"
                      }`} />
                  </button>
                </div>

              </div>
            </div>

            <p className="text-[10px] text-mute mt-4 leading-normal">
              Failures inject transaction errors. Observe error rates spike and alert logs flood the dashboard in real-time.
            </p>
          </div>

          {/* 5. Anomaly Simulation & Scenario Demos */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Scenario runner & Anomalies
                  </h3>
                </div>
                {activeAnomaly !== "none" && (
                  <button
                    onClick={clearAnomaly}
                    className="text-[9px] text-error hover:text-ink font-mono uppercase underline border-none bg-transparent cursor-pointer font-bold"
                  >
                    Clear Anomaly
                  </button>
                )}
              </div>

              {/* Anomaly triggers */}
              <span className="font-mono text-[9px] uppercase tracking-wider text-mute mb-2.5 block">
                Chaos Anomaly Injectors
              </span>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  id="btn-anomaly-spike"
                  onClick={() => triggerAnomaly("spike")}
                  className={`stark-btn-secondary h-8 text-xs font-semibold cursor-pointer ${activeAnomaly === "spike" ? "bg-warning/15 border-warning text-warning" : ""
                    }`}
                >
                  Traffic Spike
                </button>
                <button
                  id="btn-anomaly-leak"
                  onClick={() => triggerAnomaly("leak")}
                  className={`stark-btn-secondary h-8 text-xs font-semibold cursor-pointer ${activeAnomaly === "leak" ? "bg-warning/15 border-warning text-warning" : ""
                    }`}
                >
                  Memory Leak
                </button>
                <button
                  id="btn-anomaly-storm"
                  onClick={() => triggerAnomaly("storm")}
                  className={`stark-btn-secondary h-8 text-xs font-semibold cursor-pointer ${activeAnomaly === "storm" ? "bg-error/15 border-error text-error" : ""
                    }`}
                >
                  Error Storm
                </button>
                <button
                  id="btn-anomaly-outage"
                  onClick={() => triggerAnomaly("outage")}
                  className={`stark-btn-secondary h-8 text-xs font-semibold cursor-pointer ${activeAnomaly === "outage" ? "bg-error/15 border-error text-error font-bold" : ""
                    }`}
                >
                  Service Outage
                </button>
              </div>

              {/* Demo Scenario Runner */}
              <span className="font-mono text-[9px] uppercase tracking-wider text-mute mb-2.5 block">
                Preconfigured Demo Scenarios
              </span>
              <div className="flex flex-col gap-2">
                <button
                  id="demo-black-friday"
                  onClick={() => runScenario("black_friday")}
                  className="flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  <span>Black Friday Traffic</span>
                  <Play className="h-3.5 w-3.5 text-mute" />
                </button>
                <button
                  id="demo-db-outage"
                  onClick={() => runScenario("db_outage")}
                  className="flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  <span>Database Outage</span>
                  <Play className="h-3.5 w-3.5 text-mute" />
                </button>
                <button
                  id="demo-viral-post"
                  onClick={() => runScenario("viral_post")}
                  className="flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  <span>Viral Social Media Post</span>
                  <Play className="h-3.5 w-3.5 text-mute" />
                </button>
                <button
                  id="demo-ddos-attack"
                  onClick={() => runScenario("ddos_attack")}
                  className="flex items-center !justify-between w-full stark-btn-secondary h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  <span>DDoS Attack</span>
                  <Play className="h-3.5 w-3.5 text-mute" />
                </button>
              </div>

              {/* Custom Config Templates */}
              <span className="font-mono text-[9px] uppercase tracking-wider text-mute mt-4 mb-2.5 block">
                Custom Config Templates
              </span>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Template name..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1 bg-canvas border border-hairline px-3 py-1.5 rounded-[6px] text-xs font-mono text-ink focus:outline-none focus:border-primary placeholder:text-mute"
                />
                <button
                  onClick={handleSaveTemplate}
                  className="stark-btn-secondary h-8 px-3 text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 cursor-pointer whitespace-nowrap"
                >
                  Save Config
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                {customTemplates.length === 0 ? (
                  <span className="text-mute italic text-[10px] block py-1 font-mono">No custom templates saved yet.</span>
                ) : (
                  customTemplates.map((tpl) => (
                    <div key={tpl.name} className="flex items-center justify-between bg-canvas-soft border border-hairline px-2.5 py-1.5 rounded-[6px] text-xs font-mono">
                      <button
                        onClick={() => handleLoadTemplate(tpl)}
                        className="text-ink hover:underline text-left cursor-pointer flex-1"
                      >
                        {tpl.name}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.name)}
                        className="text-mute hover:text-error transition-colors cursor-pointer ml-2 border-none bg-transparent"
                        title="Delete Template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[10px] text-mute mt-4 leading-normal">
              Running a scenario automatically guides the system state over time to demonstrate alerting, metrics, and scaling.
            </p>
          </div>

          {/* 6. Central Event Timeline */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between">
            <div className="flex-1 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Live System Event Timeline
                  </h3>
                </div>
                <span className="font-mono text-[9px] text-mute bg-canvas-soft border border-hairline px-1.5 py-0.5 rounded-[3px]">
                  {timelineEvents.length} Events
                </span>
              </div>

              {/* Scrolling Timeline viewport */}
              <div
                ref={timelineRef}
                className="flex-1 bg-canvas-soft border border-hairline p-3 font-mono text-[9.5px] text-body overflow-y-auto max-h-[295px] custom-scrollbar rounded-[6px] flex flex-col gap-2.5"
              >
                {timelineEvents.length === 0 ? (
                  <span className="text-mute italic">Awaiting cluster events…</span>
                ) : (
                  timelineEvents.map((evt) => {
                    let bulletColor = "bg-mute";
                    let textClass = "text-body";
                    if (evt.type === "SCALE_UP") {
                      bulletColor = "bg-success";
                      textClass = "text-ink font-bold";
                    } else if (evt.type === "SCALE_DOWN") {
                      bulletColor = "bg-link";
                      textClass = "text-body";
                    } else if (evt.type === "ALERT") {
                      bulletColor = "bg-error animate-pulse";
                      textClass = "text-error font-semibold";
                    } else if (evt.type === "MITIGATION") {
                      bulletColor = "bg-primary";
                      textClass = "text-link font-semibold";
                    }

                    return (
                      <div key={evt.id} className="flex gap-2.5 relative border-l border-hairline pl-3 pb-1">
                        <span className={`absolute left-[-4.5px] top-[3.5px] h-2 w-2 rounded-full ${bulletColor}`} />
                        <span className="text-mute">[{evt.time}]</span>
                        <span className={textClass}>{evt.text}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <p className="text-[10px] text-mute mt-4 leading-normal">
              Chronological log of alerts, scaling actions, firewalls, and manual interventions recorded live.
            </p>
          </div>

        </div>

        {/* Live Cluster Metrics & CDN Globe Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
          {/* Chart Card */}
          <div className="lg:col-span-8 stark-card flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-hairline pb-4 mb-4 gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Cluster Live Telemetry Stream (60s window)
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-warning font-semibold">
                    <span className="h-2 w-2 bg-warning rounded-[1px]"></span>
                    <span>CPU ({cpu}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-error font-semibold">
                    <span className="h-2 w-2 bg-error rounded-[1px]"></span>
                    <span>ERRORS ({errorRate}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-link font-semibold">
                    <span className="h-2 w-2 bg-link rounded-[1px]"></span>
                    <span>REPLICAS ({containers.length})</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[220px] bg-canvas-soft rounded-[6px] relative overflow-hidden border border-hairline">
                <canvas ref={canvasRef} className="w-full h-full block"></canvas>
              </div>
            </div>
            <p className="text-[10px] text-mute mt-4 leading-normal">
              Continuous 60-second sliding telemetry metrics monitoring node resource consumption and replicas mutation logs.
            </p>
          </div>

          {/* Globe Card */}
          <div className="lg:col-span-4 stark-card flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4.5 w-4.5 text-mute" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Global Edge Traffic (CDN)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-[9px] text-emerald-500 uppercase font-semibold">Live Simulation</span>
                </div>
              </div>

              <div className="w-full max-w-[340px] mx-auto">
                <GlobeCdn speed={0.003} />
              </div>
            </div>
            <p className="text-[10px] text-mute mt-4 leading-normal">
              Simulated Kubernetes cluster edge ingress routing and multi-region CDN traffic requests passing through global gateway sharding regions.
            </p>
          </div>
        </div>

        {/* 7. Live Log Terminal (Full Width) */}
        <div className="stark-card">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-hairline pb-4 mb-4 gap-3">
            <div className="flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-mute" />
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                Live Console Terminal log stream
              </h3>
            </div>

            {/* Terminal filters & controls */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Log filter toggles */}
              <div className="flex rounded-[6px] border border-hairline bg-canvas p-0.5 overflow-hidden text-[10px] font-mono">
                {(["ALL", "INFO", "WARNING", "ERROR", "CRITICAL"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`px-2 py-1 rounded-[4px] cursor-pointer font-bold transition-all ${logFilter === filter ? "bg-primary text-on-primary" : "text-mute hover:text-ink"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Log stream operations */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsLogPaused(!isLogPaused)}
                  className="stark-btn-secondary h-7 px-2.5 text-[10px] font-bold cursor-pointer"
                  title={isLogPaused ? "Resume Terminal" : "Pause Terminal"}
                >
                  {isLogPaused ? <Play className="h-3.5 w-3.5 text-success mr-1" /> : <Pause className="h-3.5 w-3.5 mr-1" />}
                  {isLogPaused ? "RESUME" : "PAUSE"}
                </button>
                <button
                  onClick={handleClearLogs}
                  className="stark-btn-secondary h-7 px-2.5 text-[10px] font-bold cursor-pointer"
                  title="Clear Terminal logs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> CLEAR
                </button>
                <button
                  onClick={handleExportLogs}
                  className="stark-btn-secondary h-7 px-2.5 text-[10px] font-bold cursor-pointer"
                  title="Export logs to file"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> EXPORT
                </button>
              </div>

            </div>
          </div>

          {/* Terminal Console View */}
          <div
            ref={terminalRef}
            className="w-full bg-canvas-soft border border-hairline p-4 font-mono text-[10px] text-ink leading-relaxed rounded-[6px] overflow-y-auto max-h-[350px] min-h-[180px] custom-scrollbar select-text"
          >
            {terminalLogs.length === 0 ? (
              <span className="text-mute italic">Awaiting logs... (adjust Traffic or inject failure to see logs immediately)</span>
            ) : (
              terminalLogs
                .filter((log) => {
                  if (logFilter === "ALL") return true;
                  if (logFilter === "INFO") return log.level === "INFO";
                  if (logFilter === "WARNING") return log.level === "WARNING";
                  if (logFilter === "ERROR") return log.level === "ERROR";
                  if (logFilter === "CRITICAL") return log.level === "CRITICAL";
                  return true;
                })
                .map((log) => {
                  let badgeColor = "bg-primary/10 border-primary/20 text-ink";
                  if (log.level === "WARNING") badgeColor = "bg-warning/10 border-warning/20 text-warning";
                  if (log.level === "ERROR") badgeColor = "bg-error/10 border-error/20 text-error font-semibold";
                  if (log.level === "CRITICAL") badgeColor = "bg-error/25 border-error/30 text-error font-bold animate-pulse";

                  return (
                    <div key={log.id} className="flex items-start gap-1 mb-1 font-mono hover:bg-canvas-soft-hover py-0.5 px-1 rounded-[3px] transition-colors">
                      <span className="text-mute select-none shrink-0">[{log.time}]</span>{" "}
                      <span className={`px-1.5 py-0.2 select-none border rounded-[3px] text-[8px] font-bold shrink-0 ${badgeColor}`}>
                        {log.level}
                      </span>{" "}
                      <span className="text-link font-semibold select-none shrink-0">[{log.service}]</span>{" "}
                      <span className="text-ink break-all">{log.message}</span>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
