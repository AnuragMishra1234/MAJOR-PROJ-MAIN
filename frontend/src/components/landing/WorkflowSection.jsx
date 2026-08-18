import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Landing Page Section III — HOW IT WORKS (Architectural Timeline)
 */
export default function WorkflowSection() {
  const stages = [
    {
      numeral: 'I',
      title: 'UNDERSTAND',
      subtitle: 'Intent Parsing',
      desc: 'The Cognitive Engine analyzes your goal, extracting intent, constraints, target stack, and architectural requirements.',
    },
    {
      numeral: 'II',
      title: 'PLAN',
      subtitle: 'DAG Task Breakdown',
      desc: 'Formulates a Directed Acyclic Graph of dependent tasks across content, code structure, frontend assets, and verification.',
    },
    {
      numeral: 'III',
      title: 'GENERATE',
      subtitle: 'Synthesis Matrix',
      desc: 'Dispatches specialized neural generation agents to synthesize text, website components, and modular code concurrently.',
    },
    {
      numeral: 'IV',
      title: 'EXECUTE',
      subtitle: 'Runtime Compilation',
      desc: 'Instantiates mock runtime environments, builds bundle files, and mounts preview viewports.',
    },
    {
      numeral: 'V',
      title: 'VALIDATE',
      subtitle: 'Automated AST Check',
      desc: 'Evaluates generated code against syntax checkers, structural linters, and quality boundary conditions.',
    },
    {
      numeral: 'VI',
      title: 'HEAL',
      subtitle: 'Self-Patching Loop',
      desc: 'Upon failure detection, isolates error tracebacks, generates targeted repair patches, and re-validates.',
    },
    {
      numeral: 'VII',
      title: 'RESULT',
      subtitle: 'Unified Workspace',
      desc: 'Presents verified, production-ready deliverables in a centralized luxury workspace environment.',
    },
  ];

  return (
    <section id="architecture" className="py-28 px-6 bg-[#141414] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          numeral="III"
          title="FROM INTENT TO EXECUTION."
          subtitle="An architectural timeline detailing how human intent transforms into verified multi-asset deliverables."
        />

        {/* Timeline Container */}
        <div className="relative border-l-2 border-[#D4AF37]/30 ml-4 md:ml-32 space-y-12 my-16 pl-8 md:pl-12">
          {stages.map((stage, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker */}
              <div className="absolute -left-[45px] md:-left-[61px] top-1">
                <DiamondIcon size="sm" className="bg-[#0A0A0A]">
                  <span className="text-[10px] font-bold font-display">{stage.numeral}</span>
                </DiamondIcon>
              </div>

              {/* Stage Content Card */}
              <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 md:p-8 transition-all duration-300 hover:border-[#D4AF37] hover:shadow-gold">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl text-[#D4AF37] tracking-widest">
                      STAGE {stage.numeral}
                    </span>
                    <span className="font-sans text-xs tracking-[0.2em] uppercase text-[#D4AF37]/70">
                      // {stage.subtitle}
                    </span>
                  </div>
                  <span className="font-sans text-[10px] tracking-[0.3em] uppercase px-3 py-1 border border-[#D4AF37]/40 text-[#D4AF37]">
                    ACTIVE PROTOCOL
                  </span>
                </div>

                <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4] mb-3 group-hover:text-[#D4AF37] transition-colors">
                  {stage.title}
                </h3>
                <p className="font-sans text-sm text-[#888888] leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
