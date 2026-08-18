import React, { useState } from 'react';
import DecoFrame from '../ui/DecoFrame';
import DecoButton from '../ui/DecoButton';

/**
 * Workspace Component — OUTPUT VIEWER
 */
export default function OutputViewer({ projectGoal }) {
  const [activeTab, setActiveTab] = useState('WEBSITE'); // 'OVERVIEW' | 'TEXT' | 'WEBSITE' | 'CODE' | 'DOCUMENTS'

  const tabs = ['OVERVIEW', 'TEXT', 'WEBSITE', 'CODE', 'DOCUMENTS'];

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
        <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">
          III. OUTPUT ARTIFACT VIEWER
        </span>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all ${
                activeTab === tab
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0A0A0A] font-bold shadow-gold'
                  : 'bg-[#0A0A0A] border-[#D4AF37]/30 text-[#888888] hover:border-[#D4AF37] hover:text-[#F2F0E4]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 text-left">
          <h4 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4]">
            PROJECT OUTPUT SUMMARY
          </h4>
          <p className="font-sans text-xs text-[#888888] leading-relaxed">
            All 4 synthesized project deliverables (Narrative Text, Interactive Web UI App, Clean React Code, Architectural Spec) are cataloged and synchronized.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-4">
              <span className="font-sans text-[10px] tracking-widest text-[#D4AF37] block mb-1">ASSET I</span>
              <p className="font-display text-sm text-[#F2F0E4] font-bold">Launch Executive Brief</p>
              <span className="font-sans text-[10px] text-[#888888]">1,420 Words • Ready</span>
            </div>
            <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-4">
              <span className="font-sans text-[10px] tracking-widest text-[#D4AF37] block mb-1">ASSET II</span>
              <p className="font-display text-sm text-[#F2F0E4] font-bold">Interactive Web Portal</p>
              <span className="font-sans text-[10px] text-[#888888]">React + Tailwind • Ready</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TEXT' && (
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 space-y-4 text-left font-sans text-xs leading-relaxed text-[#F2F0E4]/90 max-h-96 overflow-y-auto">
          <h4 className="font-display text-xl uppercase tracking-wider text-[#D4AF37]">
            ECOCAMPUS LAUNCH BRIEF & STRATEGY
          </h4>
          <p className="text-[#888888]">
            Generative AI for Everyone — Autonomous Executive Briefing
          </p>
          <hr className="border-[#D4AF37]/20" />
          <p>
            <strong>Executive Vision:</strong> EcoCampus transforms modern university infrastructure by integrating autonomous solar microgrids, zero-emissions campus transit, and closed-loop waste analytics into a single intelligent platform.
          </p>
          <p>
            <strong>Target Milestones:</strong> Deploy pilot microgrids across 5 flagship universities, onboard 12,000 student energy ambassadors, and achieve 40% net carbon reduction in Year 1.
          </p>
        </div>
      )}

      {activeTab === 'WEBSITE' && (
        <DecoFrame>
          {/* Mock Browser URL Bar */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D4AF37]" />
              <div className="w-2 h-2 bg-[#D4AF37]/60" />
              <div className="w-2 h-2 bg-[#D4AF37]/30" />
            </div>
            <div className="font-sans text-[11px] tracking-wider text-[#D4AF37] bg-[#141414] px-4 py-1 border border-[#D4AF37]/30">
              https://ecocampus-app.ai-generated.org
            </div>
            <span className="font-sans text-[9px] tracking-widest text-[#888888]">LIVE RENDER</span>
          </div>

          {/* Interactive Web Preview Canvas */}
          <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-8 text-center space-y-4">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">
              ECOCAMPUS INITIATIVE
            </span>
            <h3 className="font-display text-3xl uppercase tracking-widest text-[#F2F0E4]">
              SUSTAINABLE CAMPUS PLATFORM
            </h3>
            <p className="font-sans text-xs text-[#888888] max-w-md mx-auto leading-relaxed">
              Real-time solar telemetry, carbon footprint analytics, and student sustainability rewards.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto pt-2">
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-3">
                <span className="font-display text-xl text-[#D4AF37] block">98%</span>
                <span className="font-sans text-[9px] text-[#888888]">SOLAR EFFICIENCY</span>
              </div>
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-3">
                <span className="font-display text-xl text-[#D4AF37] block">4.2T</span>
                <span className="font-sans text-[9px] text-[#888888]">CO2 OFFSET</span>
              </div>
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-3">
                <span className="font-display text-xl text-[#D4AF37] block">12K</span>
                <span className="font-sans text-[9px] text-[#888888]">STUDENTS ACTIVE</span>
              </div>
            </div>
          </div>
        </DecoFrame>
      )}

      {activeTab === 'CODE' && (
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 text-left font-mono text-xs text-[#F2F0E4]/90 space-y-2 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D4AF37]/20 font-sans text-xs">
            <span className="text-[#D4AF37]">EcoCampusApp.jsx</span>
            <span className="text-[#888888]">SYNTHESIZED REACT CODE</span>
          </div>
          <pre className="text-[#D4AF37]/80">
            {`import React, { useState } from 'react';

export default function EcoCampusApp() {
  const [telemetry, setTelemetry] = useState({ solarEfficiency: 98, co2Offset: 4.2 });

  return (
    <div className="bg-[#0A0A0A] text-[#F2F0E4] p-8 border border-[#D4AF37]">
      <h1 className="font-display text-3xl">EcoCampus Platform</h1>
      <p className="text-sm text-[#888888]">Efficiency: {telemetry.solarEfficiency}%</p>
    </div>
  );
}`}
          </pre>
        </div>
      )}

      {activeTab === 'DOCUMENTS' && (
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 text-left space-y-3 font-sans text-xs text-[#888888]">
          <h4 className="font-display text-lg text-[#F2F0E4] tracking-widest">
            ARCHITECTURAL SPECIFICATION SPEC-2026.MD
          </h4>
          <p>
            • System Architecture: Autonomous DAG Workflow Orchestration Engine v1.4<br />
            • Validation Checks: AST Syntax Evaluation, Null Safety Verification, Component Render Tests<br />
            • Auto-Healing Policy: Sub-25ms failure recovery and patch injection logic active.
          </p>
        </div>
      )}
    </div>
  );
}
