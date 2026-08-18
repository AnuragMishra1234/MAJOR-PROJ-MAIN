import React from 'react';
import { motion, useTransform } from 'framer-motion';

/**
 * StoryOverlay
 * Editorial scrollytelling text moments.
 */
export default function StoryOverlay({
  scrollYProgress,
  onOpenWorkspace,
  onExploreWorkspace,
}) {
  const createOpacityTransform = (enterStart, enterPeak, exitStart, exitEnd) => {
    return useTransform(
      scrollYProgress,
      [enterStart, enterPeak, exitStart, exitEnd],
      [0, 1, 1, 0]
    );
  };

  const createYTransform = (enterStart, enterPeak, exitStart, exitEnd) => {
    return useTransform(
      scrollYProgress,
      [enterStart, enterPeak, exitStart, exitEnd],
      [16, 0, 0, -16]
    );
  };

  // 0% — STORY 01 — OPENING (0.00 - 0.13)
  const beat1Opacity = useTransform(scrollYProgress, [0.0, 0.04, 0.09, 0.13], [1, 1, 0.85, 0]);
  const beat1Y = useTransform(scrollYProgress, [0.0, 0.04, 0.09, 0.13], [0, 0, -8, -20]);

  // 20% — STORY 02 — AGENT (0.16 - 0.32)
  const beat2Opacity = createOpacityTransform(0.16, 0.20, 0.29, 0.33);
  const beat2Y = createYTransform(0.16, 0.20, 0.29, 0.33);

  // 40% — STORY 03 — WORKFLOW (0.35 - 0.49)
  const beat3Opacity = createOpacityTransform(0.35, 0.40, 0.47, 0.51);
  const beat3Y = createYTransform(0.35, 0.40, 0.47, 0.51);

  // 55% — STORY 04 — GENERATION (0.52 - 0.64)
  const beat4Opacity = createOpacityTransform(0.52, 0.56, 0.62, 0.66);
  const beat4Y = createYTransform(0.52, 0.56, 0.62, 0.66);

  // 70% — STORY 05 — VALIDATION (0.67 - 0.78)
  const beat5Opacity = createOpacityTransform(0.67, 0.71, 0.77, 0.81);
  const beat5Y = createYTransform(0.67, 0.71, 0.77, 0.81);

  // 85% — STORY 06 — AUTO-HEALING (0.80 - 0.90)
  const beat6Opacity = createOpacityTransform(0.80, 0.84, 0.88, 0.92);
  const beat6Y = createYTransform(0.80, 0.84, 0.88, 0.92);

  // 95% — FINAL STORY (0.93 - 1.00)
  const beat7Opacity = useTransform(scrollYProgress, [0.93, 0.96, 1.0], [0, 1, 1]);
  const beat7Y = useTransform(scrollYProgress, [0.93, 0.96, 1.0], [20, 0, 0]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* ----------------------------------------------
          STORY 01 — OPENING (Centered)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat1Opacity, y: beat1Y }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
      >
        <div className="text-[10px] font-mono tracking-widest text-[#141414]/45 uppercase mb-3">
          01 // THE IDEA
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-[#141414]/90 max-w-3xl leading-[1.08]">
          Generative AI for Everyone.
        </h1>
        <p className="mt-4 sm:mt-5 text-sm sm:text-lg md:text-xl text-[#141414]/60 font-normal tracking-tight max-w-md">
          One idea. One workspace. Multiple outputs.
        </p>
        <div className="mt-8 flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-[#141414]/40 uppercase">
          <span>Scroll to explore</span>
          <span>↓</span>
        </div>
      </motion.div>

      {/* ----------------------------------------------
          STORY 02 — AGENT (Right: 6-8vw)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat2Opacity, y: beat2Y }}
        className="absolute top-1/2 -translate-y-1/2 right-[6vw] sm:right-[8vw] max-w-[360px] sm:max-w-[420px] text-left"
      >
        <div className="text-[10px] font-mono tracking-widest text-[#141414]/45 uppercase mb-2">
          02 // INTELLIGENCE
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#141414]/90 leading-[1.12]">
          From intent to action.
        </h2>
        <p className="mt-3 text-xs sm:text-base text-[#141414]/60 font-normal leading-relaxed tracking-tight">
          The Agent understands your goal and plans the work.
        </p>
        <div className="mt-4 flex flex-col items-start gap-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-[10px] font-mono tracking-wider text-[#141414]/75 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/80" />
            <span>AGENT / PLANNER</span>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-[#141414]/60 uppercase pl-1">
            UNDERSTAND & PLAN
          </span>
        </div>
      </motion.div>

      {/* ----------------------------------------------
          STORY 03 — WORKFLOW (Left: 6-8vw)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat3Opacity, y: beat3Y }}
        className="absolute top-1/2 -translate-y-1/2 left-[6vw] sm:left-[8vw] max-w-[360px] sm:max-w-[420px] text-left"
      >
        <div className="text-[10px] font-mono tracking-widest text-[#141414]/45 uppercase mb-2">
          03 // ORCHESTRATION
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#141414]/90 leading-[1.12]">
          From idea to workflow.
        </h2>
        <p className="mt-3 text-xs sm:text-base text-[#141414]/60 font-normal leading-relaxed tracking-tight">
          Break complex goals into coordinated tasks and execute them in sequence.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono tracking-wider text-[#141414]/70 uppercase">
          <span className="px-2.5 py-1 rounded-md bg-white/40 border border-white/50">PLANNER</span>
          <span className="text-[#141414]/30">→</span>
          <span className="px-2.5 py-1 rounded-md bg-white/40 border border-white/50">WORKFLOW ENGINE</span>
          <span className="text-[#141414]/30">→</span>
          <span className="px-2.5 py-1 rounded-md bg-white/40 border border-white/50">TASKS</span>
        </div>
      </motion.div>

      {/* ----------------------------------------------
          STORY 04 — GENERATION (Right: 6-8vw)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat4Opacity, y: beat4Y }}
        className="absolute top-1/2 -translate-y-1/2 right-[6vw] sm:right-[8vw] max-w-[360px] sm:max-w-[420px] text-left"
      >
        <div className="text-[10px] font-mono tracking-widest text-[#141414]/45 uppercase mb-2">
          04 // GENERATION
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#141414]/90 leading-[1.12]">
          One workflow. <br />
          Multiple outputs.
        </h2>
        <p className="mt-3 text-xs sm:text-base text-[#141414]/60 font-normal leading-relaxed tracking-tight">
          Generate content, websites and code from a single goal.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-mono tracking-wider text-[#141414]/70 uppercase">
          <span className="px-2.5 py-1 rounded bg-white/40 border border-white/50">TEXT</span>
          <span className="px-2.5 py-1 rounded bg-white/40 border border-white/50">WEBSITE</span>
          <span className="px-2.5 py-1 rounded bg-white/40 border border-white/50">CODE</span>
        </div>
      </motion.div>

      {/* ----------------------------------------------
          STORY 05 — VALIDATION (Left: 6-8vw)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat5Opacity, y: beat5Y }}
        className="absolute top-1/2 -translate-y-1/2 left-[6vw] sm:left-[8vw] max-w-[360px] sm:max-w-[420px] text-left"
      >
        <div className="text-[10px] font-mono tracking-widest text-[#141414]/45 uppercase mb-2">
          05 // VALIDATION
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#141414]/90 leading-[1.12]">
          Generation is only half the job.
        </h2>
        <p className="mt-3 text-xs sm:text-base text-[#141414]/60 font-normal leading-relaxed tracking-tight">
          Execute and validate outputs before they reach you.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-[10px] font-mono tracking-wider text-[#141414]/75 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/80" />
          <span>EXECUTION / VALIDATION</span>
        </div>
      </motion.div>

      {/* ----------------------------------------------
          STORY 06 — AUTO-HEALING (Right: 6-8vw)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat6Opacity, y: beat6Y }}
        className="absolute top-1/2 -translate-y-1/2 right-[6vw] sm:right-[8vw] max-w-[360px] sm:max-w-[420px] text-left"
      >
        <div className="text-[10px] font-mono tracking-widest text-[#141414]/45 uppercase mb-2">
          06 // AUTO-HEALING
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#141414]/90 leading-[1.12]">
          When something breaks, it adapts.
        </h2>
        <p className="mt-3 text-xs sm:text-base text-[#141414]/60 font-normal leading-relaxed tracking-tight">
          Detect the failure, repair the task and try again.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] font-mono tracking-wider text-[#141414]/75 uppercase">
          <span className="px-2 py-0.5 rounded bg-white/40 border border-white/50">ERROR DETECTED</span>
          <span className="text-[#141414]/30">→</span>
          <span className="px-2 py-0.5 rounded bg-white/40 border border-white/50">REPAIR</span>
          <span className="text-[#141414]/30">→</span>
          <span className="px-2 py-0.5 rounded bg-white/40 border border-white/50">RETRY</span>
          <span className="text-[#141414]/30">→</span>
          <span className="px-2 py-0.5 rounded bg-white/40 border border-white/50 text-emerald-950 font-medium">SUCCESS</span>
        </div>
      </motion.div>

      {/* ----------------------------------------------
          FINAL STORY (Centered)
      ---------------------------------------------- */}
      <motion.div
        style={{ opacity: beat7Opacity, y: beat7Y }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-auto"
      >
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#141414]/90 max-w-2xl leading-[1.1]">
          Your idea is enough.
        </h2>
        <p className="mt-4 text-sm sm:text-lg text-[#141414]/60 font-normal tracking-tight max-w-md">
          Let AI handle the coordination.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenWorkspace}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#141414] hover:bg-black text-[#F2F0E4] font-medium text-xs sm:text-sm tracking-wider uppercase shadow-gold transition-all duration-200 active:scale-95"
          >
            <span>Create a Project ↗</span>
          </button>
        </div>
        <p className="mt-6 text-[10px] font-mono tracking-[0.25em] text-[#141414]/50 uppercase">
          GENERATIVE AI FOR EVERYONE
        </p>
      </motion.div>
    </div>
  );
}
