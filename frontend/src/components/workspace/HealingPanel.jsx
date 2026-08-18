import React from 'react';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Workspace Component — AUTO-HEALING PANEL
 */
export default function HealingPanel({ isHealing, healingStep, onSimulateHealing }) {
  const steps = [
    'FAILURE DETECTED',
    'ANALYZING ERROR',
    'GENERATING REPAIR',
    'RETRYING TASK',
    'VALIDATION',
    'SUCCESS',
  ];

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <DiamondIcon size="sm">✦</DiamondIcon>
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">
            V. AUTO-HEALING ENGINE PROTOCOL
          </span>
        </div>

        <button
          onClick={onSimulateHealing}
          disabled={isHealing}
          className={`font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 border transition-all ${
            isHealing
              ? 'bg-[#1E3D59] border-[#1E3D59] text-[#F2F0E4] animate-pulse'
              : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A]'
          }`}
        >
          {isHealing ? '⟳ HEALING ACTIVE...' : 'SIMULATE AUTO-HEAL ↗'}
        </button>
      </div>

      {/* Mechanical Step Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((st, idx) => {
          const isActive = healingStep === idx;
          const isDone = healingStep > idx;

          return (
            <div
              key={idx}
              className={`p-3 border text-center font-sans transition-all duration-300 ${
                isActive
                  ? 'border-[#D4AF37] bg-[#1E3D59]/60 text-[#F2F0E4] shadow-gold scale-105'
                  : isDone
                  ? 'border-[#D4AF37]/50 bg-[#0A0A0A] text-[#D4AF37]'
                  : 'border-[#D4AF37]/20 bg-[#0A0A0A] text-[#888888]/60'
              }`}
            >
              <span className="font-display text-[10px] block mb-1">0{idx + 1}</span>
              <span className="text-[10px] tracking-wider uppercase font-bold block">
                {st}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
