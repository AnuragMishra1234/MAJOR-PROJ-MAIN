import React from 'react';

/**
 * Art Deco Button Component
 * Gold border, sharp corners, wide letter tracking, uppercase typography, min 48px height.
 */
export default function DecoButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  disabled = false,
}) {
  const baseClasses =
    'inline-flex items-center justify-center h-12 px-8 font-sans text-xs tracking-[0.25em] uppercase font-semibold transition-all duration-300 focus:outline-none min-h-[48px] rounded-none';

  const variants = {
    primary:
      'bg-[#D4AF37] text-[#0A0A0A] border-2 border-[#D4AF37] shadow-gold hover:bg-[#F2E8C4] hover:border-[#F2E8C4] hover:shadow-gold-lg',
    secondary:
      'bg-transparent text-[#D4AF37] border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] hover:shadow-gold',
    ghost:
      'bg-transparent text-[#F2F0E4] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#D4AF37]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
