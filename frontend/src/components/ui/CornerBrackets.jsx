import React from 'react';

/**
 * Art Deco Corner L-Brackets for cards and architectural frames.
 */
export default function CornerBrackets({ className = "border-[#D4AF37]/50 group-hover:border-[#D4AF37]" }) {
  return (
    <>
      <div className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 transition-colors ${className}`} />
      <div className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 transition-colors ${className}`} />
      <div className={`absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 transition-colors ${className}`} />
      <div className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 transition-colors ${className}`} />
    </>
  );
}
