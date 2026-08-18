import React from 'react';
import DecoButton from '../ui/DecoButton';
import GoldDivider from '../ui/GoldDivider';

/**
 * Landing Page Section VIII — FINAL CTA
 */
export default function FinalCTA({ onNavigate }) {
  return (
    <section className="py-32 px-6 bg-sunburst bg-artdeco-crosshatch relative text-center">
      <div className="max-w-4xl mx-auto border-2 border-[#D4AF37] p-8 md:p-16 bg-[#141414] shadow-gold-lg relative">
        {/* Top Roman Numeral Badge */}
        <div className="inline-flex items-center gap-4 px-6 py-2 border border-[#D4AF37]/40 bg-[#0A0A0A] mb-8">
          <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
          <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37]">
            ROMAN NUMERAL VIII — GENESIS PROTOCOL
          </span>
          <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
        </div>

        {/* Heading */}
        <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-[0.25em] text-[#F2F0E4] mb-6">
          YOUR IDEA <span className="text-[#D4AF37]">IS ENOUGH.</span>
        </h2>

        <GoldDivider />

        <p className="font-sans text-lg text-[#888888] max-w-lg mx-auto mb-10 leading-relaxed tracking-wide">
          Describe what you want to create. <br />
          Let AI handle the coordination.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          <DecoButton
            variant="primary"
            onClick={() => onNavigate('workspace')}
            className="h-14 px-10 text-xs"
          >
            CREATE A PROJECT ↗
          </DecoButton>
          <DecoButton
            variant="secondary"
            onClick={() => onNavigate('workspace')}
            className="h-14 px-10 text-xs"
          >
            LAUNCH WORKSPACE
          </DecoButton>
        </div>
      </div>
    </section>
  );
}
