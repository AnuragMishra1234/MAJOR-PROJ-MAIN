import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DecoButton from '../ui/DecoButton';
import DiamondIcon from '../ui/DiamondIcon';
import GoldDivider from '../ui/GoldDivider';

/**
 * Landing Page Section I — HERO
 *
 * Communicates the specific 6-phase pipeline this platform runs:
 * Agent → Planner → Workflow → Generation → Execution → Validation
 * (→ Auto-Healing in Phase 8)
 */
export default function Hero({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);

  const pipeline = [
    {
      numeral: 'I',
      label: 'AGENT',
      desc: 'Receives your goal and coordinates the entire workflow — no manual task management.',
    },
    {
      numeral: 'II',
      label: 'PLANNER',
      desc: 'Breaks your goal into a structured task graph. Every dependency resolved automatically.',
    },
    {
      numeral: 'III',
      label: 'WORKFLOW ENGINE',
      desc: 'Runs tasks in the correct order, tracks state, and manages failures cleanly.',
    },
    {
      numeral: 'IV',
      label: 'AI GENERATION',
      desc: 'Generates text, code, and websites using the leading language models.',
    },
    {
      numeral: 'V',
      label: 'EXECUTION',
      desc: 'Runs generated code in a safe sandbox and captures structured results.',
    },
    {
      numeral: 'VI',
      label: 'VALIDATION',
      desc: 'Every output is checked for correctness, completeness, and quality — automatically.',
    },
  ];

  return (
    <section className="relative py-24 md:py-36 px-6 bg-sunburst border-b border-[#D4AF37]/30 overflow-hidden">

      {/* Background crosshatch accent */}
      <div className="absolute inset-0 bg-artdeco-crosshatch opacity-50 pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-4 px-6 py-2.5 border border-[#D4AF37]/40 bg-[#141414] mb-10 shadow-gold"
        >
          <span className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45 shrink-0" />
          <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-[#D4AF37]">
            AUTONOMOUS AGENTIC AI PLATFORM
          </span>
          <span className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45 shrink-0" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl uppercase tracking-[0.2em] text-[#F2F0E4] leading-[1.1] mb-8"
        >
          FROM IDEA
          <br />
          <span className="text-[#D4AF37] drop-shadow-[0_0_25px_rgba(212,175,55,0.35)]">
            TO OUTPUT.
          </span>
        </motion.h1>

        <GoldDivider />

        {/* Supporting copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-sans text-base sm:text-lg text-[#888888] max-w-2xl mx-auto leading-relaxed mb-4 tracking-wide"
        >
          Let AI plan, generate, execute, and validate — automatically.
          You give the goal. The agent handles the rest.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="font-sans text-sm text-[#888888]/60 max-w-xl mx-auto leading-relaxed mb-12 tracking-wide"
        >
          Agent → Planner → Workflow → AI Generation → Execution → Validation
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-5 mb-20"
        >
          <DecoButton
            variant="primary"
            onClick={() => onNavigate('workspace')}
            className="h-14 px-10 text-xs"
          >
            START A PROJECT ↗
          </DecoButton>
          <a href="#architecture">
            <DecoButton variant="secondary" className="h-14 px-10 text-xs">
              SEE HOW IT WORKS
            </DecoButton>
          </a>
        </motion.div>

        {/* ── Interactive Pipeline Visual ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="border-2 border-[#D4AF37]/40 p-2 bg-[#0A0A0A] shadow-gold-lg"
        >
          <div className="border border-[#D4AF37]/20 bg-[#141414] p-6 md:p-8">
            <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-[#D4AF37] mb-6">
              THE ORCHESTRATION PIPELINE — CLICK A STAGE
            </p>

            {/* Stage selector grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              {pipeline.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 border transition-all duration-300 flex flex-col items-center text-center ${
                    activeStep === idx
                      ? 'border-[#D4AF37] bg-[#1E3D59]/30 shadow-gold scale-105'
                      : 'border-[#D4AF37]/20 bg-[#0A0A0A] hover:border-[#D4AF37]/50'
                  }`}
                >
                  <span className="font-display text-[11px] text-[#D4AF37] mb-1 tracking-widest">
                    {step.numeral}
                  </span>
                  <span className="font-display text-[11px] tracking-wider text-[#F2F0E4] font-bold leading-tight">
                    {step.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Active step detail */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0A0A0A] border border-[#D4AF37]/25 p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4 text-left">
                  <DiamondIcon size="md">
                    <span className="font-display text-sm">{pipeline[activeStep].numeral}</span>
                  </DiamondIcon>
                  <div>
                    <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] mb-1">
                      STAGE {pipeline[activeStep].numeral} — {pipeline[activeStep].label}
                    </p>
                    <p className="font-sans text-sm text-[#F2F0E4]/80 leading-relaxed max-w-md">
                      {pipeline[activeStep].desc}
                    </p>
                  </div>
                </div>

                <DecoButton
                  variant="ghost"
                  onClick={() => onNavigate('workspace')}
                  className="text-[11px] h-10 px-5 whitespace-nowrap shrink-0"
                >
                  TRY IT ↗
                </DecoButton>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
