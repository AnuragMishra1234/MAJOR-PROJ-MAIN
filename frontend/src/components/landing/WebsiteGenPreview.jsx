import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DecoFrame from '../ui/DecoFrame';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Landing Page Exhibit — WEBSITE GENERATION PREVIEW
 */
export default function WebsiteGenPreview() {
  return (
    <section className="py-24 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          title="WEBSITE SYNTHESIS PIPELINE."
          subtitle="Visualize the transition from user intent to executable code and live interactive website preview."
        />

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-12">
          {[
            { step: '01', label: 'USER GOAL' },
            { step: '02', label: 'AI GENERATION' },
            { step: '03', label: 'CODE SYNTHESIS' },
            { step: '04', label: 'WEBSITE UI' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-[#141414] border border-[#D4AF37]/30 p-4 flex flex-col items-center justify-center relative"
            >
              <span className="font-sans text-[10px] tracking-[0.25em] text-[#D4AF37]">
                STEP {item.step}
              </span>
              <span className="font-display text-sm uppercase tracking-wider text-[#F2F0E4] mt-1 font-bold">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Mock Generated Website Preview Double-Frame Container */}
        <DecoFrame>
          {/* Mock Browser Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-[#D4AF37]" />
              <div className="w-2.5 h-2.5 bg-[#D4AF37]/60" />
              <div className="w-2.5 h-2.5 bg-[#D4AF37]/30" />
            </div>
            <div className="font-sans text-xs tracking-widest text-[#D4AF37] px-6 py-1 border border-[#D4AF37]/30 bg-[#0A0A0A]">
              https://ecocampus-launch.generated.ai
            </div>
            <span className="font-sans text-[10px] tracking-widest text-[#888888]">
              LIVE PREVIEW
            </span>
          </div>

          {/* Generated Website Visual Body */}
          <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-8 md:p-12 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1 border border-[#D4AF37]/40 bg-[#141414]">
              <span className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45" />
              <span className="font-sans text-[10px] tracking-[0.25em] text-[#D4AF37]">
                ECOCAMPUS INITIATIVE
              </span>
            </div>

            <h4 className="font-display text-3xl md:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4]">
              SUSTAINABLE CAMPUS FUTURE
            </h4>

            <p className="font-sans text-xs md:text-sm text-[#888888] max-w-xl mx-auto leading-relaxed">
              Empowering universities with autonomous solar integration, zero-waste logistics, and carbon-neutral building design.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <div className="px-6 py-2.5 border border-[#D4AF37] text-[#0A0A0A] bg-[#D4AF37] font-sans text-[11px] tracking-widest uppercase font-bold">
                Join Ecosystem
              </div>
              <div className="px-6 py-2.5 border border-[#D4AF37] text-[#D4AF37] font-sans text-[11px] tracking-widest uppercase">
                Read Whitepaper
              </div>
            </div>
          </div>
        </DecoFrame>
      </div>
    </section>
  );
}
