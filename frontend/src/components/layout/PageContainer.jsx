import React from 'react';

/**
 * Art Deco Architectural Page Container
 * Provides background texture, low opacity vertical guide lines, and padding.
 */
export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen bg-[#0A0A0A] text-[#F2F0E4] bg-artdeco-crosshatch overflow-x-hidden ${className}`}>
      {/* Subtle Vertical Architectural Lines */}
      <div className="absolute inset-0 pointer-events-none flex justify-between max-w-7xl mx-auto px-6 opacity-10">
        <div className="w-px h-full bg-[#D4AF37]" />
        <div className="w-px h-full bg-[#D4AF37]" />
        <div className="w-px h-full bg-[#D4AF37]" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
