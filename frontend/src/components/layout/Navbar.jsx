import React, { useState } from 'react';
import DecoButton from '../ui/DecoButton';
import { Menu, X, LogOut, User } from 'lucide-react';
import { USE_MOCK } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Art Deco Ceremonial Top Navigation
 *
 * Desktop: full nav links + LOGIN + LAUNCH WORKSPACE
 * Mobile: hamburger → slide-down menu
 * Dev mode: subtle MOCK MODE badge when VITE_USE_MOCK=true
 */
export default function Navbar({ activePage = 'landing', onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
    setMobileOpen(false);
  };

  const navLinks = [
    { id: 'landing',   label: 'HOME'      },
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'workspace', label: 'WORKSPACE' },
    { id: 'history',   label: 'HISTORY'   },
  ];

  const handleNav = (page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/97 backdrop-blur-md border-b border-[#D4AF37]/25">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <button
          onClick={() => handleNav('landing')}
          className="flex items-center gap-3 text-left focus:outline-none group shrink-0"
          aria-label="Go to home"
        >
          <div className="w-4 h-4 border border-[#D4AF37] rotate-45 bg-[#D4AF37]/20 group-hover:rotate-90 group-hover:bg-[#D4AF37] transition-all duration-500 flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 bg-[#D4AF37] group-hover:bg-[#0A0A0A] transition-colors" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg sm:text-xl tracking-[0.25em] uppercase text-[#D4AF37] group-hover:text-[#F2E8C4] transition-colors">
              GENERATIVE AI
            </span>
            <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#888888]">
              FOR EVERYONE
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7 font-sans text-xs tracking-[0.2em] uppercase">
          {navLinks.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`transition-colors hover:text-[#D4AF37] pb-0.5 ${
                activePage === id
                  ? 'text-[#D4AF37] border-b border-[#D4AF37]'
                  : 'text-[#F2F0E4]/60'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-4">
          {USE_MOCK && (
            <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#888888] border border-[#888888]/20 px-2 py-1">
              MOCK MODE
            </span>
          )}

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 font-sans text-xs text-[#F2F0E4]/60 tracking-wider">
                <User size={11} className="text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-bold uppercase">{user?.name?.split(' ')[0] || 'USER'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 font-sans text-xs tracking-[0.2em] uppercase text-[#888888] hover:text-[#EF5350] transition-colors"
              >
                <LogOut size={11} />LOGOUT
              </button>
              <DecoButton
                variant="secondary"
                onClick={() => handleNav('workspace')}
                className="text-xs px-5 py-2 h-9 min-h-[36px]"
              >
                WORKSPACE ↗
              </DecoButton>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNav('login')}
                className="font-sans text-xs tracking-[0.2em] uppercase text-[#F2F0E4]/60 hover:text-[#D4AF37] transition-colors"
              >
                LOGIN
              </button>
              <DecoButton
                variant="secondary"
                onClick={() => handleNav('workspace')}
                className="text-xs px-5 py-2 h-9 min-h-[36px]"
              >
                LAUNCH ↗
              </DecoButton>
            </>
          )}
        </div>


        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-[#D4AF37] p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Gradient rule */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-b border-[#D4AF37]/20 px-5 py-5 space-y-1">
          {navLinks.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full text-left font-sans text-sm tracking-[0.2em] uppercase py-3 border-b border-[#D4AF37]/10 last:border-0 transition-colors ${
                activePage === id
                  ? 'text-[#D4AF37]'
                  : 'text-[#F2F0E4]/60 hover:text-[#D4AF37]'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => handleNav('login')}
              className="font-sans text-sm tracking-widest uppercase text-[#888888] hover:text-[#D4AF37] transition-colors text-left"
            >
              LOGIN
            </button>
            <DecoButton
              variant="primary"
              onClick={() => handleNav('workspace')}
              className="h-11 text-xs w-full"
            >
              LAUNCH WORKSPACE ↗
            </DecoButton>
          </div>
        </div>
      )}
    </header>
  );
}
