"use client";

import React, { useState } from "react";
import { Server, Eye, Layers, Check, Activity, X } from "lucide-react";

export interface PodNode {
  id: string;
  name: string;
  node: string;
  zone: string;
  ip: string;
  status: "running" | "starting" | "terminating" | "quarantined";
  cpuUsage: number;
  memUsage: number;
  rps: number;
  lastLog: string;
}

interface ClusterTopologyMapProps {
  containers: Array<{ id: string; name: string; status: "starting" | "running"; createdAt: number }>;
  currentRps: number;
  blockedCount: number;
}

const NODES = [
  { id: "node-worker-alpha", name: "k8s-node-alpha (c6i.2xlarge)", zone: "us-east-1a", cpuCores: 8, memGb: 16 },
  { id: "node-worker-beta", name: "k8s-node-beta (c6i.2xlarge)", zone: "us-east-1b", cpuCores: 8, memGb: 16 },
  { id: "node-worker-gamma", name: "k8s-node-gamma (c6i.2xlarge)", zone: "us-east-1c", cpuCores: 8, memGb: 16 },
];

export function ClusterTopologyMap({
  containers,
  currentRps,
  blockedCount,
}: ClusterTopologyMapProps) {
  const [selectedPod, setSelectedPod] = useState<PodNode | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>("ALL");

  // Distribute containers deterministically across the 3 worker nodes
  const pods: PodNode[] = containers.map((c, idx) => {
    const nodeObj = NODES[idx % NODES.length];
    const podRps = Math.round(currentRps / Math.max(1, containers.length) + (idx * 3 - 5));
    const cpuPct = Math.min(95, Math.max(12, Math.round(18 + (podRps / 150) * 14)));
    const memMb = Math.round(180 + idx * 24 + (podRps * 0.4));
    const ip = `10.244.${(idx % 3) + 1}.${14 + idx}`;

    return {
      id: c.id,
      name: c.name,
      node: nodeObj.id,
      zone: nodeObj.zone,
      ip,
      status: c.status === "starting" ? "starting" : idx === 0 && blockedCount > 20 ? "quarantined" : "running",
      cpuUsage: cpuPct,
      memUsage: memMb,
      rps: Math.max(0, podRps),
      lastLog: `{"time":"${new Date().toISOString()}","level":"info","path":"/api/v1/checkout","status":200,"dur_ms":${(1.4 + idx * 0.2).toFixed(1)}}`,
    };
  });

  const filteredPods = selectedZone === "ALL" ? pods : pods.filter((p) => p.zone === selectedZone);

  return (
    <div className="w-full rounded-[8px] border border-hairline bg-canvas p-6 shadow-diffused">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-semibold mb-1">
            <Layers className="h-3 w-3" />
            <span>KUBERNETES CLUSTER TOPOLOGY</span>
          </div>
          <h3 className="text-base font-bold text-ink tracking-tight">
            Node Distribution & Pod Placement Matrix
          </h3>
          <p className="text-xs text-body mt-0.5">
            Real-time multi-zone workload layout. Direct stdout streams intercepted by node DaemonSets.
          </p>
        </div>

        {/* Zone Filter */}
        <div className="flex items-center gap-1 bg-canvas-soft p-1 rounded-[6px] border border-hairline text-xs font-mono">
          <span className="text-mute px-2 text-[10px] uppercase font-bold">AZ:</span>
          {["ALL", "us-east-1a", "us-east-1b", "us-east-1c"].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-2 py-1 rounded-[4px] transition-all text-xs ${
                selectedZone === zone
                  ? "bg-canvas text-ink font-bold shadow-xs border border-hairline"
                  : "text-mute hover:text-ink"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Cluster Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NODES.map((node) => {
          const nodePods = filteredPods.filter((p) => p.node === node.id);
          const totalNodeRps = nodePods.reduce((acc, p) => acc + p.rps, 0);

          return (
            <div
              key={node.id}
              className="rounded-[6px] border border-hairline bg-canvas-soft p-4 flex flex-col justify-between"
            >
              {/* Node Header */}
              <div>
                <div className="flex items-center justify-between border-b border-hairline pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-ink" />
                    <div>
                      <div className="text-xs font-bold text-ink font-mono">{node.id}</div>
                      <div className="text-[10px] text-mute font-mono">{node.zone} • {node.cpuCores} vCPU</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    READY
                  </div>
                </div>

                {/* DaemonSet Agent Status */}
                <div className="mb-3 px-2 py-1.5 rounded-[4px] bg-canvas border border-hairline flex items-center justify-between text-[10px] font-mono">
                  <span className="text-mute flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-cyan" />
                    logstrata-daemon agent:
                  </span>
                  <span className="text-cyan font-bold">TAILING /var/log/pods</span>
                </div>

                {/* Pod Replicas Inside This Node */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-mute uppercase tracking-wider flex justify-between">
                    <span>Replicas ({nodePods.length})</span>
                    <span>Total: {totalNodeRps} RPS</span>
                  </div>

                  {nodePods.length === 0 ? (
                    <div className="p-4 border border-dashed border-hairline rounded-[4px] text-center text-xs text-mute font-mono">
                      No active pods scheduled in this zone
                    </div>
                  ) : (
                    nodePods.map((pod) => (
                      <div
                        key={pod.id}
                        onClick={() => setSelectedPod(pod)}
                        className={`p-2.5 rounded-[4px] border cursor-pointer transition-all ${
                          selectedPod?.id === pod.id
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-hairline bg-canvas hover:border-hairline-strong"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                pod.status === "starting"
                                  ? "bg-warning animate-spin"
                                  : pod.status === "quarantined"
                                  ? "bg-error animate-pulse"
                                  : "bg-emerald-400"
                              }`}
                            />
                            <span className="font-mono text-xs font-semibold text-ink truncate">
                              {pod.name}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-mute shrink-0">
                            {pod.rps} RPS
                          </span>
                        </div>

                        {/* Pod Micro Stats */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-mute mt-1.5 pt-1.5 border-t border-hairline/60">
                          <span>{pod.ip}</span>
                          <span>CPU: {pod.cpuUsage}%</span>
                          <span>{pod.memUsage} MB</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Node Summary Footer */}
              <div className="mt-4 pt-2 border-t border-hairline flex items-center justify-between text-[10px] font-mono text-mute">
                <span>Capacity: {nodePods.length}/16 pods</span>
                <span>{((nodePods.length / 16) * 100).toFixed(0)}% alloc</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-out / Modal Drawer for Selected Pod Inspection */}
      {selectedPod && (
        <div className="mt-6 p-4 rounded-[6px] border border-cyan/30 bg-cyan/5 transition-all">
          <div className="flex items-center justify-between border-b border-hairline pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan" />
              <span className="text-xs font-mono font-bold text-ink">
                LIVE CONTAINER STREAM INSPECTION: {selectedPod.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan/20 text-cyan text-[10px] font-mono font-bold uppercase">
                {selectedPod.status}
              </span>
            </div>
            <button
              onClick={() => setSelectedPod(null)}
              className="text-mute hover:text-ink text-xs p-1 rounded hover:bg-canvas"
              aria-label="Close Inspection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-3">
            <div className="p-2 rounded bg-canvas border border-hairline">
              <span className="text-mute text-[10px] block">NODE & ZONE</span>
              <span className="text-ink font-semibold">{selectedPod.node} ({selectedPod.zone})</span>
            </div>
            <div className="p-2 rounded bg-canvas border border-hairline">
              <span className="text-mute text-[10px] block">INTERNAL IP</span>
              <span className="text-ink font-semibold">{selectedPod.ip}</span>
            </div>
            <div className="p-2 rounded bg-canvas border border-hairline">
              <span className="text-mute text-[10px] block">CONTAINER RESOURCE</span>
              <span className="text-ink font-semibold">{selectedPod.cpuUsage}% CPU • {selectedPod.memUsage} MB</span>
            </div>
            <div className="p-2 rounded bg-canvas border border-hairline">
              <span className="text-mute text-[10px] block">CURRENT THROUGHPUT</span>
              <span className="text-cyan font-bold">{selectedPod.rps} RPS</span>
            </div>
          </div>

          <div className="p-3 rounded bg-canvas border border-hairline font-mono text-[11px] text-body">
            <div className="text-mute text-[10px] mb-1 flex items-center justify-between">
              <span>RAW CONTAINERD SOCKET STDOUT STREAM:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="h-3 w-3" /> ZERO-ALLOC RING BUFFER CAPTURED
              </span>
            </div>
            <code className="text-ink block break-all">{selectedPod.lastLog}</code>
          </div>
        </div>
      )}
    </div>
  );
}
