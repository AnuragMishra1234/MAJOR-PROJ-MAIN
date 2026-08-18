import React from 'react';

/**
 * Art Deco Short Gold Horizontal Divider with Central Diamond Motif
 */
export default function GoldDivider({ className = '' }) {
  return (
    <div className={`w-32 h-px bg-[#D4AF37] mx-auto my-6 relative ${className}`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-[#D4AF37] rotate-45 bg-[#0A0A0A]" />
    </div>
  );
}
