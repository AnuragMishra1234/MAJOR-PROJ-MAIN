import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Landing Page Exhibit — AUTO-HEALING MECHANICAL ANIMATION DIAGRAM
 */
export default function HealingSection() {
  const steps = [
    { num: '01', title: 'ERROR', detail: 'Syntax or runtime failure isolated in isolated sandbox.' },
    { num: '02', title: 'ANALYZE', detail: 'Neural planner parses error stack trace and AST node.' },
    { num: '03', title: 'REPAIR', detail: 'Targeted code patch synthesized with zero side effects.' },
    { num: '04', title: 'RETRY', detail: 'Workflow engine re-executes task in clean container.' },
    { num: '05', title: 'SUCCESS', detail: 'Validation engine approves output for project assembly.' },
  ];

  return (
    <section className="py-28 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          title="WHEN SOMETHING BREAKS, THE WORKFLOW ADAPTS."
          subtitle="Failures become feedback. The system can identify the problem, generate a repair instruction and retry the task."
        />

        {/* Horizontal Mechanical Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-[#141414] border border-[#D4AF37]/30 p-6 flex flex-col items-center text-center relative transition-all duration-300 hover:border-[#D4AF37] hover:shadow-gold"
            >
              <DiamondIcon size="sm" className="mb-4">
                <span className="font-display text-[10px] text-[#D4AF37] font-bold">{step.num}</span>
              </DiamondIcon>

              <h4 className="font-display text-lg uppercase tracking-widest text-[#F2F0E4] mb-2 font-bold">
                {step.title}
              </h4>
              <p className="font-sans text-xs text-[#888888] leading-relaxed">
                {step.detail}
              </p>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-[#D4AF37]">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
