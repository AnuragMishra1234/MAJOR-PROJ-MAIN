import React from 'react';

/**
 * Art Deco 45-degree Rotated Diamond Icon Container
 * Outer square is rotated 45deg, inner content is counter-rotated -45deg to stay upright.
 */
export default function DiamondIcon({ children, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {/* Rotated Diamond Background */}
      <div className="absolute inset-0 border border-[#D4AF37] rotate-45 bg-[#141414] shadow-gold transition-all duration-500 hover:rotate-90 hover:scale-110" />
      {/* Upright Counter-Rotated Content */}
      <div className="relative z-10 text-[#D4AF37] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
