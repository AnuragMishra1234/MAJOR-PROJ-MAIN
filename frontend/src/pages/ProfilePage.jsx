import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';
import SectionHeading from '@/components/ui/SectionHeading';
import DecoCard from '@/components/ui/DecoCard';
import DecoButton from '@/components/ui/DecoButton';
import DecoInput from '@/components/ui/DecoInput';
import CornerBrackets from '@/components/ui/CornerBrackets';
import {
  User,
  Shield,
  Key,
  Cpu,
  Activity,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  LogOut,
  AlertCircle
} from 'lucide-react';

export default function ProfilePage({ onNavigate }) {
  const { user, updateProfile, updatePassword, logout } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'Full Stack AI Engineer');
  const [bio, setBio] = useState(user?.bio || 'Generative AI Developer & Prompt Engineer');
  const [preferredModel, setPreferredModel] = useState(user?.preferredModel || 'openai/gpt-oss-20b');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#D4AF37');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Feedback States
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Stats State
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    runningProjects: 0,
    failedProjects: 0,
    totalGenerations: 0,
    successRate: 100,
    recentProjects: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRole(user.role || 'Full Stack AI Engineer');
      setBio(user.bio || 'Generative AI Developer & Prompt Engineer');
      setPreferredModel(user.preferredModel || 'openai/gpt-oss-20b');
      setAvatarColor(user.avatarColor || '#D4AF37');
    }
  }, [user]);

  // Load User Stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await authService.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.warn('Failed to load user stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      await updateProfile({
        name,
        role,
        bio,
        preferredModel,
        avatarColor,
      });
      setProfileSuccess('Profile preferences updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      setPasswordSaving(false);
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Security credentials updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const initials = (name || user?.name || 'User')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Member Since 2026';

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-[#D4AF37]" />
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
              OPERATOR COMMAND PROFILE
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl text-[#F2F0E4] tracking-wider uppercase">
            User Credentials & Studio Settings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            disabled={statsLoading}
            className="flex items-center gap-1.5 font-sans text-xs tracking-widest uppercase text-[#888888] hover:text-[#D4AF37] border border-[#D4AF37]/20 px-3 py-2 bg-[#141414] transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw size={12} className={statsLoading ? 'animate-spin text-[#D4AF37]' : ''} />
            SYNC STATS
          </button>

          <DecoButton
            variant="secondary"
            onClick={() => onNavigate('workspace')}
            className="text-xs px-4 py-2"
          >
            WORKSPACE ↗
          </DecoButton>
        </div>
      </div>

      {/* ── User Hero Banner ────────────────────────────────────────────── */}
      <div className="relative bg-[#141414] border border-[#D4AF37]/35 p-6 sm:p-8 shadow-gold">
        <CornerBrackets />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar Badge */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-[#D4AF37] bg-[#0A0A0A] flex items-center justify-center shadow-gold-lg relative group shrink-0"
              style={{ borderColor: avatarColor }}
            >
              <div className="absolute inset-1 border border-[#D4AF37]/30" />
              <span className="font-display text-2xl sm:text-3xl text-[#D4AF37] font-bold tracking-wider">
                {initials}
              </span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4CAF50] border-2 border-[#0A0A0A] rotate-45" title="Online" />
            </div>

            {/* Identity Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-xl sm:text-2xl text-[#F2F0E4] uppercase tracking-wide">
                  {name || user?.name || 'Verified Operator'}
                </h2>
                <span className="font-sans text-[9px] tracking-[0.2em] uppercase bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 font-bold">
                  VERIFIED GENERATOR
                </span>
                <span className="font-sans text-[9px] tracking-[0.2em] uppercase bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/40 px-2 py-0.5">
                  PRO STUDIO
                </span>
              </div>

              <p className="font-sans text-xs text-[#888888] tracking-wider">
                {user?.email} · <span className="text-[#D4AF37]/80">{role}</span>
              </p>

              <p className="font-sans text-xs text-[#F2F0E4]/70 max-w-xl italic pt-1">
                "{bio}"
              </p>

              <div className="flex items-center gap-4 text-[11px] font-sans text-[#888888] pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-[#D4AF37]" /> Joined: {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu size={11} className="text-[#D4AF37]" /> Active Engine: <strong className="text-[#D4AF37] font-mono">{preferredModel}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#D4AF37]/15 pt-4 md:pt-0 md:pl-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="font-sans text-xs tracking-widest uppercase text-[#F2F0E4]/70 hover:text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2 bg-[#0A0A0A] transition-colors flex items-center justify-between gap-2"
            >
              <span>DASHBOARD</span>
              <ArrowRight size={12} />
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="font-sans text-xs tracking-widest uppercase text-[#F2F0E4]/70 hover:text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2 bg-[#0A0A0A] transition-colors flex items-center justify-between gap-2"
            >
              <span>HISTORY LOGS</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Real-time Analytics & Stats Grid ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DecoCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">
              PROJECTS BUILT
            </span>
            <Layers size={15} className="text-[#D4AF37]" />
          </div>
          <div className="font-display text-3xl sm:text-4xl text-[#F2F0E4] font-bold">
            {stats.totalProjects}
          </div>
          <p className="font-sans text-[10px] text-[#888888] mt-2">
            {stats.completedProjects} successfully deployed
          </p>
        </DecoCard>

        <DecoCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">
              COMPLETED PIPELINES
            </span>
            <CheckCircle size={15} className="text-[#4CAF50]" />
          </div>
          <div className="font-display text-3xl sm:text-4xl text-[#4CAF50] font-bold">
            {stats.completedProjects}
          </div>
          <p className="font-sans text-[10px] text-[#888888] mt-2">
            Auto-healed & validated
          </p>
        </DecoCard>

        <DecoCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">
              SYSTEM SUCCESS RATE
            </span>
            <Activity size={15} className="text-[#D4AF37]" />
          </div>
          <div className="font-display text-3xl sm:text-4xl text-[#D4AF37] font-bold">
            {stats.successRate}%
          </div>
          <p className="font-sans text-[10px] text-[#888888] mt-2">
            Across all task runners
          </p>
        </DecoCard>

        <DecoCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">
              AI ARTIFACTS
            </span>
            <Zap size={15} className="text-[#D4AF37]" />
          </div>
          <div className="font-display text-3xl sm:text-4xl text-[#F2F0E4] font-bold">
            {stats.totalGenerations}
          </div>
          <p className="font-sans text-[10px] text-[#888888] mt-2">
            Code, Web, & Text runs
          </p>
        </DecoCard>
      </div>

      {/* ── Two Column Forms: Profile Settings & Security ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings Form */}
        <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 sm:p-8 space-y-6 relative">
          <CornerBrackets />
          <div className="flex items-center gap-2 border-b border-[#D4AF37]/20 pb-3">
            <User size={16} className="text-[#D4AF37]" />
            <h3 className="font-display text-lg text-[#F2F0E4] uppercase tracking-wider">
              Profile Configuration
            </h3>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-[#4CAF50]/10 border border-[#4CAF50]/40 flex items-center gap-2 text-xs font-sans text-[#4CAF50]">
              <CheckCircle size={14} className="shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-[#EF5350]/10 border border-[#EF5350]/40 flex items-center gap-2 text-xs font-sans text-[#EF5350]">
              <AlertCircle size={14} className="shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <DecoInput
              label="OPERATOR FULL NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anurag Mishra"
              required
            />

            <DecoInput
              label="SPECIALIZATION / ROLE TITLE"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Principal AI Engineer / Creative Director"
            />

            <DecoInput
              label="BIO & DIRECTIVE SUMMARY"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio describing your domain or AI goals"
              rows={3}
            />

            <div className="space-y-2">
              <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37]">
                PREFERRED AI MODEL ENGINE
              </label>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="w-full bg-[#0A0A0A] border-b-2 border-[#D4AF37] py-2.5 px-3 font-mono text-xs text-[#F2F0E4] focus:outline-none focus:border-[#F2E8C4] rounded-none"
              >
                <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (High-Speed Production Default)</option>
                <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b (Deep Reasoning & Complex Planning)</option>
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Multi-task Versatile)</option>
                <option value="groq/compound-mini">groq/compound-mini (Compound Specialized)</option>
              </select>
            </div>

            <div className="pt-2">
              <DecoButton
                type="submit"
                variant="primary"
                disabled={profileSaving}
                className="w-full h-11 text-xs"
              >
                {profileSaving ? 'SAVING CHANGES...' : 'SAVE PROFILE PREFERENCES'}
              </DecoButton>
            </div>
          </form>
        </div>

        {/* Security & Password Form */}
        <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 sm:p-8 space-y-6 relative flex flex-col justify-between">
          <CornerBrackets />
          <div>
            <div className="flex items-center gap-2 border-b border-[#D4AF37]/20 pb-3 mb-6">
              <Key size={16} className="text-[#D4AF37]" />
              <h3 className="font-display text-lg text-[#F2F0E4] uppercase tracking-wider">
                Security & Authentication
              </h3>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-[#4CAF50]/10 border border-[#4CAF50]/40 flex items-center gap-2 text-xs font-sans text-[#4CAF50] mb-4">
                <CheckCircle size={14} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-[#EF5350]/10 border border-[#EF5350]/40 flex items-center gap-2 text-xs font-sans text-[#EF5350] mb-4">
                <AlertCircle size={14} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <DecoInput
                label="CURRENT PASSWORD"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />

              <DecoInput
                label="NEW PASSWORD (MIN 6 CHARS)"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                required
              />

              <DecoInput
                label="CONFIRM NEW PASSWORD"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />

              <div className="pt-2">
                <DecoButton
                  type="submit"
                  variant="secondary"
                  disabled={passwordSaving}
                  className="w-full h-11 text-xs"
                >
                  {passwordSaving ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD'}
                </DecoButton>
              </div>
            </form>
          </div>

          <div className="border-t border-[#D4AF37]/15 pt-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-xs font-bold text-[#EF5350] uppercase tracking-wider">
                  SESSION CONTROL
                </p>
                <p className="font-sans text-[11px] text-[#888888]">
                  Sign out from all active studio devices
                </p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  onNavigate('landing');
                }}
                className="flex items-center gap-1.5 font-sans text-xs tracking-wider uppercase text-[#EF5350] hover:text-[#EF5350]/80 border border-[#EF5350]/30 px-4 py-2 bg-[#0A0A0A] transition-colors"
              >
                <LogOut size={12} />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Projects Quick Access ─────────────────────────────────── */}
      {stats.recentProjects && stats.recentProjects.length > 0 && (
        <div className="bg-[#141414] border border-[#D4AF37]/20 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
            <span className="font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37]">
              RECENT STUDIO ARTIFACTS
            </span>
            <button
              onClick={() => onNavigate('dashboard')}
              className="font-sans text-xs tracking-wider uppercase text-[#888888] hover:text-[#D4AF37] transition-colors"
            >
              VIEW ALL PROJECTS ↗
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {stats.recentProjects.slice(0, 3).map((proj) => (
              <div
                key={proj.id || proj._id}
                onClick={() => onNavigate('workspace', { projectId: proj.id || proj._id, goal: proj.prompt, projectTitle: proj.title })}
                className="p-4 bg-[#0A0A0A] border border-[#D4AF37]/15 hover:border-[#D4AF37] transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-sans text-[9px] tracking-widest uppercase px-2 py-0.5 border ${
                    proj.status === 'completed'
                      ? 'border-[#4CAF50]/40 text-[#4CAF50] bg-[#4CAF50]/10'
                      : proj.status === 'running'
                      ? 'border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-[#888888]/40 text-[#888888]'
                  }`}>
                    {proj.status || 'PENDING'}
                  </span>
                  <span className="font-mono text-[9px] text-[#888888]">
                    {proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <h4 className="font-display text-sm text-[#F2F0E4] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                  {proj.title}
                </h4>
                <p className="font-sans text-[11px] text-[#888888] line-clamp-2">
                  {proj.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}