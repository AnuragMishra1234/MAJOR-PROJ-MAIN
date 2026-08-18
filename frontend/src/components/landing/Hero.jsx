import React, { useState } from 'react';
import DecoButton from '../ui/DecoButton';
import DiamondIcon from '../ui/DiamondIcon';
import GoldDivider from '../ui/GoldDivider';

/**
 * Landing Page Section I — HERO
 */
export default function Hero({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    { label: 'IDEA', numeral: 'I', desc: 'Raw Human Intent' },
    { label: 'AGENT', numeral: 'II', desc: 'Cognitive Parsing' },
    { label: 'PLAN', numeral: 'III', desc: 'DAG Task Breakdown' },
    { label: 'GENERATE', numeral: 'IV', desc: 'Multi-Asset Output' },
    { label: 'VALIDATE', numeral: 'V', desc: 'AST & Runtime Checks' },
    { label: 'HEAL', numeral: 'VI', desc: 'Self-Patching Loop' },
    { label: 'RESULT', numeral: 'VII', desc: 'Verified Deployment' },
  ];

  return (
    <section className="relative py-24 md:py-36 px-6 bg-sunburst border-b border-[#D4AF37]/30 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Roman Numeral Accent */}
        <div className="inline-flex items-center gap-4 px-6 py-2 border border-[#D4AF37]/40 bg-[#141414] mb-8 shadow-gold">
          <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
          <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37]">
            ROMAN NUMERAL I — WORKFLOW ORCHESTRATION
          </span>
          <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
        </div>

        {/* Main Heading */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl uppercase tracking-[0.25em] text-[#F2F0E4] leading-[1.1] mb-8">
          GENERATIVE AI <br />
          <span className="text-[#D4AF37] drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
            FOR EVERYONE
          </span>
        </h1>

        <GoldDivider />

        {/* Supporting Copy */}
        <p className="font-sans text-lg sm:text-xl text-[#888888] max-w-3xl mx-auto leading-relaxed mb-12 tracking-wide">
          Turn a high-level idea into a coordinated workflow of AI-generated, validated and refined outputs. Give AI the goal. Let AI handle the workflow.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-20">
          <DecoButton
            variant="primary"
            onClick={() => onNavigate('workspace')}
            className="h-14 px-10 text-xs"
          >
            CREATE A PROJECT ↗
          </DecoButton>
          <a href="#architecture">
            <DecoButton variant="secondary" className="h-14 px-10 text-xs">
              EXPLORE THE WORKFLOW
            </DecoButton>
          </a>
        </div>

        {/* Interactive Art Deco Workflow Visual */}
        <div className="border-2 border-[#D4AF37]/40 p-2 bg-[#0A0A0A] shadow-gold-lg">
          <div className="border border-[#D4AF37]/20 bg-[#141414] p-6 md:p-10 relative">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-6">
              THE AUTONOMOUS WORKFLOW MATRIX
            </p>

            {/* Stepped Workflow Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
              {workflowSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-4 border transition-all duration-300 flex flex-col items-center justify-center text-center ${
                    activeStep === idx
                      ? 'border-[#D4AF37] bg-[#1E3D59]/40 shadow-gold scale-105'
                      : 'border-[#D4AF37]/20 bg-[#0A0A0A] hover:border-[#D4AF37]/60'
                  }`}
                >
                  <span className="font-display text-xs text-[#D4AF37] mb-1 tracking-widest">
                    {step.numeral}
                  </span>
                  <span className="font-display text-sm tracking-wider text-[#F2F0E4] font-bold">
                    {step.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Step Detail Card */}
            <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left">
                <DiamondIcon size="md">✦</DiamondIcon>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs tracking-widest text-[#D4AF37]">
                      STAGE {workflowSteps[activeStep].numeral}
                    </span>
                    <span className="text-[#888888] text-xs">•</span>
                    <span className="font-display text-lg text-[#F2F0E4] uppercase tracking-wider">
                      {workflowSteps[activeStep].label} PROTOCOL
                    </span>
                  </div>
                  <p className="font-sans text-sm text-[#888888] mt-1">
                    {workflowSteps[activeStep].desc} — Autonomous orchestration loop.
                  </p>
                </div>
              </div>

              <DecoButton
                variant="ghost"
                onClick={() => onNavigate('workspace')}
                className="text-[11px] h-10 px-4 whitespace-nowrap"
              >
                SIMULATE IN WORKSPACE ↗
              </DecoButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
