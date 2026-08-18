import React from 'react';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Workspace Component — VALIDATION PANEL
 */
export default function ValidationPanel({ validationReport, onTriggerRepair }) {
  const { build, structure, output, quality, hasError, errorMsg } = validationReport;

  const checks = [
    { label: 'BUILD EXECUTION', status: build },
    { label: 'DOM & AST STRUCTURE', status: structure },
    { label: 'OUTPUT INTEGRITY', status: output },
    { label: 'QUALITY & CONTRACTS', status: quality },
  ];

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <DiamondIcon size="sm">✦</DiamondIcon>
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">
            IV. VALIDATION REPORT
          </span>
        </div>
        <span
          className={`font-sans text-[10px] tracking-widest px-2.5 py-0.5 border font-bold ${
            hasError
              ? 'bg-red-950/40 border-red-500/50 text-red-400'
              : 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
          }`}
        >
          {hasError ? '✕ FAILED' : '✓ 100% PASS'}
        </span>
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {checks.map((c, idx) => (
          <div
            key={idx}
            className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-3 text-center space-y-1"
          >
            <span className="font-sans text-[9px] tracking-widest text-[#888888] block">
              {c.label}
            </span>
            <span
              className={`font-display text-sm font-bold block ${
                c.status === 'PASS' ? 'text-[#D4AF37]' : 'text-red-400'
              }`}
            >
              {c.status === 'PASS' ? '✓ PASS' : '✕ FAIL'}
            </span>
          </div>
        ))}
      </div>

      {/* Error Traceback & Repair Action */}
      {hasError && (
        <div className="bg-[#0A0A0A] border border-red-500/40 p-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-red-400 font-bold tracking-wider">
              VALIDATION ERROR DETECTED
            </span>
            <span className="font-sans text-[10px] text-[#888888]">RUNTIME TRACE</span>
          </div>

          <p className="font-mono text-xs text-red-300 bg-[#141414] p-3 border border-red-500/20">
            {errorMsg || 'TypeError: Missing dependency prop state in generated React component.'}
          </p>

          <div className="flex items-center justify-between pt-2">
            <span className="font-sans text-xs text-[#D4AF37]">
              REPAIR INSTRUCTION GENERATED
            </span>
            <button
              onClick={onTriggerRepair}
              className="font-sans text-[10px] tracking-[0.2em] uppercase px-4 py-2 bg-[#D4AF37] text-[#0A0A0A] font-bold hover:bg-[#F2E8C4] transition-all shadow-gold"
            >
              REPAIR & RETRY ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
