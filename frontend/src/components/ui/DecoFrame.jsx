import React from 'react';

/**
 * Art Deco Double Frame Container
 * Outer gold frame + inner dark inset frame.
 */
export default function DecoFrame({ children, className = '' }) {
  return (
    <div className={`border-2 border-[#D4AF37]/50 p-2 shadow-gold ${className}`}>
      <div className="border border-[#D4AF37]/25 bg-[#0A0A0A] p-6 md:p-8 relative">
        {children}
      </div>
    </div>
  );
}
