import React from 'react';

/**
 * Art Deco Form Input Component
 * Transparent background, bottom gold border, no rounded corners, champagne text, gold focus state.
 */
export default function DecoInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  name,
  className = '',
  rows,
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-2">
          {label} {required && <span className="text-[#D4AF37]">*</span>}
        </label>
      )}

      {rows ? (
        <textarea
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent border-b-2 border-[#D4AF37] py-3 text-base font-sans text-[#F2F0E4] placeholder-[#888888]/60 focus:outline-none focus:border-[#F2E8C4] focus:shadow-gold transition-all resize-none rounded-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent border-b-2 border-[#D4AF37] py-3 text-base font-sans text-[#F2F0E4] placeholder-[#888888]/60 focus:outline-none focus:border-[#F2E8C4] focus:shadow-gold transition-all rounded-none"
        />
      )}
    </div>
  );
}
