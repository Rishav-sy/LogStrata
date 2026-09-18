"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Server,
  Terminal,
  Activity,
  Zap,
  Shield,
  Layers,
  Cpu,
} from "lucide-react";

export interface PipelineNodeData extends Record<string, unknown> {
  title: string;
  subtitle: string;
  badge?: string;
  tag?: string;
  icon?: "server" | "terminal" | "activity" | "zap" | "shield" | "layers" | "cpu";
  accentColor?: string;
  iconBg?: string;
  iconColor?: string;
  statusDotColor?: string;
  isAlert?: boolean;
  isActive?: boolean;
  pulseGlow?: boolean;
  hasTopHandle?: boolean;
  hasBottomHandle?: boolean;
  hasLeftHandle?: boolean;
  hasRightHandle?: boolean;
  onClick?: () => void;
}

export type PipelineNodeType = Node<PipelineNodeData, "pipelineNode">;

const ICON_MAP = {
  server: Server,
  terminal: Terminal,
  activity: Activity,
  zap: Zap,
  shield: Shield,
  layers: Layers,
  cpu: Cpu,
};

export const PipelineNode = memo(function PipelineNode({
  data,
  selected,
}: NodeProps<PipelineNodeType>) {
  const nodeData = (data as unknown as PipelineNodeData) || {};
  const {
    title,
    subtitle,
    badge,
    tag,
    icon = "activity",
    iconBg = "bg-sky-500/10",
    iconColor = "text-sky-400",
    statusDotColor,
    isAlert = false,
    pulseGlow = false,
    hasTopHandle = true,
    hasBottomHandle = true,
    hasLeftHandle = false,
    hasRightHandle = false,
  } = nodeData;

  const IconComponent = ICON_MAP[icon] || Activity;

  return (
    <div
      className={`relative w-[240px] rounded-lg border transition-all duration-200 select-none ${
        selected
          ? "border-sky-500/80 ring-1 ring-sky-500/30 bg-zinc-900/95 shadow-lg shadow-sky-500/10"
          : isAlert
          ? "border-rose-500/50 bg-zinc-900/90 shadow-md shadow-rose-500/10"
          : pulseGlow
          ? "border-amber-500/50 bg-zinc-900/90 shadow-md shadow-amber-500/10"
          : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 shadow-md"
      } backdrop-blur-sm p-3`}
    >
      {/* 1px Specular Top Highlight */}
      <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Target Handle (Top) */}
      {hasTopHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!w-2 !h-2 !bg-zinc-600 !border-none !-top-1 transition-colors hover:!bg-zinc-400"
        />
      )}

      {/* Left Handle */}
      {hasLeftHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2 !h-2 !bg-zinc-600 !border-none !-left-1 transition-colors hover:!bg-zinc-400"
        />
      )}

      {/* Main Node Content */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon Slot with tinted background container */}
          <div
            className={`rounded-md p-1.5 shrink-0 flex items-center justify-center transition-colors ${iconBg} ${iconColor}`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          {/* Titles & Telemetry */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-100 truncate tracking-tight">
                {title}
              </span>
              {statusDotColor && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: statusDotColor }}
                />
              )}
            </div>
            <span className="text-[10.5px] text-zinc-400 font-mono truncate">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Micro-badge Tag */}
        {tag && (
          <span className="shrink-0 font-mono text-[9px] font-medium border border-zinc-700/80 bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        )}
      </div>

      {/* Telemetry Status Footer Pill */}
      {badge && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-400">TELEMETRY</span>
          <span
            className={`font-semibold ${
              isAlert
                ? "text-rose-400"
                : pulseGlow
                ? "text-amber-400"
                : "text-zinc-200"
            }`}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Right Handle */}
      {hasRightHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2 !h-2 !bg-zinc-600 !border-none !-right-1 transition-colors hover:!bg-zinc-400"
        />
      )}

      {/* Source Handle (Bottom) */}
      {hasBottomHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!w-2 !h-2 !bg-zinc-600 !border-none !-bottom-1 transition-colors hover:!bg-zinc-400"
        />
      )}
    </div>
  );
});
