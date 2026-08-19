import React from 'react';
import { motion } from 'framer-motion';
import DiamondIcon from '../ui/DiamondIcon';
import { Zap, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

/**
 * HealingPanel — Auto-Healing Engine UI shell.
 *
 * Phase 7: UI states are fully built — idle, analyzing, repairing, retrying, recovered.
 * Phase 8: Real auto-healing logic will wire into the `isHealing` / `healingStep` props.
 *
 * Props:
 *   isHealing        — boolean: healing in progress
 *   healingStep      — number: current step index (-1 = idle)
 *   onSimulateHealing — function: triggers a demo animation
 *   failedError      — object: { message, code, retryable } from ExecutionError
 */
export default function HealingPanel({
  isHealing = false,
  healingStep = -1,
  onSimulateHealing,
  failedError = null,
}) {
  const steps = [
    { label: 'DETECT',   icon: AlertTriangle, desc: 'Failure detected and classified.' },
    { label: 'ANALYZE',  icon: Zap,           desc: 'Error analyzed by repair planner.' },
    { label: 'REPAIR',   icon: Zap,           desc: 'Repair prompt generated for AI.' },
    { label: 'RETRY',    icon: Loader,        desc: 'Task re-executed with repaired output.' },
    { label: 'VALIDATE', icon: CheckCircle,   desc: 'Output validated after repair.' },
    { label: 'RECOVERED',icon: CheckCircle,   desc: 'Task completed successfully.' },
  ];

  const isRecovered = healingStep >= steps.length - 1 && !isHealing;

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/20 p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/12">
        <div className="flex items-center gap-3">
          <DiamondIcon size="sm"><Zap size={10} className="-rotate-0" /></DiamondIcon>
          <div>
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">
              AUTO-HEALING ENGINE
            </span>
            <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#888888]">
              PHASE 8 READY
            </span>
          </div>
        </div>

        {onSimulateHealing && (
          <button
            onClick={onSimulateHealing}
            disabled={isHealing}
            className={`font-sans text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-all ${
              isHealing
                ? 'bg-[#1E3D59] border-[#1E3D59] text-[#F2F0E4] animate-pulse'
                : 'border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A]'
            }`}
          >
            {isHealing ? '⟳ HEALING…' : 'DEMO ↗'}
          </button>
        )}
      </div>

      {/* Failed error badge */}
      {failedError && !isHealing && !isRecovered && (
        <div className="bg-[#EF5350]/8 border border-[#EF5350]/25 p-4 flex items-start gap-3">
          <AlertTriangle size={14} className="text-[#EF5350] shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-xs text-[#EF5350] font-bold mb-1">
              {failedError.code || 'TASK FAILED'}
            </p>
            <p className="font-sans text-[11px] text-[#F2F0E4]/60 leading-relaxed">
              {failedError.message}
            </p>
            {failedError.retryable && (
              <p className="font-sans text-[10px] text-[#888888] mt-2">
                ↺ Retryable — healing engine will repair and retry this task.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step flow */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {steps.map((step, idx) => {
          const isActive = healingStep === idx && isHealing;
          const isDone   = healingStep > idx;
          const isCurrent = healingStep === idx && isRecovered;
          const Icon = step.icon;

          return (
            <motion.div
              key={idx}
              layout
              className={`p-3 border text-center transition-all duration-300 ${
                isActive
                  ? 'border-[#D4AF37] bg-[#1E3D59]/50 shadow-gold scale-105'
                  : isDone || isCurrent
                  ? 'border-[#4CAF50]/40 bg-[#0A0A0A]'
                  : 'border-[#D4AF37]/12 bg-[#0A0A0A]'
              }`}
            >
              <Icon
                size={12}
                className={`mx-auto mb-1.5 ${
                  isActive              ? 'text-[#D4AF37] animate-spin' :
                  isDone || isCurrent  ? 'text-[#4CAF50]' :
                  'text-[#444444]'
                }`}
              />
              <span className={`font-sans text-[9px] tracking-[0.15em] uppercase block font-bold ${
                isActive              ? 'text-[#F2F0E4]' :
                isDone || isCurrent  ? 'text-[#4CAF50]' :
                'text-[#888888]/50'
              }`}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Phase 8 notice */}
      {!isHealing && healingStep < 0 && (
        <p className="font-sans text-[10px] text-[#888888]/50 leading-relaxed border-t border-[#D4AF37]/8 pt-3">
          When a task fails with a retryable error, the Auto-Healing engine will analyze the failure,
          generate a repair prompt, and automatically retry. Full implementation in Phase 8.
        </p>
      )}

      {/* Recovery success message */}
      {isRecovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pt-2 border-t border-[#4CAF50]/15"
        >
          <CheckCircle size={12} className="text-[#4CAF50]" />
          <span className="font-sans text-xs text-[#4CAF50]">Repair successful — task recovered.</span>
        </motion.div>
      )}
    </div>
  );
}
