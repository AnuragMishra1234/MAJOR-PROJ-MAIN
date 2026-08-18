import React from 'react';

/**
 * Workspace Component — WORKFLOW PANEL (Stages I to VI)
 */
export default function WorkflowPanel({ stages, activeStage, onSelectStage }) {
  return (
    <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
        <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">
          I. WORKFLOW PIPELINE
        </span>
        <span className="font-sans text-[10px] tracking-widest text-[#888888]">
          6 STAGES
        </span>
      </div>

      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const isCurrent = activeStage === idx;
          const statusColors = {
            COMPLETE: 'text-[#D4AF37] border-[#D4AF37]',
            RUNNING: 'text-[#F2F0E4] border-[#F2F0E4] animate-pulse',
            FAILED: 'text-red-400 border-red-500/50',
            PENDING: 'text-[#888888] border-[#888888]/40',
          };

          return (
            <button
              key={idx}
              onClick={() => onSelectStage(idx)}
              className={`w-full p-4 border transition-all text-left flex items-center justify-between ${
                isCurrent
                  ? 'border-[#D4AF37] bg-[#0A0A0A] shadow-gold'
                  : 'border-[#D4AF37]/20 bg-[#141414] hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-sm text-[#D4AF37] tracking-widest font-bold">
                  {stage.numeral}
                </span>
                <span className="font-display text-sm uppercase tracking-wider text-[#F2F0E4]">
                  {stage.name}
                </span>
              </div>

              <span className={`font-sans text-[9px] tracking-[0.2em] uppercase px-2.5 py-0.5 border ${statusColors[stage.status]}`}>
                {stage.status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
