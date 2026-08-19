import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflow } from '@/hooks/useWorkflow';
import { USE_MOCK } from '@/config/api';
import projectService from '@/services/projectService';
import { TaskStatus, WorkflowStatus, TASK_TYPE_GLYPH, TASK_TYPE_LABEL } from '@/constants/workflow';
import DecoButton from '../components/ui/DecoButton';
import DecoInput from '../components/ui/DecoInput';
import DiamondIcon from '../components/ui/DiamondIcon';
import {
  Loader, CheckCircle, XCircle, Play, Zap, AlertTriangle,
  Code, FileText, Globe, Shield, RefreshCw, Copy, Download,
  Sparkles, ExternalLink
} from 'lucide-react';

// ─── Goal Presets ─────────────────────────────────────────────────────────────
const GOAL_PRESETS = [
  {
    icon: '🌐',
    label: 'Art Deco Web Suite',
    desc: 'Landing page with hero, features & gold aesthetic',
    prompt: 'Build a luxury landing page for BeanLab Artisan Coffee with a hero section, feature cards, menu gallery, and contact form in Art Deco styling with HTML and CSS.'
  },
  {
    icon: '⚡',
    label: 'Node.js REST Engine',
    desc: 'Express API with JWT auth, CRUD & validation',
    prompt: 'Implement a production-grade Node.js and Express REST API for an inventory management service, including JWT authentication middleware, Mongoose schema models, and input validation.'
  },
  {
    icon: '📊',
    label: 'Python Data Pipeline',
    desc: 'Automated data analysis & report generator',
    prompt: 'Write an end-to-end Python script using Pandas and NumPy to ingest transaction datasets, calculate rolling metrics, detect anomalous spend patterns, and generate summary reports.'
  },
  {
    icon: '🏛️',
    label: 'AI Architecture Spec',
    desc: 'System design for multi-agent workflows',
    prompt: 'Draft a Technical Architecture Specification for an autonomous multi-agent software platform, detailing planner decomposition, DAG workflow execution, and self-healing retries.'
  }
];

// ─── Status Icon ──────────────────────────────────────────────────────────────
function TaskStatusIcon({ status, size = 14 }) {
  if (status === TaskStatus.COMPLETED) return <CheckCircle size={size} className="text-[#4CAF50] shrink-0" />;
  if (status === TaskStatus.RUNNING)   return <Loader size={size} className="text-[#D4AF37] shrink-0 animate-spin" />;
  if (status === TaskStatus.FAILED)    return <XCircle size={size} className="text-[#EF5350] shrink-0" />;
  if (status === TaskStatus.RETRYING)  return <RefreshCw size={size} className="text-[#FF9800] shrink-0 animate-spin" />;
  return <div className="border border-[#444444] shrink-0" style={{ width: size, height: size }} />;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 font-sans text-[9px] tracking-widest uppercase text-[#888888] hover:text-[#D4AF37] transition-colors border border-[#888888]/20 hover:border-[#D4AF37]/30 px-2 py-1"
      aria-label="Copy"
    >
      <Copy size={10} />{copied ? 'COPIED' : 'COPY'}
    </button>
  );
}

// ─── Output Renderers ─────────────────────────────────────────────────────────
function TextOutput({ output }) {
  const content = typeof output?.content === 'string' ? output.content : (typeof output === 'string' ? output : JSON.stringify(output, null, 2));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">GENERATED TEXT</span>
        <div className="flex items-center gap-2">
          {output?.model && <span className="font-mono text-[9px] text-[#888888] border border-[#888888]/20 px-2 py-0.5">{String(output.model)}</span>}
          {output?.latencyMs && <span className="font-mono text-[9px] text-[#888888]/60">{String(output.latencyMs)}ms</span>}
          <CopyButton text={content} />
        </div>
      </div>
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-4 max-h-80 overflow-y-auto">
        <pre className="font-sans text-xs text-[#F2F0E4]/80 leading-relaxed whitespace-pre-wrap break-words">{content || '(No content)'}</pre>
      </div>
      {output?.wordCount && <p className="font-sans text-[10px] text-[#888888]">{String(output.wordCount)} words</p>}
    </div>
  );
}

function CodeOutput({ output }) {
  const code = typeof output?.code === 'string' ? output.code : (typeof output?.content === 'string' ? output.content : (typeof output === 'string' ? output : JSON.stringify(output, null, 2)));
  const lang = typeof output?.language === 'string' ? output.language : 'text';
  const valError = typeof output?.validationError === 'object' && output?.validationError !== null
    ? (output.validationError.message || output.validationError.validationError || output.validationError.details || JSON.stringify(output.validationError))
    : (output?.validationError ? String(output.validationError) : null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">
          GENERATED CODE <span className="text-[#888888] normal-case ml-1">({lang})</span>
        </span>
        <CopyButton text={code} />
      </div>
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-4 max-h-96 overflow-auto">
        <pre className="font-mono text-[11px] text-[#F2F0E4]/90 leading-relaxed">{code || '(No code)'}</pre>
      </div>
      {output?.linesOfCode && <p className="font-sans text-[10px] text-[#888888]">{String(output.linesOfCode)} lines</p>}
      {output?.valid === false && valError && (
        <div className="flex items-center gap-2 bg-[#EF5350]/10 border border-[#EF5350]/30 p-2">
          <AlertTriangle size={12} className="text-[#EF5350] shrink-0" />
          <span className="font-sans text-[11px] text-[#EF5350]">Validation notice: {valError}</span>
        </div>
      )}
    </div>
  );
}

function WebsiteOutput({ output }) {
  const files = Array.isArray(output?.files) ? output.files : ['index.html'];
  const fileDetails = Array.isArray(output?.fileDetails) && output.fileDetails.length > 0
    ? output.fileDetails
    : [{ path: 'index.html', content: output?.content || '' }];

  const content = typeof output?.content === 'string' ? output.content : (typeof output === 'string' ? output : JSON.stringify(output));
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code'
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [selectedFilePath, setSelectedFilePath] = useState(fileDetails[0]?.path || 'index.html');

  const activeFile = fileDetails.find(f => f.path === selectedFilePath) || fileDetails[0] || { path: 'index.html', content };

  const viewportStyles = {
    desktop: 'w-full',
    tablet:  'max-w-[768px] mx-auto',
    mobile:  'max-w-[375px] mx-auto',
  };

  const openInNewTab = () => {
    try {
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.warn('Cannot open in new tab:', e);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'index.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Cannot download HTML:', e);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4AF37]/15 pb-2">
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-[#D4AF37]" />
          <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">LIVE WEBSITE ARTIFACT</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode switcher */}
          <div className="flex items-center border border-[#D4AF37]/20 p-0.5 bg-[#0A0A0A]">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-0.5 font-sans text-[9px] tracking-wider uppercase transition-colors ${viewMode === 'preview' ? 'bg-[#D4AF37] text-[#0A0A0A] font-bold' : 'text-[#888888] hover:text-[#F2F0E4]'}`}
            >
              PREVIEW
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-2 py-0.5 font-sans text-[9px] tracking-wider uppercase transition-colors ${viewMode === 'code' ? 'bg-[#D4AF37] text-[#0A0A0A] font-bold' : 'text-[#888888] hover:text-[#F2F0E4]'}`}
            >
              SOURCE ({fileDetails.length})
            </button>
          </div>

          {/* Viewport switchers for preview */}
          {viewMode === 'preview' && (
            <div className="flex items-center border border-[#D4AF37]/20 p-0.5 bg-[#0A0A0A]">
              <button
                onClick={() => setViewport('desktop')}
                className={`px-2 py-0.5 font-sans text-[9px] tracking-wider transition-colors ${viewport === 'desktop' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#F2F0E4]'}`}
                title="Desktop (100%)"
              >
                DESKTOP
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`px-2 py-0.5 font-sans text-[9px] tracking-wider transition-colors ${viewport === 'tablet' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#F2F0E4]'}`}
                title="Tablet (768px)"
              >
                TABLET
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`px-2 py-0.5 font-sans text-[9px] tracking-wider transition-colors ${viewport === 'mobile' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#F2F0E4]'}`}
                title="Mobile (375px)"
              >
                MOBILE
              </button>
            </div>
          )}

          <button
            onClick={openInNewTab}
            className="font-sans text-[9px] tracking-widest uppercase text-[#888888] hover:text-[#D4AF37] border border-[#888888]/20 px-2 py-1 bg-[#0A0A0A] transition-colors"
            title="Open in new window"
          >
            NEW TAB ↗
          </button>
          <button
            onClick={handleDownload}
            className="font-sans text-[9px] tracking-widest uppercase text-[#888888] hover:text-[#D4AF37] border border-[#888888]/20 px-2 py-1 bg-[#0A0A0A] transition-colors"
            title="Download index.html"
          >
            EXPORT
          </button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="bg-[#050505] border border-[#D4AF37]/10 p-2 min-h-[420px] flex justify-center">
          <div className={`w-full transition-all duration-300 ${viewportStyles[viewport]}`}>
            <iframe
              srcDoc={content}
              title="Interactive Website Preview"
              className="w-full h-[540px] bg-white border border-[#222222] shadow-2xl"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Multi-file tabs */}
          {fileDetails.length > 1 && (
            <div className="flex items-center gap-1 border-b border-[#D4AF37]/15 pb-2">
              {fileDetails.map((f) => (
                <button
                  key={f.path}
                  onClick={() => setSelectedFilePath(f.path)}
                  className={`px-3 py-1 font-mono text-[10px] tracking-wider transition-colors border ${
                    selectedFilePath === f.path
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50 font-bold'
                      : 'text-[#888888] border-transparent hover:text-[#F2F0E4] hover:border-[#444444]'
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] tracking-wider text-[#888888]">
              {activeFile.path.toUpperCase()} SOURCE ({activeFile.content.split('\n').length} lines)
            </span>
            <CopyButton text={activeFile.content} />
          </div>
          <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-4 max-h-96 overflow-auto">
            <pre className="font-mono text-[11px] text-[#F2F0E4]/90 leading-relaxed whitespace-pre-wrap break-words">
              {activeFile.content}
            </pre>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="font-sans text-[10px] text-[#888888]">ARTIFACT FILES:</span>
          {files.map((f, i) => (
            <span key={typeof f === 'string' ? f : i} className="font-mono text-[10px] text-[#D4AF37] bg-[#0A0A0A] border border-[#D4AF37]/20 px-2 py-0.5">
              {String(f)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationOutput({ output }) {
  const checks = Array.isArray(output?.checks) ? output.checks : [];
  const passed = checks.filter((c) => (c && (c.status === 'PASS' || c.passed === true))).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">VALIDATION REPORT</span>
        <span className={`font-sans text-[10px] tracking-widest uppercase border px-2 py-0.5 ${output?.valid ? 'text-[#4CAF50] border-[#4CAF50]/40' : 'text-[#EF5350] border-[#EF5350]/40'}`}>
          {output?.valid ? 'PASSED' : 'FAILED'}{checks.length > 0 && ` · ${passed}/${checks.length}`}
        </span>
      </div>
      {checks.map((check, idx) => {
        const name = typeof check === 'object' && check !== null ? (check.name || check.rule || `Check ${idx + 1}`) : String(check);
        const status = typeof check === 'object' && check !== null ? (check.status || (check.passed ? 'PASS' : 'FAIL')) : 'INFO';
        const isPass = status === 'PASS' || status === 'SUCCESS' || check?.passed === true;
        return (
          <div key={idx} className="flex items-center justify-between border-b border-[#D4AF37]/8 pb-2 last:border-0">
            <span className="font-sans text-[11px] text-[#888888]">{typeof name === 'object' ? JSON.stringify(name) : String(name)}</span>
            <span className={`font-sans text-[9px] tracking-widest ${isPass ? 'text-[#4CAF50]' : 'text-[#EF5350]'}`}>{String(status)}</span>
          </div>
        );
      })}
      {output?.score !== undefined && <p className="font-sans text-[10px] text-[#888888]">Score: {(Number(output.score) * 100).toFixed(0)}%</p>}
    </div>
  );
}

function GenericOutput({ output }) {
  const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">OUTPUT</span>
        <CopyButton text={text} />
      </div>
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-4 max-h-60 overflow-auto">
        <pre className="font-mono text-[10px] text-[#F2F0E4]/80 leading-relaxed">{text}</pre>
      </div>
    </div>
  );
}

function TaskOutput({ task }) {
  const output = task?.output;
  if (!output) return <p className="font-sans text-xs text-[#888888] italic">No output available for this task.</p>;
  const type = task.type || '';
  if (type === 'CODE_GENERATION' || output.code) return <CodeOutput output={output} />;
  if (type === 'WEBSITE_GENERATION' || output.files) return <WebsiteOutput output={output} />;
  if (type === 'VALIDATION' || output.checks) return <ValidationOutput output={output} />;
  if (output.content) return <TextOutput output={output} />;
  return <GenericOutput output={output} />;
}

// ─── Healing Badge ────────────────────────────────────────────────────────────
function HealingBadge({ healed }) {
  if (!healed) return null;
  return (
    <div className="flex items-center gap-2 bg-[#FF9800]/10 border border-[#FF9800]/30 px-3 py-2">
      <Zap size={11} className="text-[#FF9800] shrink-0" />
      <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#FF9800]">AUTO-HEALED</span>
      <CheckCircle size={11} className="text-[#4CAF50] ml-auto shrink-0" />
    </div>
  );
}

// ─── Real-mode Running Panel ──────────────────────────────────────────────────
function RunningStatePanel({ goal }) {
  const stages = ['Analyzing goal…', 'Planning tasks…', 'Generating with AI…', 'Executing output…', 'Validating results…'];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, stages.length - 1)), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-4">
      <p className="font-sans text-xs text-[#888888] italic border-l-2 border-[#D4AF37]/30 pl-3">"{goal}"</p>
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center gap-3">
            {i < idx ? <CheckCircle size={12} className="text-[#4CAF50] shrink-0" /> :
             i === idx ? <Loader size={12} className="text-[#D4AF37] animate-spin shrink-0" /> :
             <div className="w-3 h-3 border border-[#444444] shrink-0" />}
            <span className={`font-sans text-[11px] ${i < idx ? 'text-[#4CAF50]' : i === idx ? 'text-[#D4AF37]' : 'text-[#888888]/40'}`}>{stage}</span>
          </div>
        ))}
      </div>
      <p className="font-sans text-[10px] text-[#888888]/50 tracking-wide pt-2">This may take up to 30 seconds.</p>
    </div>
  );
}

// ─── Pipeline Task Row ────────────────────────────────────────────────────────
function PipelineTask({ task, isSelected, onClick }) {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isFailed    = task.status === TaskStatus.FAILED;
  const isRunning   = task.status === TaskStatus.RUNNING;
  const glyph       = TASK_TYPE_GLYPH[task.type] ?? '◈';
  const label       = TASK_TYPE_LABEL[task.type] ?? 'TASK';
  return (
    <motion.button layout onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 border text-left transition-all duration-200 ${
        isSelected   ? 'border-[#D4AF37] bg-[#0A0A0A]' :
        isFailed     ? 'border-[#EF5350]/30 bg-[#141414] hover:border-[#EF5350]/60' :
        isCompleted  ? 'border-[#4CAF50]/20 bg-[#141414] hover:border-[#4CAF50]/40' :
        isRunning    ? 'border-[#D4AF37]/60 bg-[#141414]' :
                       'border-[#D4AF37]/15 bg-[#141414] hover:border-[#D4AF37]/40'
      }`}
    >
      <TaskStatusIcon status={task.status} />
      <div className="flex-1 min-w-0">
        <p className={`font-sans text-xs tracking-wide truncate ${isRunning ? 'text-[#D4AF37]' : isCompleted ? 'text-[#F2F0E4]' : isFailed ? 'text-[#EF5350]' : 'text-[#888888]'}`}>
          {task.title}
        </p>
        <p className="font-mono text-[10px] text-[#888888]/60 mt-0.5">{glyph} · {label}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`font-sans text-[9px] tracking-widest uppercase ${isRunning ? 'text-[#D4AF37]' : isCompleted ? 'text-[#4CAF50]' : isFailed ? 'text-[#EF5350]' : 'text-[#444444]'}`}>
          {task.status}
        </span>
        {task.healed && <Zap size={9} className="text-[#FF9800]" title="Auto-healed" />}
      </div>
    </motion.button>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────
function TaskDetailPanel({ task, onClose }) {
  if (!task) {
    return (
      <div className="bg-[#141414] border border-[#D4AF37]/20 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-10 h-10 border border-[#D4AF37]/20 rotate-45 mb-6" />
        <p className="font-sans text-[11px] text-[#888888]/60 tracking-wider">SELECT A TASK TO VIEW DETAILS</p>
      </div>
    );
  }
  return (
    <div className="bg-[#141414] border border-[#D4AF37]/20 overflow-auto max-h-[calc(100vh-200px)]">
      <div className="sticky top-0 bg-[#141414] border-b border-[#D4AF37]/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TaskStatusIcon status={task.status} />
          <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">{TASK_TYPE_LABEL[task.type] ?? 'TASK'}</span>
        </div>
        <button onClick={onClose} className="text-[#888888] hover:text-[#D4AF37] text-sm transition-colors" aria-label="Close">✕</button>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <span className="font-sans text-[10px] tracking-wider text-[#888888] uppercase">TASK</span>
          <p className="font-display text-lg uppercase tracking-wider text-[#F2F0E4] mt-1">{task.title}</p>
          {task.description && <p className="font-sans text-[11px] text-[#888888] mt-2 leading-relaxed">{task.description}</p>}
        </div>
        <HealingBadge healed={task.healed} />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'STATUS', value: task.status, cls: task.status === TaskStatus.COMPLETED ? 'text-[#4CAF50]' : task.status === TaskStatus.FAILED ? 'text-[#EF5350]' : 'text-[#D4AF37]' },
            { label: 'TYPE', value: TASK_TYPE_LABEL[task.type] ?? 'OTHER', cls: 'text-[#F2F0E4]' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-3">
              <span className="font-sans text-[9px] tracking-widest uppercase text-[#888888] block mb-1">{label}</span>
              <span className={`font-sans text-xs font-semibold uppercase ${cls}`}>{value}</span>
            </div>
          ))}
        </div>
        {task.error && (
          <div className="bg-[#EF5350]/8 border border-[#EF5350]/30 p-4 space-y-2">
            <span className="font-sans text-[10px] tracking-widest uppercase text-[#EF5350]">ERROR</span>
            <p className="font-sans text-xs text-[#EF5350]/80 leading-relaxed">{task.error?.message || JSON.stringify(task.error)}</p>
          </div>
        )}
        {task.output && (
          <div className="border-t border-[#D4AF37]/10 pt-5">
            <TaskOutput task={task} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Progress Header ──────────────────────────────────────────────────────────
function ProgressHeader({ tasks, isComplete, isFailed, loading }) {
  const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="bg-[#141414] border border-[#D4AF37]/20 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {loading ? (
        <div className="flex items-center gap-3">
          <Loader size={14} className="text-[#D4AF37] animate-spin" />
          <span className="font-sans text-xs text-[#888888] tracking-wider">Running agent pipeline…</span>
        </div>
      ) : (
        <>
          <div className="flex-1 w-full space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#888888]">WORKFLOW PROGRESS</span>
              <span className={`font-sans text-[10px] tracking-widest font-bold uppercase ${isFailed ? 'text-[#EF5350]' : isComplete ? 'text-[#4CAF50]' : 'text-[#D4AF37]'}`}>
                {isFailed ? 'FAILED' : isComplete ? 'COMPLETE' : 'RUNNING'}{total > 0 && ` · ${completed}/${total}`}
              </span>
            </div>
            <div className="w-full h-1 bg-[#0A0A0A] border border-[#D4AF37]/10">
              <motion.div className={`h-full ${isFailed ? 'bg-[#EF5350]' : 'bg-[#D4AF37]'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
            </div>
          </div>
          {isComplete && <div className="flex items-center gap-2 shrink-0"><CheckCircle size={14} className="text-[#4CAF50]" /><span className="font-sans text-xs text-[#4CAF50]">All tasks complete</span></div>}
          {isFailed  && <div className="flex items-center gap-2 shrink-0"><AlertTriangle size={14} className="text-[#EF5350]" /><span className="font-sans text-xs text-[#EF5350]">Workflow failed</span></div>}
        </>
      )}
    </div>
  );
}

// ─── Healing Summary ──────────────────────────────────────────────────────────
function HealingSummary({ tasks }) {
  const healed = tasks.filter((t) => t.healed);
  if (healed.length === 0) return null;
  return (
    <div className="bg-[#141414] border border-[#FF9800]/20 p-5 space-y-3">
      <div className="flex items-center gap-2 pb-3 border-b border-[#FF9800]/10">
        <Zap size={12} className="text-[#FF9800]" />
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#FF9800]">AUTO-HEALING ACTIVE</span>
      </div>
      <p className="font-sans text-[11px] text-[#888888] leading-relaxed">
        {healed.length} task{healed.length > 1 ? 's were' : ' was'} automatically repaired and revalidated.
      </p>
      {healed.map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <CheckCircle size={11} className="text-[#4CAF50]" />
          <span className="font-sans text-[11px] text-[#F2F0E4]/60">{t.title}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty Workspace ──────────────────────────────────────────────────────────
function WorkspaceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-[#D4AF37]/10 bg-[#141414]">
      <div className="w-14 h-14 border border-[#D4AF37]/30 rotate-45 flex items-center justify-center mb-8">
        <Zap size={16} className="text-[#D4AF37]/40 -rotate-45" />
      </div>
      <p className="font-display text-xl uppercase tracking-widest text-[#F2F0E4]/40 mb-3">No Workflow Active</p>
      <p className="font-sans text-xs text-[#888888] leading-relaxed max-w-xs">
        Describe your goal above and press <strong className="text-[#D4AF37]">START WORKFLOW</strong> to launch the autonomous AI orchestration pipeline.
      </p>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
/**
 * Page — AI WORKSPACE
 *
 * Real mode  (VITE_USE_MOCK=false):
 *   Single synchronous POST /api/agent/run/:projectId call.
 *   Shows RunningStatePanel during await, displays results when done.
 *
 * Mock mode (VITE_USE_MOCK=true):
 *   Animated polling simulation with mock task progression.
 *
 * @param {object} navState - { projectId?, projectTitle?, goal? } from DashboardPage
 */
export default function WorkspacePage({ onNavigate, navState = {} }) {
  const { projectId: initialProjectId, projectTitle, goal: initialGoal } = navState;
  const [currentProjectId, setCurrentProjectId] = useState(initialProjectId || null);
  const [goal, setGoal]                         = useState(initialGoal || '');

  const { workflow, tasks, isRunning, isComplete, isFailed, selectedTask, selectTask, startWorkflow, cancelWorkflow, loading, error } = useWorkflow();

  const agentStatus = useMemo(() => {
    if (loading)    return 'RUNNING';
    if (!workflow)  return 'IDLE';
    if (isComplete) return 'COMPLETE';
    if (isFailed)   return 'FAILED';
    if (isRunning) {
      const t = tasks.find((t) => t.status === TaskStatus.RUNNING);
      return t ? t.title.toUpperCase() : 'RUNNING';
    }
    return workflow?.status || 'ACTIVE';
  }, [loading, workflow, isComplete, isFailed, isRunning, tasks]);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const promptText = goal.trim();
    if (!promptText) return;

    let targetId = currentProjectId;
    if (!targetId && !USE_MOCK) {
      try {
        const newProj = await projectService.createProject(promptText);
        targetId = newProj.id;
        setCurrentProjectId(targetId);
      } catch (err) {
        console.warn('Auto project creation notice:', err.message);
      }
    }

    await startWorkflow(promptText, targetId ?? null);
  };

  const handleApplyPreset = (preset) => {
    setGoal(preset.prompt);
  };

  const handleExportAll = () => {
    if (!tasks || tasks.length === 0) return;
    const bundle = {
      goal,
      workflowId: workflow?.workflowId || workflow?.id,
      completedAt: new Date().toISOString(),
      tasks: tasks.map(t => ({
        id: t.id,
        type: t.type,
        title: t.title,
        status: t.status,
        healed: t.healed || false,
        output: t.output,
      })),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-artifacts-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col bg-[#0A0A0A]">

      {/* Top Bar */}
      <div className="bg-[#0A0A0A] border-b border-[#D4AF37]/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 bg-[#D4AF37] rotate-45 shrink-0" />
          <div className="min-w-0">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">AUTONOMOUS AI WORKSPACE</span>
            {projectTitle ? (
              <span className="font-sans text-[11px] text-[#F2F0E4]/70 truncate block">{projectTitle}</span>
            ) : currentProjectId ? (
              <span className="font-sans text-[11px] text-[#888888] truncate block">Project ID: {currentProjectId}</span>
            ) : (
              <span className="font-sans text-[11px] text-[#888888] truncate block">Interactive Multi-Agent Session</span>
            )}
          </div>
          <span className={`font-sans text-[9px] tracking-[0.15em] uppercase border px-2 py-0.5 shrink-0 ${USE_MOCK ? 'text-[#888888] border-[#888888]/20' : 'text-[#4CAF50] border-[#4CAF50]/30 bg-[#4CAF50]/5'}`}>
            {USE_MOCK ? 'DEMO' : 'LIVE API'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isComplete && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 font-sans text-[10px] tracking-wider uppercase text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors"
            >
              <Download size={11} /> EXPORT BUNDLE
            </button>
          )}
          <span className={`font-sans text-[10px] tracking-[0.25em] uppercase border px-3 py-1 ${isFailed ? 'text-[#EF5350] border-[#EF5350]/40 bg-[#EF5350]/10' : isComplete ? 'text-[#4CAF50] border-[#4CAF50]/40 bg-[#4CAF50]/10' : (isRunning || loading) ? 'text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/10' : 'text-[#888888] border-[#888888]/20'}`}>
            STATUS: {agentStatus}
          </span>
          {isRunning && USE_MOCK && (
            <DecoButton variant="ghost" onClick={cancelWorkflow} className="h-8 text-[10px] px-3 text-[#EF5350] border-[#EF5350]/30 hover:border-[#EF5350]">CANCEL</DecoButton>
          )}
        </div>
      </div>

      {/* Goal Input & Presets */}
      <div className="bg-[#141414] border-b border-[#D4AF37]/15 p-6 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <DecoInput label="WHAT DO YOU WANT TO CREATE?" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Build an Art Deco website with hero, features, and contact form..." />
            </div>
            <DecoButton type="submit" variant="primary" disabled={loading || (isRunning && USE_MOCK) || !goal.trim()} className="h-14 px-8 whitespace-nowrap shrink-0 text-xs tracking-widest font-bold">
              {(loading || (isRunning && USE_MOCK)) ? (
                <span className="flex items-center gap-2"><Loader size={13} className="animate-spin" />RUNNING…</span>
              ) : (
                <span className="flex items-center gap-2"><Play size={13} />START WORKFLOW ↗</span>
              )}
            </DecoButton>
          </div>

          {/* Quick preset chips */}
          {!workflow && !loading && (
            <div className="pt-2">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#888888] block mb-2">
                OBJECTIVE PRESETS:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {GOAL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 text-left border border-[#D4AF37]/15 bg-[#0A0A0A] hover:border-[#D4AF37]/50 transition-colors flex items-start gap-2 group"
                  >
                    <span className="text-sm">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[11px] font-semibold text-[#F2F0E4] group-hover:text-[#D4AF37] transition-colors truncate">
                        {p.label}
                      </p>
                      <p className="font-sans text-[10px] text-[#888888] truncate">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-[#EF5350]/10 border-b border-[#EF5350]/30 px-6 py-3 flex items-start gap-3 shrink-0">
            <AlertTriangle size={14} className="text-[#EF5350] shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-xs text-[#EF5350]">{error}</p>
              <p className="font-sans text-[10px] text-[#EF5350]/60 mt-0.5">Ensure backend is running and you are logged in.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Row */}
      {(workflow || loading) && (
        <div className="px-6 pt-4 shrink-0 max-w-7xl w-full mx-auto">
          <ProgressHeader tasks={tasks} isComplete={isComplete} isFailed={isFailed} loading={loading} />
        </div>
      )}

      {/* 3-Column Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-6 h-full">

          {/* LEFT: Pipeline */}
          <div className="space-y-4">
            <div className="bg-[#141414] border border-[#D4AF37]/20">
              <div className="flex items-center justify-between p-4 border-b border-[#D4AF37]/10">
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">PIPELINE</span>
                <span className="font-sans text-[10px] text-[#888888]">{tasks.length > 0 ? `${tasks.length} TASKS` : '—'}</span>
              </div>
              <div className="divide-y divide-[#D4AF37]/8">
                {tasks.length > 0 ? tasks.map((task) => (
                  <PipelineTask key={task.id} task={task} isSelected={selectedTask?.id === task.id} onClick={() => selectTask(task.id)} />
                )) : (
                  <div className="p-6 text-center"><p className="font-sans text-[11px] text-[#444444] tracking-wider">AWAITING WORKFLOW</p></div>
                )}
              </div>
            </div>
            <HealingSummary tasks={tasks} />
          </div>

          {/* CENTRE: Agent Monitor */}
          <div className="space-y-4">
            <div className="bg-[#141414] border border-[#D4AF37]/20 p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#D4AF37]/10">
                <DiamondIcon size="sm">❖</DiamondIcon>
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">AGENT / ORCHESTRATOR</span>
              </div>
              {!workflow && !loading ? (
                <p className="font-sans text-xs text-[#888888] italic">Enter a goal and start the workflow to activate the agent.</p>
              ) : loading && !USE_MOCK ? (
                <RunningStatePanel goal={goal} />
              ) : loading ? (
                <div className="flex items-center gap-3">
                  <Loader size={14} className="text-[#D4AF37] animate-spin" />
                  <p className="font-sans text-xs text-[#F2F0E4]">Analyzing goal…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#0A0A0A] border border-[#D4AF37]/15 p-4">
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#888888] block mb-1.5">CURRENT ACTION</span>
                    <p className="font-sans text-xs text-[#F2F0E4] leading-relaxed">
                      {isComplete ? '✓ All tasks completed successfully.' : isFailed ? '✕ Workflow halted. Check task details for errors.' : tasks.find((t) => t.status === TaskStatus.RUNNING) ? `Executing: "${tasks.find((t) => t.status === TaskStatus.RUNNING)?.title}"` : 'Preparing next task…'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'COMPLETE', count: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length, color: 'text-[#4CAF50]' },
                      { label: 'RUNNING',  count: tasks.filter((t) => t.status === TaskStatus.RUNNING).length,   color: 'text-[#D4AF37]' },
                      { label: 'FAILED',   count: tasks.filter((t) => t.status === TaskStatus.FAILED).length,    color: 'text-[#EF5350]'  },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="bg-[#0A0A0A] border border-[#D4AF37]/10 p-3 text-center">
                        <span className={`font-display text-xl ${color}`}>{count}</span>
                        <span className="font-sans text-[9px] tracking-widest text-[#888888] block mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Workflow task list */}
            {workflow && !loading ? (
              <div className="bg-[#141414] border border-[#D4AF37]/20 p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#D4AF37]/10">
                  <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">WORKFLOW</span>
                  {(workflow.workflowId || workflow.id) && (
                    <span className="font-mono text-[9px] text-[#888888]">{(workflow.workflowId || workflow.id).slice(0, 20)}…</span>
                  )}
                </div>
                <p className="font-sans text-xs text-[#888888] italic border-l-2 border-[#D4AF37]/30 pl-3">"{workflow.goal || goal}"</p>
                <div className="space-y-2 pt-2">
                  {tasks.map((task, idx) => {
                    const isC = task.status === TaskStatus.COMPLETED;
                    const isR = task.status === TaskStatus.RUNNING;
                    const isF = task.status === TaskStatus.FAILED;
                    return (
                      <div key={task.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center shrink-0 mt-1">
                          <TaskStatusIcon status={task.status} size={13} />
                          {idx < tasks.length - 1 && <div className="w-px h-4 bg-[#D4AF37]/15 mt-1" />}
                        </div>
                        <button onClick={() => selectTask(task.id)} className={`flex-1 text-left p-3 border transition-all text-xs font-sans ${selectedTask?.id === task.id ? 'border-[#D4AF37] bg-[#0A0A0A]' : isF ? 'border-[#EF5350]/20 hover:border-[#EF5350]/40' : isC ? 'border-[#4CAF50]/15 hover:border-[#4CAF50]/30' : isR ? 'border-[#D4AF37]/40' : 'border-[#D4AF37]/10 hover:border-[#D4AF37]/25'}`}>
                          <div className="flex items-center justify-between">
                            <span className={isC ? 'text-[#F2F0E4]' : isR ? 'text-[#D4AF37]' : isF ? 'text-[#EF5350]' : 'text-[#888888]'}>{task.title}</span>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              {task.healed && <Zap size={10} className="text-[#FF9800]" title="Auto-healed" />}
                              {task.output && <span className="font-sans text-[9px] text-[#4CAF50] border border-[#4CAF50]/20 px-1.5 py-0.5">OUTPUT ↗</span>}
                            </div>
                          </div>
                          {task.description && <p className="text-[10px] text-[#888888]/60 mt-1 leading-relaxed">{task.description}</p>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : !loading ? (
              <WorkspaceEmptyState />
            ) : null}
          </div>

          {/* RIGHT: Task Detail */}
          <div className="min-h-[400px] lg:min-h-0">
            <TaskDetailPanel task={selectedTask} onClose={() => selectTask(null)} />
          </div>
        </div>
      </div>
    </div>
  );
}
