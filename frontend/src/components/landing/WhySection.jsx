import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DecoCard from '../ui/DecoCard';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Landing Page Section II — WHY THIS EXISTS
 */
export default function WhySection() {
  const problems = [
    {
      numeral: '01',
      title: 'FRAGMENTED TOOLING',
      desc: 'Users constantly jump between isolated AI chat windows, code generators, and copy editors.',
      icon: '❖',
    },
    {
      numeral: '02',
      title: 'MANUAL RE-PROMPTING',
      desc: 'Context is lost between steps, requiring endless rewriting of prompts and instructions.',
      icon: '◈',
    },
    {
      numeral: '03',
      title: 'UNTESTED OUTPUTS',
      desc: 'Standard AI chatbots output hallucinated code or flawed text with zero verification.',
      icon: '✦',
    },
    {
      numeral: '04',
      title: 'MANUAL ERROR FIXING',
      desc: 'When generated code breaks, the user is left alone to debug, paste errors, and pray.',
      icon: '◆',
    },
  ];

  return (
    <section className="py-28 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          numeral="II"
          title="AI SHOULD DO MORE THAN ANSWER."
          subtitle="Current workflows force humans to act as glue between fragmented AI models. We engineered a unified orchestration paradigm."
        />

        {/* Problem Exhibits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {problems.map((p, idx) => (
            <DecoCard key={idx}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
                <span className="font-display text-xl text-[#D4AF37] tracking-widest font-light">
                  EXHIBIT {p.numeral}
                </span>
                <DiamondIcon size="sm">{p.icon}</DiamondIcon>
              </div>
              <h3 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3 group-hover:text-[#D4AF37] transition-colors">
                {p.title}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[#888888]">
                {p.desc}
              </p>
            </DecoCard>
          ))}
        </div>

        {/* Transition Banner */}
        <div className="border-2 border-[#D4AF37] p-8 md:p-12 text-center bg-[#141414] shadow-gold-lg relative">
          <div className="inline-block px-4 py-1 border border-[#D4AF37]/40 bg-[#0A0A0A] font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-4">
            THE PARADIGM SHIFT
          </div>
          <h3 className="font-display text-4xl md:text-6xl uppercase tracking-[0.25em] text-[#F2F0E4]">
            ONE WORKSPACE. <span className="text-[#D4AF37]">ONE WORKFLOW.</span>
          </h3>
          <p className="font-sans text-sm text-[#888888] tracking-wider max-w-xl mx-auto mt-4">
            From high-level intent to validated execution without manual intervention.
          </p>
        </div>
      </div>
    </section>
  );
}
