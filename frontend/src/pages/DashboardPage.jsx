import React, { useState } from 'react';
import DecoCard from '../components/ui/DecoCard';
import DecoButton from '../components/ui/DecoButton';
import DiamondIcon from '../components/ui/DiamondIcon';
import SectionHeading from '../components/ui/SectionHeading';
import DecoInput from '../components/ui/DecoInput';

/**
 * Page 4 — MAIN APPLICATION DASHBOARD
 */
export default function DashboardPage({ onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [newProjectGoal, setNewProjectGoal] = useState('');

  const projects = [
    {
      id: 'proj-1',
      title: 'ECOCAMPUS LAUNCH',
      goal: 'Create a launch package for an eco-friendly campus startup.',
      status: 'ACTIVE',
      tasks: '03 / 05',
      updated: '2 MINS AGO',
      icon: '◈',
    },
    {
      id: 'proj-2',
      title: 'AI PRODUCT CONCEPT',
      goal: 'Synthesize pitch brief, landing page, and code for new SaaS tool.',
      status: 'COMPLETED',
      tasks: '07 / 07',
      updated: '1 DAY AGO',
      icon: '✓',
    },
    {
      id: 'proj-3',
      title: 'SMART AGRICULTURE SUITE',
      goal: 'Generate crop telemetry website, code hooks, and market analysis.',
      status: 'DRAFT',
      tasks: '00 / 04',
      updated: '3 DAYS AGO',
      icon: '✦',
    },
    {
      id: 'proj-4',
      title: 'QUANTUM FLEET ENGINE',
      goal: 'Formulate logistics optimization workflow and reactive dashboard.',
      status: 'ACTIVE',
      tasks: '04 / 06',
      updated: '5 HOURS AGO',
      icon: '❖',
    },
  ];

  const recentActivity = [
    { text: 'Auto-Healing patched null pointer exception in EcoCampus Website UI.', time: '10 mins ago', numeral: 'I' },
    { text: 'AI Generation Engine compiled React code bundle for AI Product Concept.', time: '1 hour ago', numeral: 'II' },
    { text: 'Validation engine approved AST checks for Quantum Fleet Engine.', time: '3 hours ago', numeral: 'III' },
  ];

  const handleCreateProject = (e) => {
    e.preventDefault();
    setShowModal(false);
    onNavigate('workspace');
  };

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto space-y-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b-2 border-[#D4AF37]/30">
        <div>
          <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] block mb-2">
            CONTROL DASHBOARD MATRIX
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4]">
            GENERATIVE AI <span className="text-[#D4AF37]">FOR EVERYONE</span>
          </h1>
        </div>

        <DecoButton
          variant="primary"
          onClick={() => setShowModal(true)}
          className="h-14 px-8 text-xs whitespace-nowrap"
        >
          + NEW PROJECT ↗
        </DecoButton>
      </div>

      {/* Main Grid: Projects & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left 2 Cols: Projects Matrix */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">
              ACTIVE PROJECTS
            </h2>
            <span className="font-sans text-xs tracking-widest text-[#D4AF37]">
              04 TOTAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <DecoCard
                key={proj.id}
                onClick={() => onNavigate('workspace')}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/20">
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 border border-[#D4AF37]/40 text-[#D4AF37]">
                      STATUS: {proj.status}
                    </span>
                    <DiamondIcon size="sm">{proj.icon}</DiamondIcon>
                  </div>

                  <h3 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3 group-hover:text-[#D4AF37] transition-colors">
                    {proj.title}
                  </h3>

                  <p className="font-sans text-xs text-[#888888] line-clamp-2 leading-relaxed mb-6">
                    "{proj.goal}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-[11px] font-sans tracking-wider text-[#888888]">
                  <span>TASKS: <strong className="text-[#F2F0E4]">{proj.tasks}</strong></span>
                  <span>UPDATED: {proj.updated}</span>
                </div>
              </DecoCard>
            ))}
          </div>
        </div>

        {/* Right Col: Activity Feed & Telemetry */}
        <div className="space-y-8">
          <h2 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">
            RECENT ACTIVITY
          </h2>

          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
            {recentActivity.map((act, idx) => (
              <div
                key={idx}
                className="pb-5 border-b border-[#D4AF37]/20 last:border-b-0 last:pb-0 flex items-start gap-4"
              >
                <DiamondIcon size="sm" className="shrink-0 mt-1">
                  <span className="font-display text-[10px]">{act.numeral}</span>
                </DiamondIcon>
                <div className="space-y-1">
                  <p className="font-sans text-xs text-[#F2F0E4] leading-relaxed">
                    {act.text}
                  </p>
                  <span className="font-sans text-[10px] tracking-widest text-[#888888] block">
                    {act.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Launcher Card */}
          <div className="bg-[#0A0A0A] border-2 border-[#D4AF37] p-6 text-center space-y-4 shadow-gold">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
              ORCHESTRATION ENGINE
            </span>
            <h3 className="font-display text-xl uppercase tracking-wider text-[#F2F0E4]">
              LAUNCH WORKSPACE
            </h3>
            <p className="font-sans text-xs text-[#888888]">
              Ready to input a new high-level objective into the multi-agent DAG pipeline?
            </p>
            <DecoButton
              variant="primary"
              fullWidth
              onClick={() => onNavigate('workspace')}
              className="h-12 text-[11px]"
            >
              OPEN AI WORKSPACE ↗
            </DecoButton>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg">
            <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 relative space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
                <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">
                  CREATE NEW PROJECT
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#D4AF37] hover:text-[#F2E8C4] text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <DecoInput
                  label="HIGH-LEVEL PROJECT GOAL"
                  rows={4}
                  required
                  value={newProjectGoal}
                  onChange={(e) => setNewProjectGoal(e.target.value)}
                  placeholder="Describe what you want to create (e.g., Launch an eco-friendly campus startup app with pitch content and web UI...)"
                />

                <div className="flex justify-end gap-4 pt-4">
                  <DecoButton
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    className="h-12"
                  >
                    CANCEL
                  </DecoButton>
                  <DecoButton type="submit" variant="primary" className="h-12">
                    START ORCHESTRATION ↗
                  </DecoButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
