"use client";

import React, { useId } from "react";
import { BaseEdge, getBezierPath, type EdgeProps, type Edge } from "@xyflow/react";
import { motion } from "framer-motion";

export interface AnimatedBeamEdgeData extends Record<string, unknown> {
  gradientStartColor?: string;
  gradientStopColor?: string;
  duration?: number;
  reverse?: boolean;
  curvature?: number;
  beamLength?: number;
  beamGap?: number;
  strokeWidth?: number;
}

export type AnimatedBeamEdgeType = Edge<AnimatedBeamEdgeData, "animatedBeam">;

export function AnimatedBeamEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<AnimatedBeamEdgeType>) {
  const uniqueId = useId().replace(/:/g, "_");
  const gradientId = `beam-gradient-${id}-${uniqueId}`;
  const filterId = `beam-glow-${id}-${uniqueId}`;

  const edgeData = (data as unknown as AnimatedBeamEdgeData) || {};
  const {
    gradientStartColor = "#06b6d4",
    gradientStopColor = "#10b981",
    duration = 2.5,
    reverse = false,
    curvature = 0.25,
    beamLength = 30,
    beamGap = 120,
    strokeWidth = 2.5,
  } = edgeData;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const totalCycle = beamLength + beamGap;

  return (
    <>
      <defs>
        {/* Directional beam gradient */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity={0.9} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity={0.9} />
        </linearGradient>

        {/* Ambient laser glow filter */}
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Layer 1: Static background track */}
      <BaseEdge
        id={`${id}-bg`}
        path={edgePath}
        style={{
          stroke: "#27272a",
          strokeWidth: 2,
          opacity: 0.45,
          strokeDasharray: "4 4",
          ...style,
        }}
      />

      {/* Layer 2: Animated traveling beam (Magic UI pattern) */}
      <motion.path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        initial={{
          strokeDasharray: `${beamLength} ${beamGap}`,
          strokeDashoffset: reverse ? -totalCycle : totalCycle,
        }}
        animate={{
          strokeDashoffset: reverse ? totalCycle : -totalCycle,
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          pointerEvents: "none",
        }}
        markerEnd={markerEnd}
      />
    </>
  );
}
