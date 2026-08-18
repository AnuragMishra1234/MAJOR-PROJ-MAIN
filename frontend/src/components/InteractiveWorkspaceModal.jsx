import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code2,
  FileText,
  Globe,
  Terminal,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';

const PRESET_IDEAS = [
  'Full-stack AI analytics dashboard with real-time charts & dark mode',
  'Automated multi-agent customer onboarding pipeline with validation',
  'Interactive 3D product showcase website with smooth scrollytelling',
];

export default function InteractiveWorkspaceModal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState(PRESET_IDEAS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code' | 'logs'
  const [autoHealed, setAutoHealed] = useState(false);

  const steps = [
    { title: 'User Intent', desc: 'Parsing natural language prompt & decomposing objectives', icon: Sparkles },
    { title: 'Agent / Planner', desc: 'Synthesizing DAG execution plan and task dependencies', icon: Bot },
    { title: 'Workflow Dispatch', desc: 'Orchestrating code, text, and asset generation in parallel', icon: Layers },
    { title: 'Generation Engine', desc: 'Synthesizing React components, styles, and data models', icon: Code2 },
    { title: 'Validation Engine', desc: 'Running automated linting, compile check, and runtime tests', icon: ShieldCheck },
    { title: 'Auto-Healing', desc: 'Detecting subtle edge error and applying autonomous patch', icon: RefreshCw },
    { title: 'Delivery Complete', desc: 'Verified artifacts packaged and ready for deployment', icon: CheckCircle2 },
  ];

  const handleRunSimulation = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setAutoHealed(false);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setIsRunning(false);
          setAutoHealed(true);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 900);
  };

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setCurrentStep(0);
      setAutoHealed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-neutral-900 text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  AI Orchestration Workspace Preview
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Autonomous Plan • Generate • Validate • Auto-Heal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Input prompt section */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                1. Describe Your Goal (User Idea)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Build an interactive AI application with automated testing..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-neutral-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                />
                <button
                  disabled={isRunning}
                  onClick={handleRunSimulation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-md"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Orchestrating...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Workflow</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preset suggestion pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 transition-colors font-mono text-left truncate max-w-xs"
                  >
                    + {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Step Progression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400">
                <span>2. Pipeline Orchestration Lifecycle</span>
                <span>{currentStep === steps.length - 1 ? '100% Completed' : isRunning ? 'In Progress' : 'Standby'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {steps.map((step, idx) => {
                  const isDone = currentStep > idx || currentStep === steps.length - 1;
                  const isCurrent = currentStep === idx && isRunning;
                  const Icon = step.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between min-h-[90px] ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : isCurrent
                          ? 'bg-blue-950/40 border-blue-500/60 text-blue-300 shadow-md ring-1 ring-blue-500/30'
                          : 'bg-neutral-800/40 border-white/5 text-neutral-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-4 h-4" />
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600">0{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold tracking-tight text-white/90">
                          {step.title}
                        </div>
                        <div className="text-[9px] line-clamp-2 mt-0.5 text-neutral-400 font-mono">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto Healing Callout */}
            {currentStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-indigo-200">
                    Autonomous Self-Healing Triggered & Resolved
                  </div>
                  <div className="text-neutral-400 font-mono text-[11px] mt-0.5">
                    [VALIDATION] Line 42: Syntax check reported unclosed JSX tag. <br />
                    [AUTO-HEAL] Agent injected AST repair patch. Re-verification passed with 0 warnings.
                  </div>
                </div>
              </motion.div>
            )}

            {/* Output Workspace Artifact View */}
            <div className="rounded-2xl border border-white/10 bg-neutral-950 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-neutral-900/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Live Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'code'
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Generated Code
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'logs'
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Telemetry Logs
                  </button>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STATUS: 200 OK (MOCK)
                </span>
              </div>

              <div className="p-4 min-h-[160px] text-xs font-mono">
                {activeTab === 'preview' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">Synthesized Application Component</div>
                          <div className="text-[11px] text-neutral-400">Deployed at mock-sandbox://agent-runner-01</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                        Production Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-white/5">
                        <div className="text-neutral-500">Latency</div>
                        <div className="font-bold text-white mt-0.5">14.2 ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-white/5">
                        <div className="text-neutral-500">Tests Passed</div>
                        <div className="font-bold text-emerald-400 mt-0.5">18 / 18</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-white/5">
                        <div className="text-neutral-500">Self-Heals</div>
                        <div className="font-bold text-indigo-400 mt-0.5">1 Resolved</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <pre className="text-neutral-300 leading-relaxed text-[11px] overflow-x-auto">
{`// Synthesized by Generative AI for Everyone Pipeline
import React, { useState } from 'react';

export default function WorkspaceApp() {
  const [status, setStatus] = useState('INITIALIZED');

  return (
    <div className="p-8 rounded-3xl bg-neutral-900 text-white">
      <h1 className="text-2xl font-bold">Autonomous Agent Workflow</h1>
      <p className="text-neutral-400">Plan -> Generate -> Validate -> Auto-Heal</p>
    </div>
  );
}`}
                  </pre>
                )}

                {activeTab === 'logs' && (
                  <div className="space-y-1 text-[11px] text-neutral-400">
                    <div className="text-emerald-400">[00:00.12] Intent Decomposer initialized successfully.</div>
                    <div className="text-blue-400">[00:00.45] DAG Planner mapped 4 execution nodes.</div>
                    <div className="text-neutral-300">[00:01.02] Generation Engine dispatched React + Tailwind template.</div>
                    <div className="text-rose-400">[00:01.65] Validation: Syntax check caught unexpected token in line 42.</div>
                    <div className="text-indigo-400">[00:01.89] Auto-Healing Agent applied hotfix patch in 24ms.</div>
                    <div className="text-emerald-400">[00:02.10] Final sanity suite verified. Ready.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-neutral-950/50 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-mono">
              Generative AI for Everyone • Frontend Prototype
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-semibold tracking-tight transition-colors"
            >
              Close Workspace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
