import React from 'react';

/**
 * Navigation (Art Deco Ceremonial Banner)
 * Obsidian black, gold borders, all-caps Marcellus typography.
 */
export default function Navigation({ onOpenWorkspace }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-[#D4AF37] rotate-45 bg-[#D4AF37]/20" />
          <div className="flex flex-col">
            <span className="font-display text-xl sm:text-2xl tracking-[0.3em] uppercase text-[#D4AF37]">
              GENERATIVE AI
            </span>
            <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#888888]">
              FOR EVERYONE
            </span>
          </div>
        </div>

        {/* Navigation Anchors */}
        <nav className="hidden md:flex items-center gap-8 font-sans text-xs tracking-[0.2em] uppercase text-[#F2F0E4]/70">
          <a href="#architecture" className="hover:text-[#D4AF37] transition-colors">Architecture</a>
          <a href="#specifications" className="hover:text-[#D4AF37] transition-colors">Specifications</a>
          <a href="#tiers" className="hover:text-[#D4AF37] transition-colors">Editions</a>
          <a href="#protocol" className="hover:text-[#D4AF37] transition-colors">Protocol</a>
        </nav>

        {/* Right Art Deco CTA */}
        <button
          onClick={onOpenWorkspace}
          className="font-sans text-xs tracking-[0.2em] uppercase border-2 border-[#D4AF37] text-[#D4AF37] px-6 py-2.5 transition-all duration-300 hover:bg-[#D4AF37] hover:text-[#0A0A0A] hover:shadow-gold"
        >
          Launch Workspace ↗
        </button>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
    </header>
  );
}
