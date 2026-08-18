import React from 'react';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Workspace Component — AGENT / PLANNER PANEL
 */
export default function AgentPanel({ agentStatus, currentAction, plannedTasks }) {
  return (
    <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <DiamondIcon size="sm">❖</DiamondIcon>
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">
            II. AGENT / PLANNER
          </span>
        </div>
        <span className="font-sans text-[10px] tracking-widest text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5">
          STATUS: {agentStatus}
        </span>
      </div>

      {/* Current Action Display */}
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-4">
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#888888] block mb-1">
          CURRENT COGNITIVE ACTION
        </span>
        <p className="font-sans text-xs text-[#F2F0E4] leading-relaxed italic">
          "{currentAction}"
        </p>
      </div>

      {/* Planned Tasks Matrix */}
      <div>
        <p className="font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-3">
          PLANNED TASK GRAPH
        </p>
        <div className="space-y-2">
          {plannedTasks.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-3 flex items-center justify-between font-sans text-xs tracking-wider"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-[#D4AF37] font-bold">{t.numeral}</span>
                <span className="text-[#F2F0E4]">{t.name}</span>
              </div>
              <span className="text-[10px] text-[#D4AF37] font-bold">{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
