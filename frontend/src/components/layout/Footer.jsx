import React from 'react';
import GoldDivider from '../ui/GoldDivider';

/**
 * Art Deco Architectural Footer
 */
export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-[#0A0A0A] border-t-2 border-[#D4AF37]/30 py-16 px-6 sm:px-12 relative overflow-hidden">
      {/* Background Sunburst Accent */}
      <div className="absolute inset-0 bg-sunburst opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border border-[#D4AF37] rotate-45 bg-[#D4AF37]" />
              <span className="font-display text-2xl tracking-[0.3em] uppercase text-[#D4AF37]">
                GENERATIVE AI FOR EVERYONE
              </span>
            </div>
            <p className="font-sans text-xs tracking-wider text-[#888888] max-w-md leading-relaxed">
              An autonomous AI workflow orchestration platform. Turn high-level goals into fully validated, auto-healed code, text, website, and multi-artifact outcomes.
            </p>
          </div>

          {/* Nav Links */}
          <div className="space-y-3">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-4">
              I. NAVIGATION
            </p>
            <ul className="space-y-2 font-sans text-xs tracking-wider text-[#888888]">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-[#D4AF37] transition-colors">
                  Home Landing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-[#D4AF37] transition-colors">
                  Control Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('workspace')} className="hover:text-[#D4AF37] transition-colors">
                  AI Orchestration Workspace
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('history')} className="hover:text-[#D4AF37] transition-colors">
                  Project Log History
                </button>
              </li>
            </ul>
          </div>

          {/* Access Links */}
          <div className="space-y-3">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-4">
              II. ACCESS & SECURITY
            </p>
            <ul className="space-y-2 font-sans text-xs tracking-wider text-[#888888]">
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-[#D4AF37] transition-colors">
                  Member Login
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-[#D4AF37] transition-colors">
                  Account Registration
                </button>
              </li>
              <li>
                <span className="text-[#888888]/60">Auto-Healing Engine v1.4</span>
              </li>
              <li>
                <span className="text-[#888888]/60">Art Deco Specification 1925</span>
              </li>
            </ul>
          </div>
        </div>

        <GoldDivider />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-center md:text-left">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-[#888888]">
            Generative AI for Everyone — MCMXXV / MMXXV
          </p>
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-[#D4AF37]">
            Obsidian & Gold Design System
          </p>
        </div>
      </div>
    </footer>
  );
}
