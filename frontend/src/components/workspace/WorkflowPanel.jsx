import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader, XCircle, Clock } from 'lucide-react';
import { TaskStatus } from '@/constants/workflow';

/**
 * WorkflowPanel — Compact vertical pipeline display.
 *
 * Used in the legacy workspace layout. In the new WorkspacePage this is
 * replaced by the inline pipeline, but this component is kept for backwards
 * compatibility and for use as a standalone status panel.
 *
 * Props:
 *   stages     — array of { numeral, name, status } (legacy)
 *   tasks      — array of Task objects from useWorkflow (new)
 *   activeStage — index (legacy) OR task.id (new)
 *   onSelectStage — callback(index or id)
 */

const STATUS_CONFIG = {
  COMPLETE:  { label: 'COMPLETE',  cls: 'text-[#D4AF37] border-[#D4AF37]/60',  dot: <CheckCircle size={10} className="text-[#D4AF37]" />  },
  COMPLETED: { label: 'COMPLETE',  cls: 'text-[#4CAF50] border-[#4CAF50]/40',  dot: <CheckCircle size={10} className="text-[#4CAF50]" />  },
  RUNNING:   { label: 'RUNNING',   cls: 'text-[#D4AF37] border-[#D4AF37]/60',  dot: <Loader size={10} className="text-[#D4AF37] animate-spin" /> },
  FAILED:    { label: 'FAILED',    cls: 'text-[#EF5350] border-[#EF5350]/50',  dot: <XCircle size={10} className="text-[#EF5350]" />     },
  PENDING:   { label: 'PENDING',   cls: 'text-[#888888] border-[#888888]/30',  dot: <Clock size={10} className="text-[#888888]" />        },
  RETRYING:  { label: 'RETRYING',  cls: 'text-[#FF9800] border-[#FF9800]/50',  dot: <Loader size={10} className="text-[#FF9800] animate-spin" /> },
  BLOCKED:   { label: 'BLOCKED',   cls: 'text-[#888888] border-[#888888]/20',  dot: <Clock size={10} className="text-[#888888]" />        },
  READY:     { label: 'READY',     cls: 'text-[#D4AF37] border-[#D4AF37]/40',  dot: <Clock size={10} className="text-[#D4AF37]" />        },
};

export default function WorkflowPanel({ stages, tasks, activeStage, onSelectStage }) {
  // Support both legacy (stages array) and new (tasks array) data sources
  const items = tasks
    ? tasks.map((t, idx) => ({
        id: t.id,
        numeral: `${idx + 1}`,
        name: t.title,
        status: t.status,
      }))
    : (stages || []);

  const totalLabel = `${items.length} STAGE${items.length !== 1 ? 'S' : ''}`;

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/15">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
          WORKFLOW PIPELINE
        </span>
        <span className="font-sans text-[10px] tracking-widest text-[#888888]">
          {totalLabel}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="font-sans text-[11px] text-[#444444] text-center py-4 tracking-wider">
          AWAITING WORKFLOW
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const id = item.id ?? idx;
            const isCurrent = activeStage === id || activeStage === idx;
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

            return (
              <motion.button
                key={id}
                layout
                onClick={() => onSelectStage?.(item.id ?? idx)}
                className={`w-full p-3.5 border transition-all text-left flex items-center justify-between group ${
                  isCurrent
                    ? 'border-[#D4AF37] bg-[#0A0A0A] shadow-gold'
                    : 'border-[#D4AF37]/15 bg-[#141414] hover:border-[#D4AF37]/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-sm text-[#D4AF37] tracking-widest shrink-0">
                    {item.numeral}
                  </span>
                  <span className="font-display text-sm uppercase tracking-wider text-[#F2F0E4] truncate group-hover:text-[#D4AF37] transition-colors">
                    {item.name}
                  </span>
                </div>

                <span className={`font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 border flex items-center gap-1.5 shrink-0 ml-2 ${cfg.cls}`}>
                  {cfg.dot}
                  {cfg.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
