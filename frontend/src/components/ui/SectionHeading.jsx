import React from 'react';
import GoldDivider from './GoldDivider';

/**
 * Art Deco Architectural Section Heading
 * Includes Roman numeral, main uppercase title, tracking, and short gold divider.
 */
export default function SectionHeading({ numeral, title, subtitle, centered = true }) {
  return (
    <div className={`mb-16 ${centered ? 'text-center' : 'text-left'}`}>
      {numeral && (
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] mb-3">
          SECTION {numeral}
        </p>
      )}
      <h2 className="font-display text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4] mb-3 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="font-sans text-sm text-[#888888] max-w-xl mx-auto tracking-wider leading-relaxed">
          {subtitle}
        </p>
      )}
      <GoldDivider className={centered ? 'mx-auto' : 'ml-0'} />
    </div>
  );
}
