import React, { useState } from 'react';
import SectionHeading from '../ui/SectionHeading';
import DecoCard from '../ui/DecoCard';
import DecoButton from '../ui/DecoButton';

/**
 * Landing Page Section VI — CREATION MEETS VALIDATION
 */
export default function ValidationSection() {
  const [healingState, setHealingState] = useState('FAILED'); // 'FAILED' | 'REPAIRING' | 'VALIDATED'

  const handleSimulateRepair = () => {
    setHealingState('REPAIRING');
    setTimeout(() => {
      setHealingState('VALIDATED');
    }, 1500);
  };

  return (
    <section className="py-28 px-6 bg-[#141414] border-b border-[#D4AF37]/30 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          numeral="VI"
          title="CREATION MEETS VALIDATION."
          subtitle="Every output undergoes automated execution and validation checks before final delivery."
        />

        {/* Validation Pipeline Exhibit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Failure State Card */}
          <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-8 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
              <span className="font-display text-lg text-[#D4AF37] tracking-widest">
                INITIAL ATTEMPT
              </span>
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 bg-red-950/40 border border-red-500/50 text-red-400 font-bold">
                ✕ FAILED
              </span>
            </div>

            <h4 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3">
              BUILD ERROR DETECTED
            </h4>
            <p className="font-sans text-xs text-[#888888] leading-relaxed mb-6 font-mono bg-[#141414] p-4 border border-red-500/20">
              TypeError: Cannot read properties of undefined (reading 'map')
              <br />
              at Component.render (bundle.js:142:18)
            </p>

            <div className="font-sans text-xs tracking-wider text-[#888888]">
              Flow: <span className="text-[#F2F0E4]">GENERATE</span> → <span className="text-[#F2F0E4]">EXECUTE</span> → <span className="text-red-400 font-bold">VALIDATE (FAIL)</span>
            </div>
          </div>

          {/* Interactive Healing Demo Card */}
          <div className="bg-[#0A0A0A] border border-[#D4AF37] p-8 shadow-gold relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
              <span className="font-display text-lg text-[#D4AF37] tracking-widest">
                AUTO-HEALING RESPONSE
              </span>
              <span
                className={`font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 border font-bold ${
                  healingState === 'VALIDATED'
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                    : healingState === 'REPAIRING'
                    ? 'bg-[#1E3D59]/60 border-[#1E3D59] text-[#F2F0E4] animate-pulse'
                    : 'bg-[#141414] border-[#D4AF37]/40 text-[#888888]'
                }`}
              >
                {healingState === 'VALIDATED'
                  ? '✓ VALIDATED'
                  : healingState === 'REPAIRING'
                  ? '⟳ REPAIRING...'
                  : 'REPAIR READY'}
              </span>
            </div>

            <h4 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3">
              ANALYZE → REPAIR → REGENERATE
            </h4>

            {healingState === 'VALIDATED' ? (
              <p className="font-sans text-xs text-[#D4AF37] leading-relaxed mb-6 font-mono bg-[#141414] p-4 border border-[#D4AF37]/40">
                [AUTO-HEAL SUCCESS]: Optional chaining applied. Null safety verified. AST check passed 100%.
              </p>
            ) : (
              <p className="font-sans text-xs text-[#888888] leading-relaxed mb-6 font-mono bg-[#141414] p-4 border border-[#D4AF37]/20">
                Patch instruction: Insert optional chaining operator (?.) and fallback empty array default state.
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="font-sans text-xs tracking-wider text-[#888888]">
                Final State:{' '}
                <span className="text-[#D4AF37] font-bold">
                  {healingState === 'VALIDATED' ? '✓ 100% COMPLIANT' : 'AWAITING REPAIR'}
                </span>
              </div>

              {healingState !== 'VALIDATED' && (
                <DecoButton
                  variant="primary"
                  onClick={handleSimulateRepair}
                  disabled={healingState === 'REPAIRING'}
                  className="h-10 text-[11px] px-4"
                >
                  SIMULATE REPAIR ↗
                </DecoButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
