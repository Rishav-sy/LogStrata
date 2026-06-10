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
    <div className="relative overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#0b0d10] text-white shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
      <div className="relative flex items-center justify-between border-b border-white/[0.08] bg-white/[0.018] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
        <span>Control loop topology</span>
        <span className="flex items-center gap-2 text-emerald-400"><Activity className="h-3 w-3" /> live</span>
      </div>

      <div className={`relative grid gap-px bg-white/[0.07] ${compact ? "grid-cols-2" : "md:grid-cols-4"}`}>
        {nodes.map(({ label, detail, icon: Icon, color }, index) => (
          <motion.div
            key={label}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.35 }}
            className="relative bg-[#0b0d10] p-5"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="mt-5 text-xs font-semibold">{label}</p>
            <p className="mt-1 font-mono text-[9px] text-zinc-500">{detail}</p>
            {index < nodes.length - 1 && !compact && (
              <motion.span
                aria-hidden="true"
                className="absolute -right-px top-1/2 z-10 hidden h-px w-px bg-blue-400 md:block"
                animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.25 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative border-t border-white/[0.08] bg-black/20 px-5 py-4 font-mono text-[9px] text-zinc-500">
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
