import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DecoCard from '../ui/DecoCard';

/**
 * Landing Page Section IV — THE AGENT SETS THE STAGE
 */
export default function AgentSection() {
  const mockTasks = [
    { numeral: 'I', title: 'BUSINESS CONTENT', status: 'COMPLETE', statusColor: 'text-[#D4AF37] border-[#D4AF37]' },
    { numeral: 'II', title: 'WEBSITE GENERATION', status: 'RUNNING', statusColor: 'text-[#F2F0E4] border-[#F2F0E4] animate-pulse' },
    { numeral: 'III', title: 'SUPPORTING CONTENT', status: 'PENDING', statusColor: 'text-[#888888] border-[#888888]/40' },
    { numeral: 'IV', title: 'VALIDATION', status: 'PENDING', statusColor: 'text-[#888888] border-[#888888]/40' },
  ];

  return (
    <section className="py-28 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          numeral="IV"
          title="THE AGENT SETS THE STAGE."
          subtitle="The Agent interprets the user's goal and determines the work required to achieve it."
        />

        {/* Mock Task Planning Interface Exhibit */}
        <div className="border-2 border-[#D4AF37]/50 p-2 shadow-gold bg-[#141414]">
          <div className="border border-[#D4AF37]/25 bg-[#0A0A0A] p-8 md:p-12">
            {/* Header Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 mb-8 border-b border-[#D4AF37]/20">
              <div>
                <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#D4AF37] block mb-2">
                  PROJECT SPECIFICATION
                </span>
                <h4 className="font-display text-3xl uppercase tracking-widest text-[#F2F0E4]">
                  ECOCAMPUS LAUNCH
                </h4>
              </div>

              <div>
                <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#D4AF37] block mb-2">
                  USER GOAL INTENT
                </span>
                <p className="font-sans text-sm text-[#888888] italic border-l-2 border-[#D4AF37] pl-4">
                  "Create a launch package for an eco-friendly campus startup."
                </p>
              </div>
            </div>

            {/* Planned Tasks List */}
            <div>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-6">
                PLANNED TASK MATRIX
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-[#141414] border border-[#D4AF37]/30 p-5 flex items-center justify-between transition-all hover:border-[#D4AF37]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display text-lg text-[#D4AF37] tracking-widest">
                        {t.numeral}
                      </span>
                      <span className="font-display text-base uppercase tracking-wider text-[#F2F0E4]">
                        {t.title}
                      </span>
                    </div>

                    <span className={`font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 border ${t.statusColor}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
