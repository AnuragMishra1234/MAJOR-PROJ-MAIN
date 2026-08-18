import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DecoCard from '../ui/DecoCard';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Landing Page Section V — ONE GOAL. MULTIPLE OUTPUTS.
 */
export default function GenerationSection() {
  const outputs = [
    {
      numeral: 'I',
      title: 'TEXT CONTENT',
      type: 'NARRATIVE & COPY',
      desc: 'Strategic copy, pitch briefs, business press releases, and executive documentation formulated automatically.',
      icon: '✦',
    },
    {
      numeral: 'II',
      title: 'WEBSITE APP',
      type: 'INTERACTIVE UI',
      desc: 'Full responsive Web UI components synthesized live with styled components, semantic DOM, and dynamic states.',
      icon: '❖',
    },
    {
      numeral: 'III',
      title: 'SOURCE CODE',
      type: 'ENGINEERING ASSETS',
      desc: 'Clean, type-safe React, Tailwind, and JavaScript code ready to compile or integrate into existing repositories.',
      icon: '◈',
    },
    {
      numeral: 'IV',
      title: 'DOCUMENTS',
      type: 'STRUCTURED SPECIFICATION',
      desc: 'Architectural specifications, API schemas, verification reports, and system telemetry saved in markdown formats.',
      icon: '◆',
    },
  ];

  return (
    <section className="py-28 px-6 bg-[#141414] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          numeral="V"
          title="ONE GOAL. MULTIPLE OUTPUTS."
          subtitle="The AI Generation Engine produces complete, interconnected deliverables in parallel from a single high-level objective."
        />

        {/* Output Exhibits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {outputs.map((out, idx) => (
            <DecoCard key={idx}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
                <span className="font-display text-2xl text-[#D4AF37] tracking-widest">
                  {out.numeral}
                </span>
                <DiamondIcon size="sm">{out.icon}</DiamondIcon>
              </div>

              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]/70 block mb-2">
                {out.type}
              </span>
              <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4] mb-4 group-hover:text-[#D4AF37] transition-colors">
                {out.title}
              </h3>
              <p className="font-sans text-sm text-[#888888] leading-relaxed">
                {out.desc}
              </p>
            </DecoCard>
          ))}
        </div>
      </div>
    </section>
  );
}
