import React, { useState } from 'react';
import DecoInput from '../components/ui/DecoInput';
import DecoButton from '../components/ui/DecoButton';
import DiamondIcon from '../components/ui/DiamondIcon';
import GoldDivider from '../components/ui/GoldDivider';

/**
 * Page 2 — LOGIN PAGE
 */
export default function LoginPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-20 px-6 bg-sunburst">
      <div className="w-full max-w-md border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg">
        <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 sm:p-10 text-center">
          <DiamondIcon size="md" className="mx-auto mb-6">
            ❖
          </DiamondIcon>

          <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block mb-2">
            MEMBER PROTOCOL
          </span>

          <h2 className="font-display text-3xl uppercase tracking-[0.2em] text-[#F2F0E4] mb-2">
            WELCOME BACK
          </h2>

          <p className="font-sans text-xs text-[#888888] tracking-widest uppercase mb-6">
            ENTER THE WORKSPACE
          </p>

          <GoldDivider />

          <form onSubmit={handleSubmit} className="space-y-6 text-left mt-6">
            <DecoInput
              label="EMAIL ADDRESS"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
            />

            <DecoInput
              label="SECURITY PASSWORD"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <DecoButton
              type="submit"
              variant="primary"
              fullWidth
              className="h-14 mt-4"
            >
              ENTER WORKSPACE ↗
            </DecoButton>
          </form>

          <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-sans tracking-wider">
            <span className="text-[#888888]">NEW TO PLATFORM?</span>
            <button
              onClick={() => onNavigate('register')}
              className="text-[#D4AF37] hover:underline uppercase font-bold"
            >
              CREATE AN ACCOUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
