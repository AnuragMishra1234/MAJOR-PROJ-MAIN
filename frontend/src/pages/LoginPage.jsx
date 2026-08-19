import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DecoInput from '../components/ui/DecoInput';
import DecoButton from '../components/ui/DecoButton';
import DiamondIcon from '../components/ui/DiamondIcon';
import GoldDivider from '../components/ui/GoldDivider';
import { Loader, AlertCircle } from 'lucide-react';

/**
 * Page — LOGIN
 *
 * Calls authService.login() (mock or real based on VITE_USE_MOCK).
 * On success: navigates to dashboard.
 * On failure: shows error message inline.
 */
export default function LoginPage({ onNavigate }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-20 px-6 bg-sunburst">
      <div className="w-full max-w-md border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg">
        <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 sm:p-10 text-center">
          <DiamondIcon size="md" className="mx-auto mb-6">❖</DiamondIcon>

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

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-[#EF5350]/10 border border-[#EF5350]/30 p-3 text-left">
              <AlertCircle size={14} className="text-[#EF5350] shrink-0" />
              <p className="font-sans text-xs text-[#EF5350]">{error}</p>
            </div>
          )}

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
              disabled={loading}
              className="h-14 mt-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader size={14} className="animate-spin" />SIGNING IN…
                </span>
              ) : (
                'ENTER WORKSPACE ↗'
              )}
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
