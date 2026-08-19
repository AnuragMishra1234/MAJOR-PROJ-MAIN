import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '@/hooks/useProject';
import DecoCard from '../components/ui/DecoCard';
import DecoButton from '../components/ui/DecoButton';
import DiamondIcon from '../components/ui/DiamondIcon';
import DecoInput from '../components/ui/DecoInput';
import { Plus, Folder, Activity, CheckCircle, Loader, AlertCircle, Clock, RefreshCw } from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CFG = {
  ACTIVE:    { label: 'ACTIVE',     cls: 'text-[#D4AF37] border-[#D4AF37]/50' },
  RUNNING:   { label: 'RUNNING',    cls: 'text-[#D4AF37] border-[#D4AF37]/50 animate-pulse' },
  COMPLETED: { label: 'COMPLETED',  cls: 'text-[#4CAF50] border-[#4CAF50]/40' },
  COMPLETED_: { label: 'COMPLETED', cls: 'text-[#4CAF50] border-[#4CAF50]/40' },
  FAILED:    { label: 'FAILED',     cls: 'text-[#EF5350] border-[#EF5350]/40' },
  PENDING:   { label: 'PENDING',    cls: 'text-[#888888] border-[#888888]/30' },
  DRAFT:     { label: 'DRAFT',      cls: 'text-[#888888] border-[#888888]/30' },
};

function StatusBadge({ status }) {
  const key = status?.toUpperCase?.() || 'DRAFT';
  const cfg = STATUS_CFG[key] || STATUS_CFG.DRAFT;
  return (
    <span className={`font-sans text-[9px] tracking-[0.2em] uppercase px-2.5 py-0.5 border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function TaskProgress({ completed, total }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-sans">
        <span className="text-[#888888] tracking-wider">TASKS</span>
        <span className="text-[#F2F0E4]">{completed}/{total}</span>
      </div>
      <div className="h-0.5 bg-[#0A0A0A] border border-[#D4AF37]/10">
        <div
          className="h-full bg-[#D4AF37] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

const PROJECT_GLYPHS = ['◈', '✓', '✦', '❖', '◉', '✕', '◆'];

function ProjectCard({ project, index, onOpen }) {
  const glyph   = PROJECT_GLYPHS[index % PROJECT_GLYPHS.length];
  const timeAgo = new Date(project.updatedAt).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const hasOutput = !!project.generatedOutput;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <DecoCard onClick={onOpen} className="flex flex-col justify-between h-full min-h-[220px]">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/15">
            <StatusBadge status={project.status} />
            <DiamondIcon size="sm">{glyph}</DiamondIcon>
          </div>

          <h3 className="font-display text-lg uppercase tracking-wider text-[#F2F0E4] mb-2 group-hover:text-[#D4AF37] transition-colors leading-tight">
            {project.title}
          </h3>

          <p className="font-sans text-[11px] text-[#888888] line-clamp-2 leading-relaxed">
            {project.goal}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#D4AF37]/10 space-y-2">
          {project.taskCount > 0 && (
            <TaskProgress completed={project.completedTasks} total={project.taskCount} />
          )}
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] text-[#888888]/60 tracking-wider">
              {timeAgo}
            </p>
            {hasOutput && (
              <span className="font-sans text-[9px] tracking-widest text-[#4CAF50] border border-[#4CAF50]/20 px-2 py-0.5">
                OUTPUT ↗
              </span>
            )}
          </div>
        </div>
      </DecoCard>
    </motion.div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ projects }) {
  const total     = projects.length;
  const active    = projects.filter((p) => ['ACTIVE', 'RUNNING', 'PENDING'].includes(p.status?.toUpperCase())).length;
  const completed = projects.filter((p) => p.status?.toUpperCase() === 'COMPLETED').length;
  const failed    = projects.filter((p) => p.status?.toUpperCase() === 'FAILED').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'TOTAL',     value: total,     color: 'text-[#F2F0E4]'  },
        { label: 'ACTIVE',    value: active,    color: 'text-[#D4AF37]'  },
        { label: 'COMPLETED', value: completed, color: 'text-[#4CAF50]'  },
        { label: 'FAILED',    value: failed,    color: 'text-[#EF5350]'  },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-[#141414] border border-[#D4AF37]/15 p-4 text-center">
          <span className={`font-display text-3xl block ${color}`}>{value}</span>
          <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#888888] block mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── New Project Modal ────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreate }) {
  const [goal, setGoal]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setFormError('');
    setSubmitting(true);
    try {
      await onCreate(goal.trim());
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to create project. Is the backend running?');
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg"
      >
        <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
            <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">
              NEW PROJECT
            </h3>
            <button
              onClick={onClose}
              className="text-[#888888] hover:text-[#D4AF37] transition-colors text-xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 bg-[#EF5350]/10 border border-[#EF5350]/30 p-3">
              <AlertCircle size={14} className="text-[#EF5350] shrink-0" />
              <p className="font-sans text-xs text-[#EF5350]">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <DecoInput
              label="DESCRIBE YOUR GOAL"
              rows={4}
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Create a launch package for an eco-friendly campus startup — website, content, and code."
            />

            <div className="flex justify-end gap-4 pt-2">
              <DecoButton type="button" variant="ghost" onClick={onClose} className="h-12 px-6">
                CANCEL
              </DecoButton>
              <DecoButton
                type="submit"
                variant="primary"
                disabled={submitting || !goal.trim()}
                className="h-12 px-6"
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader size={12} className="animate-spin" />CREATING…</span>
                ) : (
                  'CREATE PROJECT ↗'
                )}
              </DecoButton>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function NoProjects({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border border-[#D4AF37]/10 bg-[#141414]">
      <div className="w-14 h-14 border border-[#D4AF37]/30 rotate-45 flex items-center justify-center mb-8">
        <Folder size={16} className="text-[#D4AF37]/30 -rotate-45" />
      </div>
      <p className="font-display text-xl uppercase tracking-widest text-[#F2F0E4]/30 mb-3">
        No Projects Yet
      </p>
      <p className="font-sans text-xs text-[#888888] max-w-xs leading-relaxed mb-8">
        Create your first project to start the autonomous AI workflow orchestration.
      </p>
      <DecoButton variant="primary" onClick={onNew} className="h-12 px-8 text-xs">
        <Plus size={12} className="mr-2" />
        CREATE FIRST PROJECT
      </DecoButton>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function ProjectSkeleton() {
  return (
    <div className="bg-[#141414] border border-[#D4AF37]/10 p-8 animate-pulse space-y-4 min-h-[220px]">
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-[#D4AF37]/10" />
        <div className="h-8 w-8 bg-[#D4AF37]/10 rotate-45" />
      </div>
      <div className="h-5 w-3/4 bg-[#D4AF37]/8" />
      <div className="h-3 w-full bg-[#D4AF37]/5" />
      <div className="h-3 w-5/6 bg-[#D4AF37]/5" />
      <div className="pt-4 border-t border-[#D4AF37]/8">
        <div className="h-1 w-full bg-[#D4AF37]/10" />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

/**
 * Page — DASHBOARD
 *
 * Shows real projects from the backend (or error/empty state if unavailable).
 * Opening a project passes the project context to the Workspace page.
 */
export default function DashboardPage({ onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const { projects, loading, error, createProject, refresh } = useProject();

  const handleCreate = async (goal) => {
    const project = await createProject(goal);
    // Navigate to workspace with the new project pre-selected
    onNavigate('workspace', {
      projectId:    project.id,
      projectTitle: project.title,
      goal:         project.goal,
    });
  };

  const handleOpenProject = (project) => {
    onNavigate('workspace', {
      projectId:    project.id,
      projectTitle: project.title,
      goal:         project.goal,
    });
  };

  return (
    <div className="py-12 px-6 max-w-7xl mx-auto space-y-12">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b-2 border-[#D4AF37]/25">
        <div>
          <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] block mb-2">
            CONTROL DASHBOARD
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.15em] text-[#F2F0E4]">
            GENERATIVE AI <span className="text-[#D4AF37]">FOR EVERYONE</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            <button
              onClick={refresh}
              title="Refresh projects"
              className="p-2 text-[#888888] hover:text-[#D4AF37] transition-colors border border-[#888888]/20 hover:border-[#D4AF37]/40"
              aria-label="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <DecoButton
            variant="primary"
            onClick={() => setShowModal(true)}
            className="h-12 px-7 text-xs whitespace-nowrap"
          >
            <Plus size={12} className="mr-2" />
            NEW PROJECT ↗
          </DecoButton>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      {!loading && projects.length > 0 && <StatsRow projects={projects} />}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">
              PROJECTS
            </h2>
            {!loading && projects.length > 0 && (
              <span className="font-sans text-xs tracking-widest text-[#D4AF37]">
                {projects.length.toString().padStart(2, '0')} TOTAL
              </span>
            )}
          </div>

          {error && (
            <div className="bg-[#EF5350]/10 border border-[#EF5350]/30 p-4 flex items-start gap-3">
              <AlertCircle size={14} className="text-[#EF5350] shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-xs text-[#EF5350] font-semibold">Failed to load projects</p>
                <p className="font-sans text-[11px] text-[#EF5350]/70 mt-1">{error}</p>
                <p className="font-sans text-[10px] text-[#888888] mt-2">
                  Make sure the backend is running and MongoDB is connected.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => <ProjectSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 && !error ? (
            <NoProjects onNew={() => setShowModal(true)} />
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map((proj, idx) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  index={idx}
                  onOpen={() => handleOpenProject(proj)}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Quick Launch */}
          <div className="bg-[#0A0A0A] border-2 border-[#D4AF37] p-6 text-center space-y-4 shadow-gold">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
              ORCHESTRATION ENGINE
            </span>
            <h3 className="font-display text-xl uppercase tracking-wider text-[#F2F0E4]">
              LAUNCH WORKSPACE
            </h3>
            <p className="font-sans text-xs text-[#888888] leading-relaxed">
              Input a high-level objective and let the Agent + Planner + Workflow engine handle the rest.
            </p>
            <DecoButton
              variant="primary"
              fullWidth
              onClick={() => onNavigate('workspace')}
              className="h-11 text-[11px]"
            >
              OPEN AI WORKSPACE ↗
            </DecoButton>
          </div>

          {/* System Status */}
          <div className="bg-[#141414] border border-[#D4AF37]/20 p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D4AF37]/10">
              <Activity size={12} className="text-[#D4AF37]" />
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
                SYSTEM STATUS
              </span>
            </div>
            {[
              { label: 'Agent Engine',    status: 'ACTIVE' },
              { label: 'Planner',         status: 'ACTIVE' },
              { label: 'AI Generation',   status: 'ACTIVE' },
              { label: 'Auto-Healing',    status: 'ACTIVE' },
              { label: 'Execution Layer', status: 'ACTIVE' },
              { label: 'Validation',      status: 'ACTIVE' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-sans text-[11px] text-[#888888]">{label}</span>
                <span className="font-sans text-[9px] tracking-widest text-[#4CAF50] border border-[#4CAF50]/20 px-2 py-0.5">
                  {status}
                </span>
              </div>
            ))}
          </div>

          {/* History link */}
          <div className="text-center">
            <button
              onClick={() => onNavigate('history')}
              className="font-sans text-[11px] tracking-widest uppercase text-[#888888] hover:text-[#D4AF37] transition-colors border-b border-[#888888]/20 hover:border-[#D4AF37]/40 pb-1"
            >
              VIEW FULL HISTORY LOG →
            </button>
          </div>
        </div>
      </div>

      {/* ── New Project Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <NewProjectModal
            onClose={() => setShowModal(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}