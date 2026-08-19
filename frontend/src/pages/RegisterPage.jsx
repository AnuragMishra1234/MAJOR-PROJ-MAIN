import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DecoInput from '../components/ui/DecoInput';
import DecoButton from '../components/ui/DecoButton';
import DiamondIcon from '../components/ui/DiamondIcon';
import GoldDivider from '../components/ui/GoldDivider';
import { Loader, AlertCircle } from 'lucide-react';

/**
 * Page — REGISTER
 *
 * Calls authService.register() (mock or real based on VITE_USE_MOCK).
 * On success: navigates to dashboard.
 * On failure: shows error message inline.
 */
export default function RegisterPage({ onNavigate }) {
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-20 px-6 bg-sunburst">
      <div className="w-full max-w-md border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg">
        <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 sm:p-10 text-center">
          <DiamondIcon size="md" className="mx-auto mb-6">✦</DiamondIcon>

          <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block mb-2">
            REGISTRATION PROTOCOL
          </span>
          <h2 className="font-display text-3xl uppercase tracking-[0.2em] text-[#F2F0E4] mb-2">
            BEGIN YOUR WORKFLOW
          </h2>
          <p className="font-sans text-xs text-[#888888] tracking-widest uppercase mb-4">
            CREATE YOUR AI OPERATOR ACCOUNT
          </p>

          <GoldDivider />

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-[#EF5350]/10 border border-[#EF5350]/30 p-3 text-left">
              <AlertCircle size={14} className="text-[#EF5350] shrink-0" />
              <p className="font-sans text-xs text-[#EF5350]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left mt-6">
            <DecoInput
              label="FULL NAME"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alexander Gatsby"
            />
            <DecoInput
              label="EMAIL ADDRESS"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gatsby@domain.com"
            />
            <DecoInput
              label="SECURITY PASSWORD"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
            <DecoInput
              label="CONFIRM PASSWORD"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
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
                  <Loader size={14} className="animate-spin" />CREATING ACCOUNT…
                </span>
              ) : (
                'CREATE ACCOUNT ↗'
              )}
            </DecoButton>
          </form>

          <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-sans tracking-wider">
            <span className="text-[#888888]">EXISTING MEMBER?</span>
            <button
              onClick={() => onNavigate('login')}
              className="text-[#D4AF37] hover:underline uppercase font-bold"
            >
              SIGN IN INSTEAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
