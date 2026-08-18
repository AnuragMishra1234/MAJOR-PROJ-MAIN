import React from 'react';
import CornerBrackets from './CornerBrackets';

/**
 * Art Deco Architectural Exhibit Card Component
 * Rich charcoal background (#141414), thin gold border, 4 corner L-brackets, hover lift and glow.
 */
export default function DecoCard({
  children,
  className = '',
  featured = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#141414] p-8 border ${
        featured
          ? 'border-[#D4AF37] shadow-gold-lg'
          : 'border-[#D4AF37]/30 hover:border-[#D4AF37]'
      } transition-all duration-500 hover:-translate-y-2 hover:shadow-gold ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <CornerBrackets />
      {children}
    </div>
  );
}
