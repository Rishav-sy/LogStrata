"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, Box, Cpu, ShieldCheck, Waypoints } from "lucide-react";

const nodes = [
  { label: "Pods", detail: "stdout stream", icon: Box, color: "text-cyan" },
  { label: "Log engine", detail: "1.2k events/s", icon: Waypoints, color: "text-link" },
  { label: "Policy", detail: "risk + capacity", icon: ShieldCheck, color: "text-warning" },
  { label: "Kubernetes", detail: "replicas 3 → 9", icon: Cpu, color: "text-success" },
];

export function AnimatedControlLoop({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-[#080b11] p-5 text-white shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,112,243,0.16),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,227,194,0.12),transparent_35%)]" />
      <div className="relative flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        <span>Control loop topology</span>
        <span className="flex items-center gap-2 text-emerald-400"><Activity className="h-3 w-3" /> live</span>
      </div>

      <div className={`relative mt-5 grid gap-3 ${compact ? "grid-cols-2" : "md:grid-cols-4"}`}>
        {nodes.map(({ label, detail, icon: Icon, color }, index) => (
          <motion.div
            key={label}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.35 }}
            className="relative rounded-xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="mt-5 text-xs font-semibold">{label}</p>
            <p className="mt-1 font-mono text-[9px] text-zinc-500">{detail}</p>
            {index < nodes.length - 1 && !compact && (
              <motion.span
                aria-hidden="true"
                className="absolute -right-3 top-1/2 z-10 hidden h-px w-3 bg-blue-400 md:block"
                animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.25 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative mt-4 rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[9px] text-zinc-500">
        <motion.div
          animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <span className="text-emerald-400">[decision]</span> latency threshold crossed · target replicas=9 · ingress policy synced
        </motion.div>
      </div>
    </div>
  );
}
