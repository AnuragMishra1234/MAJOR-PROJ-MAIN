import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProject } from '@/hooks/useProject';
import agentService from '@/services/agentService';
import DecoButton from '../components/ui/DecoButton';
import { CheckCircle, Clock, XCircle, Loader, AlertCircle, Zap, RefreshCw } from 'lucide-react';

// ─── History Row ──────────────────────────────────────────────────────────────

const ACTION_CFG = {
  workflow_started:      { label: 'WORKFLOW STARTED',      cls: 'text-[#D4AF37]', Icon: Clock },
  generation_completed:  { label: 'GENERATION COMPLETED',  cls: 'text-[#4CAF50]', Icon: CheckCircle },
  error_detected:        { label: 'ERROR DETECTED',        cls: 'text-[#EF5350]', Icon: XCircle },
  task_completed:        { label: 'TASK COMPLETED',        cls: 'text-[#4CAF50]', Icon: CheckCircle },
  task_failed:           { label: 'TASK FAILED',           cls: 'text-[#EF5350]', Icon: XCircle },
  healing_triggered:     { label: 'HEALING TRIGGERED',     cls: 'text-[#FF9800]', Icon: Zap },
  healing_succeeded:     { label: 'HEALING SUCCEEDED',     cls: 'text-[#4CAF50]', Icon: Zap },
};

function HistoryRow({ item, index }) {
  const cfg    = ACTION_CFG[item.action] ?? { label: item.action?.toUpperCase() ?? 'EVENT', cls: 'text-[#888888]', Icon: Clock };
  const { Icon } = cfg;
  const time   = new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-4 flex items-start gap-4 hover:border-[#D4AF37]/25 transition-colors"
    >
      <Icon size={13} className={`${cfg.cls} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className={`font-sans text-[10px] tracking-[0.2em] uppercase ${cfg.cls}`}>{cfg.label}</span>
          <span className="font-sans text-[10px] text-[#888888]/60 shrink-0">{time}</span>
        </div>
        {item.prompt && (
          <p className="font-sans text-[11px] text-[#F2F0E4]/60 mt-1.5 leading-relaxed line-clamp-2 italic">
            "{item.prompt}"
          </p>
        )}
        {item.metadata?.workflowId && (
          <p className="font-mono text-[9px] text-[#888888]/40 mt-1">wf: {item.metadata.workflowId}</p>
        )}
        {item.metadata?.taskCount !== undefined && (
          <p className="font-sans text-[10px] text-[#888888]/60 mt-1">{item.metadata.taskCount} task{item.metadata.taskCount !== 1 ? 's' : ''}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Project Selector ─────────────────────────────────────────────────────────

function ProjectSelector({ projects, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className={`font-sans text-[11px] tracking-wider uppercase px-4 py-2 border transition-colors ${
            selected?.id === p.id
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#0A0A0A]'
              : 'border-[#D4AF37]/20 text-[#888888] hover:border-[#D4AF37]/40 hover:text-[#F2F0E4]'
          }`}
        >
          {p.title}
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#0A0A0A] border border-[#D4AF37]/8 p-4 flex items-center gap-4 animate-pulse">
          <div className="w-3 h-3 bg-[#D4AF37]/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-[#D4AF37]/8" />
            <div className="h-2 w-full bg-[#D4AF37]/5" />
          </div>
          <div className="h-3 w-16 bg-[#D4AF37]/8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

/**
 * Page — HISTORY LOG
 *
 * Shows agent run history for the selected project.
 * Calls GET /api/agent/history/:projectId (real backend).
 */
export default function HistoryPage({ onNavigate, navState = {} }) {
  const { projects, loading: projectsLoading } = useProject();
  const [selectedProject, setSelectedProject]   = useState(null);
  const [history, setHistory]                   = useState([]);
  const [histLoading, setHistLoading]           = useState(false);
  const [histError, setHistError]               = useState(null);

  // Pre-select project from navState if provided
  useEffect(() => {
    if (navState?.projectId && projects.length > 0) {
      const p = projects.find((p) => p.id === navState.projectId);
      if (p) setSelectedProject(p);
    }
  }, [navState, projects]);

  const loadHistory = useCallback(async (project) => {
    if (!project) return;
    setHistLoading(true);
    setHistError(null);
    try {
      const items = await agentService.getHistory(project.id);
      setHistory(Array.isArray(items) ? items : []);
    } catch (err) {
      setHistError(err.message || 'Failed to load history.');
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) loadHistory(selectedProject);
  }, [selectedProject, loadHistory]);

  const handleSelect = (project) => {
    setSelectedProject(project);
    setHistory([]);
  };

  return (
    <div className="py-12 px-6 max-w-5xl mx-auto space-y-10">

      {/* Header */}
      <div className="pb-8 border-b-2 border-[#D4AF37]/25">
        <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] block mb-2">AUDIT TRAIL</span>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.15em] text-[#F2F0E4]">
            HISTORY <span className="text-[#D4AF37]">LOG</span>
          </h1>
          {selectedProject && (
            <button
              onClick={() => loadHistory(selectedProject)}
              title="Refresh history"
              className="p-2 text-[#888888] hover:text-[#D4AF37] transition-colors border border-[#888888]/20 hover:border-[#D4AF37]/40"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Project Selector */}
      <div className="space-y-4">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#888888]">SELECT PROJECT</span>
        {projectsLoading ? (
          <div className="flex items-center gap-2">
            <Loader size={13} className="text-[#D4AF37] animate-spin" />
            <span className="font-sans text-xs text-[#888888]">Loading projects…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex items-center gap-3 bg-[#141414] border border-[#D4AF37]/15 p-4">
            <AlertCircle size={13} className="text-[#888888]" />
            <span className="font-sans text-xs text-[#888888]">No projects found. Create one in the Dashboard.</span>
            <DecoButton variant="ghost" onClick={() => onNavigate('dashboard')} className="ml-auto h-8 text-[10px] px-4">
              DASHBOARD →
            </DecoButton>
          </div>
        ) : (
          <ProjectSelector projects={projects} selected={selectedProject} onSelect={handleSelect} />
        )}
      </div>

      {/* History List */}
      {selectedProject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
              {selectedProject.title}
            </span>
            {history.length > 0 && (
              <span className="font-sans text-[10px] text-[#888888]">{history.length} records</span>
            )}
          </div>

          {histError && (
            <div className="flex items-start gap-3 bg-[#EF5350]/10 border border-[#EF5350]/30 p-4">
              <AlertCircle size={14} className="text-[#EF5350] shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-xs text-[#EF5350]">{histError}</p>
                <p className="font-sans text-[10px] text-[#888888] mt-1">Ensure you are logged in and the backend is running.</p>
              </div>
            </div>
          )}

          {histLoading ? (
            <Skeleton />
          ) : history.length === 0 && !histError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-[#D4AF37]/10 bg-[#141414]">
              <div className="w-12 h-12 border border-[#D4AF37]/20 rotate-45 flex items-center justify-center mb-6">
                <Clock size={14} className="text-[#D4AF37]/30 -rotate-45" />
              </div>
              <p className="font-display text-xl uppercase tracking-widest text-[#F2F0E4]/30 mb-3">No History Yet</p>
              <p className="font-sans text-xs text-[#888888] max-w-xs leading-relaxed mb-6">
                Run the agent on this project to see execution history here.
              </p>
              <DecoButton variant="primary" onClick={() => onNavigate('workspace', { projectId: selectedProject.id, projectTitle: selectedProject.title, goal: selectedProject.goal })} className="h-11 px-8 text-xs">
                OPEN IN WORKSPACE ↗
              </DecoButton>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => (
                <HistoryRow key={item._id || idx} item={item} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedProject && !projectsLoading && projects.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[#D4AF37]/10 bg-[#141414]">
          <p className="font-sans text-xs text-[#888888]">Select a project above to view its history.</p>
        </div>
      )}
    </div>
  );
}
