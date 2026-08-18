import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

/**
 * SpatialHUD
 * Ambient telemetry and spatial markers for the AI workflow scrollytelling interface.
 */
export default function SpatialHUD({
  currentFrame,
  totalFrames,
  progress,
  loadedCount,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden font-mono select-none">
      {/* Top Left Technical Label */}
      <div className="absolute top-20 sm:top-24 left-6 sm:left-10 text-[10px] text-black/35 flex flex-col gap-0.5 tracking-wider uppercase">
        <div className="flex items-center gap-1.5 font-semibold text-black/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
          <span>AI WORKSPACE // V1.0</span>
        </div>
        <div className="text-[9px] text-black/30">
          AUTONOMOUS AI WORKFLOW
        </div>
      </div>

      {/* Top Right Ambient Telemetry */}
      <div className="absolute top-20 sm:top-24 right-6 sm:right-10 text-right text-[10px] text-black/35 flex flex-col gap-0.5 tracking-wider uppercase">
        <div className="text-black/50 font-semibold flex items-center justify-end gap-1.5">
          <Activity className="w-3 h-3 text-black/40" />
          <span>ORCHESTRATION: READY</span>
        </div>
        <div className="text-[9px] text-black/30 font-semibold">
          WORKFLOW: ACTIVE
        </div>
      </div>

      {/* Corner Minimalist Crosshairs */}
      <div className="absolute top-24 left-6 text-black/20 text-xs font-light">+</div>
      <div className="absolute top-24 right-6 text-black/20 text-xs font-light">+</div>
      <div className="absolute bottom-20 left-6 text-black/20 text-xs font-light">+</div>
      <div className="absolute bottom-20 right-6 text-black/20 text-xs font-light">+</div>

      {/* Bottom Floating Telemetry Bar */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center px-4">
        <div className="inline-flex items-center gap-3 sm:gap-6 px-4 py-2 rounded-full bg-white/40 backdrop-blur-lg border border-white/60 shadow-sm text-[11px] text-black/70">
          {/* Workflow Step Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-black/40 tracking-wider">WORKFLOW</span>
            <span className="font-semibold text-black/90">// 06</span>
          </div>

          <span className="w-px h-3 bg-black/15" />

          {/* Progress Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-black/40 tracking-wider">PROGRESS</span>
            <span className="font-semibold text-black/90">// ACTIVE</span>
          </div>

          <span className="w-px h-3 bg-black/15 hidden sm:block" />

          {/* Core System Status */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-black/60 font-medium">SYSTEM // READY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
