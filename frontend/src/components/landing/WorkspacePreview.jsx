import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import DecoButton from '../ui/DecoButton';
import DiamondIcon from '../ui/DiamondIcon';

/**
 * Landing Page Section VII — WORKSPACE PREVIEW
 */
export default function WorkspacePreview({ onNavigate }) {
  return (
    <section className="py-28 px-6 bg-[#141414] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          numeral="VII"
          title="ONE WORKSPACE. EVERYTHING IN PLACE."
          subtitle="A complete architectural workspace designed specifically for autonomous workflow orchestration."
        />

        {/* Large Workspace Mockup Exhibit */}
        <div className="border-2 border-[#D4AF37] p-2 bg-[#0A0A0A] shadow-gold-lg">
          <div className="border border-[#D4AF37]/30 bg-[#141414] p-6 md:p-10 space-y-8">
            {/* Top Workspace Header Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-4">
                <DiamondIcon size="md">◈</DiamondIcon>
                <div>
                  <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">
                    PROJECT WORKSPACE
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">
                    ECOCAMPUS LAUNCH
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#D4AF37] rotate-45 animate-pulse" />
                <span className="font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] px-4 py-1.5 border border-[#D4AF37]/40 bg-[#0A0A0A]">
                  STATUS: ORCHESTRATION ACTIVE
                </span>
                <DecoButton
                  variant="primary"
                  onClick={() => onNavigate('workspace')}
                  className="h-10 text-[11px] px-4"
                >
                  ENTER WORKSPACE ↗
                </DecoButton>
              </div>
            </div>

            {/* User Goal Display */}
            <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-5">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] block mb-2">
                USER GOAL INTENT
              </span>
              <p className="font-sans text-sm text-[#F2F0E4] tracking-wide italic">
                "Create a launch package for an eco-friendly campus startup."
              </p>
            </div>

            {/* Main Workspace 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Workflow Stages */}
              <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 space-y-4">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-4 pb-2 border-b border-[#D4AF37]/20">
                  WORKFLOW PIPELINE
                </p>

                {[
                  { num: 'I', name: 'UNDERSTANDING', status: '✓', color: 'text-[#D4AF37]' },
                  { num: 'II', name: 'PLANNING', status: '✓', color: 'text-[#D4AF37]' },
                  { num: 'III', name: 'CONTENT GENERATION', status: '✓', color: 'text-[#D4AF37]' },
                  { num: 'IV', name: 'WEBSITE GENERATION', status: '⟳', color: 'text-[#F2F0E4] animate-spin' },
                  { num: 'V', name: 'VALIDATION', status: '○', color: 'text-[#888888]' },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-[#D4AF37]/20 bg-[#141414] font-sans text-xs tracking-wider"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[#D4AF37] font-bold">{s.num}</span>
                      <span className="text-[#F2F0E4]">{s.name}</span>
                    </div>
                    <span className={`font-bold ${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>

              {/* Right Column: Output Artifacts Preview */}
              <div className="lg:col-span-2 bg-[#0A0A0A] border border-[#D4AF37]/30 p-6">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-4 pb-2 border-b border-[#D4AF37]/20">
                  GENERATED OUTPUT ASSETS
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: 'Business Content', type: 'DOCUMENT', status: 'READY' },
                    { title: 'Website UI App', type: 'INTERACTIVE', status: 'COMPILING' },
                    { title: 'Source Code', type: 'REACT + TAILWIND', status: 'READY' },
                  ].map((asset, idx) => (
                    <div
                      key={idx}
                      className="bg-[#141414] border border-[#D4AF37]/30 p-4 space-y-2 text-left"
                    >
                      <span className="font-sans text-[9px] tracking-widest text-[#D4AF37] block">
                        {asset.type}
                      </span>
                      <h4 className="font-display text-sm uppercase tracking-wider text-[#F2F0E4] font-bold">
                        {asset.title}
                      </h4>
                      <span className="font-sans text-[9px] tracking-widest text-[#888888] block pt-2 border-t border-[#D4AF37]/10">
                        STATUS: {asset.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
