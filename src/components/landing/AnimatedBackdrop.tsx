"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedBackdrop() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(127,127,127,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(127,127,127,0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <motion.div
        className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/45 to-transparent"
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
