"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedBackdrop() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <motion.div
          key={index}
          className="absolute left-[-20%] h-px w-[140%] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"
          style={{ top: `${16 + index * 14}%`, rotate: `${index % 2 ? -4 : 4}deg` }}
          animate={reduceMotion ? undefined : { x: ["-8%", "8%", "-8%"], opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 12 + index, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}
