import { cn } from "@/lib/utils";
import React, { useMemo } from "react";

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteorStyles = useMemo(() => {
    return Array.from({ length: number }).map((_, idx) => {
      const seed = (idx * 9301 + 49297) % 233280;
      const rnd1 = seed / 233280;
      const rnd2 = ((seed * 9301 + 49297) % 233280) / 233280;
      const rnd3 = ((seed * 1337 + 1013904223) % 233280) / 233280;

      return {
        top: 0,
        left: Math.floor(rnd1 * 800 - 400) + "px",
        animationDelay: (rnd2 * 0.6 + 0.2).toFixed(2) + "s",
        animationDuration: Math.floor(rnd3 * 8 + 2) + "s",
      };
    });
  }, [number]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={style}
        />
      ))}
    </>
  );
};
