import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, Loader, AlertTriangle, FileText, Code, Globe, ShieldCheck } from 'lucide-react';
import { TaskStatus, TaskType } from '@/constants/workflow';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  [TaskType.TEXT_GENERATION]:    { label: 'TEXT',       icon: FileText  },
  [TaskType.CODE_GENERATION]:    { label: 'CODE',       icon: Code      },
  [TaskType.WEBSITE_GENERATION]: { label: 'WEBSITE',    icon: Globe     },
  [TaskType.VALIDATION]:         { label: 'VALIDATION', icon: ShieldCheck },
  [TaskType.OTHER]:              { label: 'OTHER',      icon: FileText  },
};

const STATUS_CONFIG = {
  [TaskStatus.PENDING]:   { label: 'PENDING',   color: 'text-[#888888]',  dot: 'bg-[#444444]' },
  [TaskStatus.READY]:     { label: 'READY',     color: 'text-[#D4AF37]',  dot: 'bg-[#D4AF37]' },
  [TaskStatus.RUNNING]:   { label: 'RUNNING',   color: 'text-[#D4AF37]',  dot: 'bg-[#D4AF37] animate-pulse' },
  [TaskStatus.COMPLETED]: { label: 'COMPLETED', color: 'text-[#4CAF50]',  dot: 'bg-[#4CAF50]' },
  [TaskStatus.FAILED]:    { label: 'FAILED',    color: 'text-[#EF5350]',  dot: 'bg-[#EF5350]' },
  [TaskStatus.RETRYING]:  { label: 'RETRYING',  color: 'text-[#FF9800]',  dot: 'bg-[#FF9800] animate-pulse' },
  [TaskStatus.BLOCKED]:   { label: 'BLOCKED',   color: 'text-[#888888]',  dot: 'bg-[#888888]' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`flex items-center gap-2 font-sans text-[11px] tracking-[0.2em] uppercase ${cfg.color}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#888888] block mb-1.5">
      {children}
    </span>
  );
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[#D4AF37]/15 pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-3 hover:text-[#D4AF37] transition-colors"
      >
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#888888]">{title}</span>
        {open ? <ChevronDown size={12} className="text-[#888888]" /> : <ChevronRight size={12} className="text-[#888888]" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Output Renderers ─────────────────────────────────────────────────────────

function TextOutput({ output }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#D4AF37]/15 p-4 max-h-64 overflow-y-auto">
      <p className="font-sans text-xs text-[#F2F0E4]/80 leading-relaxed whitespace-pre-wrap">
        {output.content}
      </p>
      {output.wordCount && (
        <p className="font-sans text-[10px] text-[#888888] mt-3 border-t border-[#D4AF37]/10 pt-2">
          {output.wordCount} words · {output.model}
        </p>
      )}
    </div>
  );
}

function CodeOutput({ output }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#D4AF37]/15 p-4 max-h-64 overflow-auto">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D4AF37]/10">
        <span className="font-sans text-[10px] tracking-widest text-[#D4AF37] uppercase">{output.language}</span>
        {output.valid !== undefined && (
          <span className={`font-sans text-[10px] tracking-widest uppercase ${output.valid ? 'text-[#4CAF50]' : 'text-[#EF5350]'}`}>
            {output.valid ? '✓ VALID' : '✕ INVALID'}
          </span>
        )}
      </div>
      <pre className="font-mono text-[11px] text-[#F2F0E4]/80 leading-relaxed overflow-x-auto">
        <code>{output.code}</code>
      </pre>
    </div>
  );
}

function WebsiteOutput({ output }) {
  return (
    <div className="space-y-3">
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/15 p-4">
        <FieldLabel>Generated Files</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {(output.files || []).map((file) => (
            <span key={file} className="font-mono text-[10px] bg-[#141414] border border-[#D4AF37]/20 px-2 py-1 text-[#D4AF37]">
              {file}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/15 p-4 max-h-48 overflow-auto">
        <FieldLabel>Content Preview</FieldLabel>
        <pre className="font-mono text-[11px] text-[#F2F0E4]/60 whitespace-pre-wrap">
          {output.content?.slice(0, 600)}{output.content?.length > 600 ? '\n…' : ''}
        </pre>
      </div>
    </div>
  );
}

function ValidationOutput({ output }) {
  return (
    <div className="space-y-2">
      {(output.checks || []).map((check) => (
        <div key={check.name} className="flex items-center justify-between py-2 border-b border-[#D4AF37]/10 last:border-0">
          <span className="font-mono text-[11px] text-[#F2F0E4]/70">{check.name}</span>
          <span className={`font-sans text-[10px] tracking-widest uppercase ${check.status === 'PASS' ? 'text-[#4CAF50]' : 'text-[#EF5350]'}`}>
            {check.status === 'PASS' ? '✓ PASS' : '✕ FAIL'}
          </span>
        </div>
      ))}
      {output.score !== undefined && (
        <p className="font-sans text-[10px] text-[#888888] pt-2">
          Quality score: <strong className="text-[#D4AF37]">{(output.score * 100).toFixed(0)}%</strong>
        </p>
      )}
    </div>
  );
}

function OutputRenderer({ task }) {
  const { output } = task;
  if (!output) return null;

  const type = output.type || task.type;

  if (type === 'TEXT' || task.type === TaskType.TEXT_GENERATION) return <TextOutput output={output} />;
  if (type === 'CODE' || task.type === TaskType.CODE_GENERATION)  return <CodeOutput output={output} />;
  if (type === 'WEBSITE' || task.type === TaskType.WEBSITE_GENERATION) return <WebsiteOutput output={output} />;
  if (type === 'VALIDATION' || task.type === TaskType.VALIDATION) return <ValidationOutput output={output} />;

  // Fallback
  return (
    <pre className="font-mono text-[10px] text-[#F2F0E4]/60 bg-[#0A0A0A] border border-[#D4AF37]/10 p-4 overflow-auto max-h-48">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

// ─── Error Panel ──────────────────────────────────────────────────────────────

function ErrorPanel({ error }) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div className="border border-[#EF5350]/30 bg-[#EF5350]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-[#EF5350] shrink-0" />
        <span className="font-sans text-xs text-[#EF5350] uppercase tracking-wider">
          {error.code || 'Execution Failed'}
        </span>
      </div>
      <p className="font-sans text-xs text-[#F2F0E4]/70 leading-relaxed">
        {error.message}
      </p>
      {(error.details || error.retryable !== undefined) && (
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="font-sans text-[10px] tracking-widest text-[#888888] hover:text-[#D4AF37] transition-colors uppercase flex items-center gap-1"
        >
          {showDetails ? 'Hide' : 'View'} technical details
          {showDetails ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>
      )}
      <AnimatePresence>
        {showDetails && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="font-mono text-[10px] text-[#F2F0E4]/50 overflow-auto max-h-32 bg-[#0A0A0A] p-3 mt-2"
          >
            {JSON.stringify(error, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
      {error.retryable && (
        <p className="font-sans text-[10px] text-[#888888] border-t border-[#EF5350]/10 pt-2">
          ↺ This error is retryable — Auto-Healing will address it in Phase 8.
        </p>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-10 h-10 border border-[#D4AF37]/30 rotate-45 flex items-center justify-center mb-6">
        <div className="w-2 h-2 bg-[#D4AF37]/30 rotate-45" />
      </div>
      <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-[#888888]">
        Select a task to view details
      </p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

/**
 * TaskDetailsPanel — Right panel showing full details for a selected task.
 *
 * Props:
 *   task     — selected task object (or null)
 *   onClose  — called when the close button is clicked
 */
export default function TaskDetailsPanel({ task, onClose }) {
  if (!task) return (
    <div className="bg-[#141414] border border-[#D4AF37]/20 h-full">
      <div className="p-4 border-b border-[#D4AF37]/15 flex items-center justify-between">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#888888]">
          TASK DETAILS
        </span>
      </div>
      <EmptyState />
    </div>
  );

  const typeInfo = TYPE_LABELS[task.type] || TYPE_LABELS[TaskType.OTHER];
  const TypeIcon = typeInfo.icon;

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-[#141414] border border-[#D4AF37]/20 h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#D4AF37]/15 flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 border border-[#D4AF37]/30 rotate-45 flex items-center justify-center shrink-0 mt-0.5">
            <TypeIcon size={12} className="text-[#D4AF37] -rotate-45" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base uppercase tracking-wider text-[#F2F0E4] leading-tight break-words">
              {task.title}
            </h3>
            <span className="font-sans text-[10px] tracking-widest text-[#D4AF37]/60 uppercase mt-0.5 block">
              {typeInfo.label}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#D4AF37] transition-colors shrink-0 mt-1"
            aria-label="Close task details"
          >
            ✕
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Status */}
        <div>
          <FieldLabel>Status</FieldLabel>
          <StatusBadge status={task.status} />
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <FieldLabel>Description</FieldLabel>
            <p className="font-sans text-xs text-[#F2F0E4]/70 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Dependencies */}
        {task.dependencies?.length > 0 && (
          <div>
            <FieldLabel>Dependencies</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {task.dependencies.map((dep) => (
                <span key={dep} className="font-mono text-[10px] bg-[#0A0A0A] border border-[#D4AF37]/20 px-2 py-1 text-[#888888]">
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        {(task.startedAt || task.completedAt) && (
          <Section title="Timing">
            {task.startedAt && (
              <div className="flex items-center gap-2 mb-2">
                <Clock size={10} className="text-[#888888]" />
                <span className="font-sans text-[10px] text-[#888888]">
                  Started: {new Date(task.startedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle size={10} className="text-[#4CAF50]" />
                <span className="font-sans text-[10px] text-[#888888]">
                  Completed: {new Date(task.completedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </Section>
        )}

        {/* Error */}
        {task.error && (
          <Section title="Error" defaultOpen>
            <ErrorPanel error={task.error} />
          </Section>
        )}

        {/* Output */}
        {task.output && (
          <Section title="Generated Output" defaultOpen>
            <OutputRenderer task={task} />
          </Section>
        )}

        {/* Running state */}
        {task.status === TaskStatus.RUNNING && !task.output && (
          <div className="flex items-center gap-3 py-4">
            <Loader size={14} className="text-[#D4AF37] animate-spin" />
            <span className="font-sans text-xs text-[#888888]">
              Agent is processing this task…
            </span>
          </div>
        )}

        {/* Pending state */}
        {(task.status === TaskStatus.PENDING || task.status === TaskStatus.BLOCKED) && (
          <div className="py-4">
            <p className="font-sans text-xs text-[#888888]">
              {task.status === TaskStatus.BLOCKED
                ? 'Waiting for dependency tasks to complete.'
                : 'Queued — will start when preceding tasks complete.'}
            </p>
          </div>
        )}

      </div>
    </motion.div>
  );
}
