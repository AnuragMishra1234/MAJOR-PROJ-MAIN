import React from 'react';
import DecoButton from '../ui/DecoButton';

/**
 * Art Deco Ceremonial Top Banner Navigation
 */
export default function Navbar({ activePage = 'landing', onNavigate }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
        {/* Brand Header */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-5 h-5 border border-[#D4AF37] rotate-45 bg-[#D4AF37]/20 group-hover:rotate-90 group-hover:bg-[#D4AF37] transition-all duration-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#D4AF37] group-hover:bg-[#0A0A0A]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl sm:text-2xl tracking-[0.3em] uppercase text-[#D4AF37] group-hover:text-[#F2E8C4] transition-colors">
              GENERATIVE AI
            </span>
            <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#888888]">
              FOR EVERYONE
            </span>
          </div>
        </button>

        {/* Navigation Anchors & Routes */}
        <nav className="hidden lg:flex items-center gap-8 font-sans text-xs tracking-[0.2em] uppercase text-[#F2F0E4]/70">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors hover:text-[#D4AF37] ${
              activePage === 'landing' ? 'text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1' : ''
            }`}
          >
            HOME
          </button>
          <a
            href="#architecture"
            onClick={(e) => {
              if (activePage !== 'landing') {
                onNavigate('landing');
              }
            }}
            className="transition-colors hover:text-[#D4AF37]"
          >
            HOW IT WORKS
          </a>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors hover:text-[#D4AF37] ${
              activePage === 'dashboard' ? 'text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1' : ''
            }`}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`transition-colors hover:text-[#D4AF37] ${
              activePage === 'history' ? 'text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1' : ''
            }`}
          >
            HISTORY
          </button>
          <button
            onClick={() => onNavigate('workspace')}
            className={`transition-colors hover:text-[#D4AF37] ${
              activePage === 'workspace' ? 'text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1' : ''
            }`}
          >
            WORKSPACE
          </button>
        </nav>

        {/* Action Group */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('login')}
            className="hidden sm:inline-block font-sans text-xs tracking-[0.2em] uppercase text-[#F2F0E4]/80 hover:text-[#D4AF37] transition-colors"
          >
            LOGIN
          </button>
          <DecoButton
            variant="secondary"
            onClick={() => onNavigate('workspace')}
            className="text-xs px-5 py-2.5 h-10 min-h-[40px]"
          >
            LAUNCH WORKSPACE ↗
          </DecoButton>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
    </header>
  );
}
