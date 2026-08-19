import React from 'react';
import { motion } from 'framer-motion';
import DiamondIcon from '../ui/DiamondIcon';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { TaskStatus, WorkflowStatus } from '@/constants/workflow';

/**
 * AgentPanel — Shows current agent cognitive status and the planned task graph.
 *
 * Props (new hook-based):
 *   workflow    — workflow object from useWorkflow
 *   tasks       — tasks array from useWorkflow
 *   isRunning   — boolean
 *   isComplete  — boolean
 *   isFailed    — boolean
 *
 * Props (legacy):
 *   agentStatus   — string label
 *   currentAction — string description
 *   plannedTasks  — array of { numeral, name, status }
 */
export default function AgentPanel({
  // new API
  workflow, tasks = [], isRunning, isComplete, isFailed,
  // legacy API (fallback)
  agentStatus, currentAction, plannedTasks,
}) {
  // Derive display data from hook API if provided
  const displayStatus = agentStatus || (
    !workflow    ? 'IDLE' :
    isComplete   ? 'COMPLETE' :
    isFailed     ? 'FAILED' :
    isRunning    ? 'ACTIVE' : 'STANDBY'
  );

  const runningTask = tasks.find((t) => t.status === TaskStatus.RUNNING);
  const displayAction = currentAction || (
    !workflow      ? 'Awaiting goal input.' :
    isComplete     ? 'All tasks completed successfully.' :
    isFailed       ? 'Workflow halted due to task failure.' :
    runningTask    ? `Executing: "${runningTask.title}"` :
    'Preparing next task in queue…'
  );

  // Build display task list
  const displayTasks = plannedTasks || tasks.map((t, idx) => ({
    numeral: String(idx + 1),
    name: t.title,
    status: t.status === TaskStatus.COMPLETED ? 'COMPLETE' :
            t.status === TaskStatus.RUNNING    ? 'RUNNING'  :
            t.status === TaskStatus.FAILED     ? 'FAILED'   : 'PENDING',
  }));

  const statusColor =
    isFailed    ? 'text-[#EF5350] border-[#EF5350]/40' :
    isComplete  ? 'text-[#4CAF50] border-[#4CAF50]/40' :
    isRunning   ? 'text-[#D4AF37] border-[#D4AF37]/40' :
                  'text-[#888888] border-[#888888]/20';

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/15">
        <div className="flex items-center gap-3">
          <DiamondIcon size="sm">❖</DiamondIcon>
          <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
            AGENT / PLANNER
          </span>
        </div>
        <span className={`font-sans text-[9px] tracking-[0.15em] uppercase border px-2.5 py-0.5 ${statusColor}`}>
          {displayStatus}
        </span>
      </div>

      {/* Current cognitive action */}
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/15 p-4">
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#888888] block mb-2">
          CURRENT ACTION
        </span>
        <p className="font-sans text-xs text-[#F2F0E4]/80 leading-relaxed italic">
          "{displayAction}"
        </p>
      </div>

      {/* Planned task graph */}
      {displayTasks.length > 0 && (
        <div>
          <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] mb-3">
            TASK GRAPH
          </p>
          <div className="space-y-2">
            {displayTasks.map((t, idx) => {
              const isTaskRunning  = t.status === 'RUNNING';
              const isTaskComplete = t.status === 'COMPLETE' || t.status === 'COMPLETED';
              const isTaskFailed   = t.status === 'FAILED';
              return (
                <motion.div
                  key={idx}
                  layout
                  className="bg-[#0A0A0A] border border-[#D4AF37]/12 p-3 flex items-center justify-between font-sans text-xs tracking-wider"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-display text-[#D4AF37] font-bold shrink-0">{t.numeral}</span>
                    <span className={`truncate ${isTaskRunning ? 'text-[#D4AF37]' : isTaskComplete ? 'text-[#F2F0E4]' : isTaskFailed ? 'text-[#EF5350]' : 'text-[#888888]'}`}>
                      {t.name}
                    </span>
                  </div>
                  <div className="shrink-0 ml-2">
                    {isTaskComplete && <CheckCircle size={12} className="text-[#4CAF50]" />}
                    {isTaskRunning  && <Loader      size={12} className="text-[#D4AF37] animate-spin" />}
                    {isTaskFailed   && <XCircle     size={12} className="text-[#EF5350]" />}
                    {!isTaskComplete && !isTaskRunning && !isTaskFailed && (
                      <div className="w-3 h-3 border border-[#444444]" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
