import React, { useState } from 'react';
import WorkflowPanel from '../components/workspace/WorkflowPanel';
import AgentPanel from '../components/workspace/AgentPanel';
import OutputViewer from '../components/workspace/OutputViewer';
import ValidationPanel from '../components/workspace/ValidationPanel';
import HealingPanel from '../components/workspace/HealingPanel';
import DecoButton from '../components/ui/DecoButton';
import DecoInput from '../components/ui/DecoInput';

/**
 * Page 5 — AI WORKSPACE (Central Application Experience)
 */
export default function WorkspacePage({ onNavigate }) {
  const [goal, setGoal] = useState('Create a launch package for an eco-friendly campus startup.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStage, setActiveStage] = useState(2); // STAGE III (GENERATE)

  // Interactive Validation & Healing State
  const [validationReport, setValidationReport] = useState({
    build: 'PASS',
    structure: 'PASS',
    output: 'FAIL',
    quality: 'PASS',
    hasError: true,
    errorMsg: 'TypeError: Missing fallback state in EcoCampus React component binding.',
  });

  const [isHealing, setIsHealing] = useState(false);
  const [healingStep, setHealingStep] = useState(-1);

  const stages = [
    { numeral: 'I', name: 'UNDERSTAND', status: 'COMPLETE' },
    { numeral: 'II', name: 'PLAN', status: 'COMPLETE' },
    { numeral: 'III', name: 'GENERATE', status: 'RUNNING' },
    { numeral: 'IV', name: 'EXECUTE', status: 'PENDING' },
    { numeral: 'V', name: 'VALIDATE', status: validationReport.hasError ? 'FAILED' : 'COMPLETE' },
    { numeral: 'VI', name: 'HEAL', status: isHealing ? 'RUNNING' : validationReport.hasError ? 'PENDING' : 'COMPLETE' },
  ];

  const plannedTasks = [
    { numeral: 'I', name: 'Generate executive business content', status: 'COMPLETE' },
    { numeral: 'II', name: 'Synthesize interactive web application', status: 'RUNNING' },
    { numeral: 'III', name: 'Compile source code & dependency tree', status: 'RUNNING' },
    { numeral: 'IV', name: 'Perform AST checking & auto-healing', status: validationReport.hasError ? 'AWAITING REPAIR' : 'COMPLETE' },
  ];

  const handleStartWorkflow = (e) => {
    e.preventDefault();
    if (!goal) return;
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
    }, 2000);
  };

  const handleSimulateHealing = () => {
    setIsHealing(true);
    setHealingStep(0);

    const interval = setInterval(() => {
      setHealingStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setIsHealing(false);
          setValidationReport({
            build: 'PASS',
            structure: 'PASS',
            output: 'PASS',
            quality: 'PASS',
            hasError: false,
            errorMsg: '',
          });
          return 5;
        }
        return prev + 1;
      });
    }, 600);
  };

  return (
    <div className="py-8 px-6 max-w-7xl mx-auto space-y-8">
      {/* ──────────────── TOP BAR ──────────────── */}
      <div className="bg-[#141414] border-2 border-[#D4AF37] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-gold">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-[#D4AF37] rotate-45 animate-pulse" />
          <div>
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">
              AUTONOMOUS AI WORKSPACE
            </span>
            <h1 className="font-display text-3xl uppercase tracking-widest text-[#F2F0E4]">
              ECOCAMPUS LAUNCH
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-sans text-xs tracking-widest uppercase px-4 py-1.5 border border-[#D4AF37]/40 bg-[#0A0A0A] text-[#D4AF37]">
            ORCHESTRATION: {isExecuting ? 'EXECUTING...' : isHealing ? 'AUTO-HEALING...' : 'ACTIVE'}
          </span>
          <DecoButton variant="ghost" className="h-10 text-[11px] px-4">
            SAVE SESSION
          </DecoButton>
          <DecoButton
            variant="primary"
            onClick={handleStartWorkflow}
            disabled={isExecuting}
            className="h-10 text-[11px] px-5"
          >
            {isExecuting ? 'RUNNING...' : 'START WORKFLOW ↗'}
          </DecoButton>
        </div>
      </div>

      {/* ──────────────── GOAL / PROMPT INPUT AREA ──────────────── */}
      <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-4">
        <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] block">
          PROJECT INTENT & OBJECTIVE
        </span>

        <form onSubmit={handleStartWorkflow} className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full">
            <DecoInput
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe what you want to create..."
            />
          </div>
          <DecoButton
            type="submit"
            variant="primary"
            disabled={isExecuting}
            className="h-14 px-8 whitespace-nowrap shrink-0"
          >
            {isExecuting ? 'ORCHESTRATING...' : 'START WORKFLOW ↗'}
          </DecoButton>
        </form>
      </div>

      {/* ──────────────── MAIN WORKSPACE GRID ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workflow Pipeline & Agent Status */}
        <div className="space-y-8">
          <WorkflowPanel
            stages={stages}
            activeStage={activeStage}
            onSelectStage={setActiveStage}
          />

          <AgentPanel
            agentStatus={isExecuting ? 'ORCHESTRATING' : isHealing ? 'PATCHING CODE' : 'ANALYZING GOAL'}
            currentAction={
              isExecuting
                ? 'Synthesizing multi-asset DAG task nodes concurrently.'
                : isHealing
                ? 'Applying optional chaining and null fallbacks to AST.'
                : 'Decomposing project intent into executable tasks.'
            }
            plannedTasks={plannedTasks}
          />
        </div>

        {/* Right 2 Columns: Outputs, Validation, Auto-Healing */}
        <div className="lg:col-span-2 space-y-8">
          <OutputViewer projectGoal={goal} />

          <ValidationPanel
            validationReport={validationReport}
            onTriggerRepair={handleSimulateHealing}
          />

          <HealingPanel
            isHealing={isHealing}
            healingStep={healingStep}
            onSimulateHealing={handleSimulateHealing}
          />
        </div>
      </div>
    </div>
  );
}
