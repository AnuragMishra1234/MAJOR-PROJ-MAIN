"use client";

import React, { useState } from "react";

/* ─── ART DECO ICON WRAPPER (45-DEGREE ROTATED DIAMOND) ─────────── */
function DecoDiamondIcon({ children, size = "md" }: { children: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size] || sizeClasses.md}`}>
      <div className="absolute inset-0 border border-[#D4AF37] rotate-45 bg-[#141414] shadow-gold transition-all duration-500 hover:rotate-90 hover:scale-110" />
      <div className="relative z-10 text-[#D4AF37] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ─── ART DECO CORNER BRACKETS ───────────────────────────────────── */
function CornerBrackets() {
  return (
    <>
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors" />
    </>
  );
}

/* ─── ART DECO CARD ──────────────────────────────────────────────── */
function DecoCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#141414] p-8 border border-[#D4AF37]/30 transition-all duration-500 hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-gold ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <CornerBrackets />
      {children}
    </div>
  );
}

/* ─── ART DECO BUTTON ────────────────────────────────────────────── */
function DecoButton({
  children,
  variant = "primary",
  onClick,
  type = "button",
  fullWidth = false,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const baseClasses =
    "inline-flex items-center justify-center h-12 px-8 font-sans text-xs tracking-[0.25em] uppercase font-semibold transition-all duration-300 focus:outline-none min-h-[48px] rounded-none";

  const variants = {
    primary:
      "bg-[#D4AF37] text-[#0A0A0A] border-2 border-[#D4AF37] shadow-gold hover:bg-[#F2E8C4] hover:border-[#F2E8C4] hover:shadow-gold-lg",
    secondary:
      "bg-transparent text-[#D4AF37] border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] hover:shadow-gold",
    ghost:
      "bg-transparent text-[#F2F0E4] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#D4AF37]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── ART DECO SECTION HEADING ───────────────────────────────────── */
function SectionHeading({
  numeral,
  title,
  subtitle,
}: {
  numeral?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-16 text-center">
      {numeral && (
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] mb-3">
          SECTION {numeral}
        </p>
      )}
      <h2 className="font-display text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4] mb-3 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="font-sans text-sm text-[#888888] max-w-xl mx-auto tracking-wider leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="w-32 h-px bg-[#D4AF37] mx-auto my-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-[#D4AF37] rotate-45 bg-[#0A0A0A]" />
      </div>
    </div>
  );
}

/**
 * GENERATIVE AI FOR EVERYONE — Master Next.js App Page
 */
export default function Page() {
  const [activePage, setActivePage] = useState<"landing" | "login" | "register" | "dashboard" | "workspace" | "history">("landing");
  const [heroStep, setHeroStep] = useState(0);
  const [healingDemo, setHealingDemo] = useState<"FAILED" | "REPAIRING" | "VALIDATED">("FAILED");
  
  // Workspace Live State
  const [wsGoal, setWsGoal] = useState("Create a launch package for an eco-friendly campus startup.");
  const [wsTab, setWsTab] = useState<"OVERVIEW" | "TEXT" | "WEBSITE" | "CODE" | "DOCUMENTS">("WEBSITE");
  const [wsIsHealing, setWsIsHealing] = useState(false);
  const [wsHealingStep, setWsHealingStep] = useState(-1);
  const [wsHasError, setWsHasError] = useState(true);

  const heroWorkflow = [
    { label: "IDEA", numeral: "I", desc: "Raw Human Intent" },
    { label: "AGENT", numeral: "II", desc: "Cognitive Parsing" },
    { label: "PLAN", numeral: "III", desc: "DAG Task Breakdown" },
    { label: "GENERATE", numeral: "IV", desc: "Multi-Asset Output" },
    { label: "VALIDATE", numeral: "V", desc: "AST & Runtime Checks" },
    { label: "HEAL", numeral: "VI", desc: "Self-Patching Loop" },
    { label: "RESULT", numeral: "VII", desc: "Verified Deployment" },
  ];

  const handleSimulateWorkspaceHealing = () => {
    setWsIsHealing(true);
    setWsHealingStep(0);
    const interval = setInterval(() => {
      setWsHealingStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setWsIsHealing(false);
          setWsHasError(false);
          return 5;
        }
        return prev + 1;
      });
    }, 600);
  };

  const navTo = (page: typeof activePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0E4] bg-artdeco-crosshatch selection:bg-[#D4AF37] selection:text-black">
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <button onClick={() => navTo("landing")} className="flex items-center gap-3 text-left group">
            <div className="w-5 h-5 border border-[#D4AF37] rotate-45 bg-[#D4AF37]/20 group-hover:rotate-90 group-hover:bg-[#D4AF37] transition-all duration-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#D4AF37] group-hover:bg-[#0A0A0A]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl tracking-[0.3em] uppercase text-[#D4AF37] group-hover:text-[#F2E8C4] transition-colors">
                GENERATIVE AI
              </span>
              <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#888888]">
                FOR EVERYONE
              </span>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-8 font-sans text-xs tracking-[0.2em] uppercase text-[#F2F0E4]/70">
            <button onClick={() => navTo("landing")} className={`hover:text-[#D4AF37] ${activePage === "landing" ? "text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1" : ""}`}>
              HOME
            </button>
            <a href="#how-it-works" onClick={() => activePage !== "landing" && navTo("landing")} className="hover:text-[#D4AF37]">
              HOW IT WORKS
            </a>
            <button onClick={() => navTo("dashboard")} className={`hover:text-[#D4AF37] ${activePage === "dashboard" ? "text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1" : ""}`}>
              DASHBOARD
            </button>
            <button onClick={() => navTo("history")} className={`hover:text-[#D4AF37] ${activePage === "history" ? "text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1" : ""}`}>
              HISTORY
            </button>
            <button onClick={() => navTo("workspace")} className={`hover:text-[#D4AF37] ${activePage === "workspace" ? "text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-1" : ""}`}>
              WORKSPACE
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => navTo("login")} className="hidden sm:inline-block font-sans text-xs tracking-[0.2em] uppercase text-[#F2F0E4]/80 hover:text-[#D4AF37]">
              LOGIN
            </button>
            <DecoButton variant="secondary" onClick={() => navTo("workspace")} className="text-xs px-5 py-2.5 h-10 min-h-[40px]">
              LAUNCH WORKSPACE ↗
            </DecoButton>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      </header>

      {/* ─────────────────────────────────────────────────────────────
          PAGE VIEW ROUTER
         ───────────────────────────────────────────────────────────── */}

      {/* ── 1. LANDING PAGE ── */}
      {activePage === "landing" && (
        <main className="w-full">
          {/* I. HERO */}
          <section className="relative py-24 md:py-36 px-6 bg-sunburst border-b border-[#D4AF37]/30 text-center">
            <div className="max-w-5xl mx-auto relative z-10">
              <div className="inline-flex items-center gap-4 px-6 py-2 border border-[#D4AF37]/40 bg-[#141414] mb-8 shadow-gold">
                <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37]">
                  ROMAN NUMERAL I — WORKFLOW ORCHESTRATION
                </span>
                <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
              </div>

              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl uppercase tracking-[0.25em] text-[#F2F0E4] leading-[1.1] mb-8">
                GENERATIVE AI <br />
                <span className="text-[#D4AF37] drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                  FOR EVERYONE
                </span>
              </h1>

              <p className="font-sans text-lg sm:text-xl text-[#888888] max-w-3xl mx-auto leading-relaxed mb-12 tracking-wide">
                Turn a high-level idea into a coordinated workflow of AI-generated, validated and refined outputs. Give AI the goal. Let AI handle the workflow.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 mb-20">
                <DecoButton variant="primary" onClick={() => navTo("workspace")} className="h-14 px-10 text-xs">
                  CREATE A PROJECT ↗
                </DecoButton>
                <a href="#how-it-works">
                  <DecoButton variant="secondary" className="h-14 px-10 text-xs">
                    EXPLORE THE WORKFLOW
                  </DecoButton>
                </a>
              </div>

              {/* Interactive Workflow Matrix */}
              <div className="border-2 border-[#D4AF37]/40 p-2 bg-[#0A0A0A] shadow-gold-lg">
                <div className="border border-[#D4AF37]/20 bg-[#141414] p-6 md:p-10">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-6">
                    THE AUTONOMOUS WORKFLOW MATRIX
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                    {heroWorkflow.map((step, idx) => (
                      <button
                        key={idx}
                        onClick={() => setHeroStep(idx)}
                        className={`p-4 border transition-all text-center ${
                          heroStep === idx
                            ? "border-[#D4AF37] bg-[#1E3D59]/40 shadow-gold scale-105"
                            : "border-[#D4AF37]/20 bg-[#0A0A0A] hover:border-[#D4AF37]/60"
                        }`}
                      >
                        <span className="font-display text-xs text-[#D4AF37] mb-1 block tracking-widest">{step.numeral}</span>
                        <span className="font-display text-sm tracking-wider text-[#F2F0E4] font-bold">{step.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-left">
                      <DecoDiamondIcon size="md">✦</DecoDiamondIcon>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-xs tracking-widest text-[#D4AF37]">STAGE {heroWorkflow[heroStep].numeral}</span>
                          <span className="text-[#888888] text-xs">•</span>
                          <span className="font-display text-lg text-[#F2F0E4] uppercase tracking-wider">{heroWorkflow[heroStep].label} PROTOCOL</span>
                        </div>
                        <p className="font-sans text-sm text-[#888888] mt-1">{heroWorkflow[heroStep].desc} — Autonomous orchestration loop.</p>
                      </div>
                    </div>
                    <DecoButton variant="ghost" onClick={() => navTo("workspace")} className="text-[11px] h-10 px-4 whitespace-nowrap">
                      SIMULATE IN WORKSPACE ↗
                    </DecoButton>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* II. WHY THIS EXISTS */}
          <section className="py-28 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30">
            <div className="max-w-6xl mx-auto">
              <SectionHeading numeral="II" title="AI SHOULD DO MORE THAN ANSWER." subtitle="Current workflows force humans to act as glue between fragmented AI models. We engineered a unified orchestration paradigm." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                {[
                  { num: "01", title: "FRAGMENTED TOOLING", desc: "Users constantly jump between isolated AI chat windows, code generators, and editors.", icon: "❖" },
                  { num: "02", title: "MANUAL RE-PROMPTING", desc: "Context is lost between steps, requiring endless rewriting of instructions.", icon: "◈" },
                  { num: "03", title: "UNTESTED OUTPUTS", desc: "Standard AI chatbots output hallucinated code with zero verification.", icon: "✦" },
                  { num: "04", title: "MANUAL ERROR FIXING", desc: "When generated code breaks, the user is left alone to debug and pray.", icon: "◆" },
                ].map((p, idx) => (
                  <DecoCard key={idx}>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
                      <span className="font-display text-xl text-[#D4AF37] tracking-widest font-light">EXHIBIT {p.num}</span>
                      <DecoDiamondIcon size="sm">{p.icon}</DecoDiamondIcon>
                    </div>
                    <h3 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3 group-hover:text-[#D4AF37] transition-colors">{p.title}</h3>
                    <p className="font-sans text-sm leading-relaxed text-[#888888]">{p.desc}</p>
                  </DecoCard>
                ))}
              </div>

              <div className="border-2 border-[#D4AF37] p-8 md:p-12 text-center bg-[#141414] shadow-gold-lg">
                <div className="inline-block px-4 py-1 border border-[#D4AF37]/40 bg-[#0A0A0A] font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-4">
                  THE PARADIGM SHIFT
                </div>
                <h3 className="font-display text-4xl md:text-6xl uppercase tracking-[0.25em] text-[#F2F0E4]">
                  ONE WORKSPACE. <span className="text-[#D4AF37]">ONE WORKFLOW.</span>
                </h3>
              </div>
            </div>
          </section>

          {/* III. HOW IT WORKS TIMELINE */}
          <section id="how-it-works" className="py-28 px-6 bg-[#141414] border-b border-[#D4AF37]/30">
            <div className="max-w-6xl mx-auto">
              <SectionHeading numeral="III" title="FROM INTENT TO EXECUTION." subtitle="An architectural timeline detailing how human intent transforms into verified multi-asset deliverables." />
              <div className="relative border-l-2 border-[#D4AF37]/30 ml-4 md:ml-32 space-y-12 my-16 pl-8 md:pl-12">
                {[
                  { num: "I", title: "UNDERSTAND", sub: "Intent Parsing", desc: "The Cognitive Engine analyzes your goal, extracting intent, constraints, and architecture." },
                  { num: "II", title: "PLAN", sub: "DAG Task Breakdown", desc: "Formulates a Directed Acyclic Graph of dependent tasks across content and code." },
                  { num: "III", title: "GENERATE", sub: "Synthesis Matrix", desc: "Dispatches neural generation agents to synthesize text, website UI, and modular code." },
                  { num: "IV", title: "EXECUTE", sub: "Runtime Compilation", desc: "Instantiates mock runtime environments and builds live preview viewports." },
                  { num: "V", title: "VALIDATE", sub: "Automated AST Check", desc: "Evaluates generated code against syntax checkers and quality boundary conditions." },
                  { num: "VI", title: "HEAL", sub: "Self-Patching Loop", desc: "Upon failure detection, isolates error tracebacks, generates patches, and re-validates." },
                  { num: "VII", title: "RESULT", sub: "Unified Workspace", desc: "Presents verified, production-ready deliverables in a centralized luxury workspace." },
                ].map((st, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[45px] md:-left-[61px] top-1">
                      <DecoDiamondIcon size="sm">
                        <span className="text-[10px] font-bold font-display">{st.num}</span>
                      </DecoDiamondIcon>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 md:p-8 transition-all hover:border-[#D4AF37] hover:shadow-gold">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-[#D4AF37]/20">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-xl text-[#D4AF37] tracking-widest">STAGE {st.num}</span>
                          <span className="font-sans text-xs tracking-[0.2em] uppercase text-[#D4AF37]/70">[{st.sub}]</span>
                        </div>
                      </div>
                      <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4] mb-3 group-hover:text-[#D4AF37] transition-colors">{st.title}</h3>
                      <p className="font-sans text-sm text-[#888888] leading-relaxed">{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* IV. AGENT EXHIBIT */}
          <section className="py-28 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30">
            <div className="max-w-6xl mx-auto">
              <SectionHeading numeral="IV" title="THE AGENT SETS THE STAGE." subtitle="The Agent interprets the user's goal and determines the work required to achieve it." />
              <div className="border-2 border-[#D4AF37]/50 p-2 shadow-gold bg-[#141414]">
                <div className="border border-[#D4AF37]/25 bg-[#0A0A0A] p-8 md:p-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 mb-8 border-b border-[#D4AF37]/20">
                    <div>
                      <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#D4AF37] block mb-2">PROJECT SPECIFICATION</span>
                      <h4 className="font-display text-3xl uppercase tracking-widest text-[#F2F0E4]">ECOCAMPUS LAUNCH</h4>
                    </div>
                    <div>
                      <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#D4AF37] block mb-2">USER GOAL INTENT</span>
                      <p className="font-sans text-sm text-[#888888] italic border-l-2 border-[#D4AF37] pl-4">&ldquo;Create a launch package for an eco-friendly campus startup.&rdquo;</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { num: "I", title: "BUSINESS CONTENT", status: "COMPLETE", col: "text-[#D4AF37] border-[#D4AF37]" },
                      { num: "II", title: "WEBSITE GENERATION", status: "RUNNING", col: "text-[#F2F0E4] border-[#F2F0E4] animate-pulse" },
                      { num: "III", title: "SUPPORTING CONTENT", status: "PENDING", col: "text-[#888888] border-[#888888]/40" },
                      { num: "IV", title: "VALIDATION", status: "PENDING", col: "text-[#888888] border-[#888888]/40" },
                    ].map((t, i) => (
                      <div key={i} className="bg-[#141414] border border-[#D4AF37]/30 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-display text-lg text-[#D4AF37]">{t.num}</span>
                          <span className="font-display text-base uppercase text-[#F2F0E4]">{t.title}</span>
                        </div>
                        <span className={`font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 border ${t.col}`}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* V. GENERATION EXHIBITS */}
          <section className="py-28 px-6 bg-[#141414] border-b border-[#D4AF37]/30">
            <div className="max-w-6xl mx-auto">
              <SectionHeading numeral="V" title="ONE GOAL. MULTIPLE OUTPUTS." subtitle="The AI Generation Engine produces complete, interconnected deliverables in parallel." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { num: "I", title: "TEXT CONTENT", type: "NARRATIVE & COPY", desc: "Strategic copy, pitch briefs, business press releases, and executive documentation.", icon: "✦" },
                  { num: "II", title: "WEBSITE APP", type: "INTERACTIVE UI", desc: "Full responsive Web UI components synthesized live with dynamic states.", icon: "❖" },
                  { num: "III", title: "SOURCE CODE", type: "ENGINEERING ASSETS", desc: "Clean, type-safe React, Tailwind, and JavaScript code ready to compile.", icon: "◈" },
                  { num: "IV", title: "DOCUMENTS", type: "STRUCTURED SPEC", desc: "Architectural specifications, API schemas, and verification reports.", icon: "◆" },
                ].map((out, idx) => (
                  <DecoCard key={idx}>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
                      <span className="font-display text-2xl text-[#D4AF37] tracking-widest">{out.num}</span>
                      <DecoDiamondIcon size="sm">{out.icon}</DecoDiamondIcon>
                    </div>
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]/70 block mb-2">{out.type}</span>
                    <h3 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4] mb-4 group-hover:text-[#D4AF37] transition-colors">{out.title}</h3>
                    <p className="font-sans text-sm text-[#888888] leading-relaxed">{out.desc}</p>
                  </DecoCard>
                ))}
              </div>
            </div>
          </section>

          {/* VI. VALIDATION & AUTO-HEALING */}
          <section className="py-28 px-6 bg-[#0A0A0A] border-b border-[#D4AF37]/30">
            <div className="max-w-6xl mx-auto">
              <SectionHeading numeral="VI" title="CREATION MEETS VALIDATION." subtitle="Every output undergoes automated execution and validation checks before final delivery." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-[#141414] border border-[#D4AF37]/30 p-8">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
                    <span className="font-display text-lg text-[#D4AF37] tracking-widest">INITIAL ATTEMPT</span>
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 bg-red-950/40 border border-red-500/50 text-red-400 font-bold">✕ FAILED</span>
                  </div>
                  <h4 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3">BUILD ERROR DETECTED</h4>
                  <p className="font-mono text-xs text-[#888888] bg-[#0A0A0A] p-4 border border-red-500/20 mb-6">
                    TypeError: Cannot read properties of undefined (reading &apos;map&apos;)
                  </p>
                  <div className="font-sans text-xs text-[#888888]">Flow: GENERATE → EXECUTE → <span className="text-red-400 font-bold">VALIDATE (FAIL)</span></div>
                </div>

                <div className="bg-[#141414] border border-[#D4AF37] p-8 shadow-gold">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4AF37]/20">
                    <span className="font-display text-lg text-[#D4AF37] tracking-widest">AUTO-HEALING RESPONSE</span>
                    <span className={`font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 border font-bold ${healingDemo === "VALIDATED" ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" : healingDemo === "REPAIRING" ? "bg-[#1E3D59] border-[#1E3D59] text-white animate-pulse" : "border-[#D4AF37]/40 text-[#888888]"}`}>
                      {healingDemo === "VALIDATED" ? "✓ VALIDATED" : healingDemo === "REPAIRING" ? "⟳ REPAIRING..." : "REPAIR READY"}
                    </span>
                  </div>
                  <h4 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3">ANALYZE → REPAIR → REGENERATE</h4>
                  <p className="font-mono text-xs text-[#D4AF37] bg-[#0A0A0A] p-4 border border-[#D4AF37]/40 mb-6">
                    {healingDemo === "VALIDATED" ? "[AUTO-HEAL SUCCESS]: Optional chaining applied. Null safety verified." : "Patch instruction: Apply optional chaining (?.) and default fallback empty array."}
                  </p>
                  {healingDemo !== "VALIDATED" && (
                    <DecoButton variant="primary" onClick={() => { setHealingDemo("REPAIRING"); setTimeout(() => setHealingDemo("VALIDATED"), 1500); }} className="h-10 text-[11px] px-4">
                      SIMULATE REPAIR ↗
                    </DecoButton>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* VII. WORKSPACE PREVIEW & VIII. FINAL CTA */}
          <section className="py-32 px-6 bg-sunburst text-center">
            <div className="max-w-4xl mx-auto border-2 border-[#D4AF37] p-8 md:p-16 bg-[#141414] shadow-gold-lg">
              <div className="inline-flex items-center gap-4 px-6 py-2 border border-[#D4AF37]/40 bg-[#0A0A0A] mb-8">
                <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37]">ROMAN NUMERAL VIII — GENESIS PROTOCOL</span>
                <span className="w-2 h-2 bg-[#D4AF37] rotate-45" />
              </div>
              <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-[0.25em] text-[#F2F0E4] mb-6">
                YOUR IDEA <span className="text-[#D4AF37]">IS ENOUGH.</span>
              </h2>
              <p className="font-sans text-lg text-[#888888] max-w-lg mx-auto mb-10 leading-relaxed">
                Describe what you want to create. Let AI handle the coordination.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <DecoButton variant="primary" onClick={() => navTo("workspace")} className="h-14 px-10 text-xs">CREATE A PROJECT ↗</DecoButton>
                <DecoButton variant="secondary" onClick={() => navTo("workspace")} className="h-14 px-10 text-xs">LAUNCH WORKSPACE</DecoButton>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ── 2. LOGIN PAGE ── */}
      {activePage === "login" && (
        <div className="min-h-[85vh] flex items-center justify-center py-20 px-6 bg-sunburst">
          <div className="w-full max-w-md border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg">
            <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 sm:p-10 text-center">
              <div className="flex justify-center mb-6"><DecoDiamondIcon size="md">❖</DecoDiamondIcon></div>
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block mb-2">MEMBER PROTOCOL</span>
              <h2 className="font-display text-3xl uppercase tracking-[0.2em] text-[#F2F0E4] mb-2">WELCOME BACK</h2>
              <p className="font-sans text-xs text-[#888888] tracking-widest uppercase mb-6">ENTER THE WORKSPACE</p>

              <form onSubmit={(e) => { e.preventDefault(); navTo("dashboard"); }} className="space-y-6 text-left">
                <div>
                  <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-2">EMAIL ADDRESS</label>
                  <input type="email" required placeholder="operator@domain.com" className="w-full artdeco-input py-2 text-base text-[#F2F0E4]" />
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-2">SECURITY PASSWORD</label>
                  <input type="password" required placeholder="••••••••••••" className="w-full artdeco-input py-2 text-base text-[#F2F0E4]" />
                </div>
                <DecoButton type="submit" variant="primary" fullWidth className="h-14 mt-4">ENTER WORKSPACE ↗</DecoButton>
              </form>
              <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-sans">
                <span className="text-[#888888]">NEW TO PLATFORM?</span>
                <button onClick={() => navTo("register")} className="text-[#D4AF37] hover:underline uppercase font-bold">CREATE AN ACCOUNT</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. REGISTER PAGE ── */}
      {activePage === "register" && (
        <div className="min-h-[85vh] flex items-center justify-center py-20 px-6 bg-sunburst">
          <div className="w-full max-w-md border-2 border-[#D4AF37] p-2 bg-[#141414] shadow-gold-lg">
            <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 sm:p-10 text-center">
              <div className="flex justify-center mb-6"><DecoDiamondIcon size="md">✦</DecoDiamondIcon></div>
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block mb-2">REGISTRATION PROTOCOL</span>
              <h2 className="font-display text-3xl uppercase tracking-[0.2em] text-[#F2F0E4] mb-2">BEGIN YOUR WORKFLOW</h2>
              <p className="font-sans text-xs text-[#888888] tracking-widest uppercase mb-6">CREATE OPERATOR ACCOUNT</p>

              <form onSubmit={(e) => { e.preventDefault(); navTo("dashboard"); }} className="space-y-4 text-left">
                <div>
                  <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-1">FULL NAME</label>
                  <input type="text" required placeholder="Alexander Gatsby" className="w-full artdeco-input py-2 text-base text-[#F2F0E4]" />
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-1">EMAIL ADDRESS</label>
                  <input type="email" required placeholder="gatsby@domain.com" className="w-full artdeco-input py-2 text-base text-[#F2F0E4]" />
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-1">SECURITY PASSWORD</label>
                  <input type="password" required placeholder="••••••••••••" className="w-full artdeco-input py-2 text-base text-[#F2F0E4]" />
                </div>
                <DecoButton type="submit" variant="primary" fullWidth className="h-14 mt-4">CREATE ACCOUNT ↗</DecoButton>
              </form>
              <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-sans">
                <span className="text-[#888888]">EXISTING MEMBER?</span>
                <button onClick={() => navTo("login")} className="text-[#D4AF37] hover:underline uppercase font-bold">ALREADY HAVE ACCOUNT?</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. DASHBOARD PAGE ── */}
      {activePage === "dashboard" && (
        <div className="py-16 px-6 max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b-2 border-[#D4AF37]/30">
            <div>
              <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] block mb-2">CONTROL DASHBOARD MATRIX</span>
              <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4]">
                GENERATIVE AI <span className="text-[#D4AF37]">FOR EVERYONE</span>
              </h1>
            </div>
            <DecoButton variant="primary" onClick={() => navTo("workspace")} className="h-14 px-8 text-xs">
              + NEW PROJECT ↗
            </DecoButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <h2 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">ACTIVE PROJECTS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "ECOCAMPUS LAUNCH", goal: "Launch package for eco-friendly campus startup.", status: "ACTIVE", tasks: "03 / 05" },
                  { title: "AI PRODUCT CONCEPT", goal: "Pitch brief, landing page, and code for new SaaS.", status: "COMPLETED", tasks: "07 / 07" },
                  { title: "SMART AGRICULTURE SUITE", goal: "Crop telemetry website, code hooks, and brief.", status: "DRAFT", tasks: "00 / 04" },
                  { title: "QUANTUM FLEET ENGINE", goal: "Logistics optimization and reactive dashboard.", status: "ACTIVE", tasks: "04 / 06" },
                ].map((p, idx) => (
                  <DecoCard key={idx} onClick={() => navTo("workspace")}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/20">
                      <span className="font-sans text-[10px] tracking-[0.25em] uppercase px-3 py-1 border border-[#D4AF37]/40 text-[#D4AF37]">STATUS: {p.status}</span>
                      <DecoDiamondIcon size="sm">◈</DecoDiamondIcon>
                    </div>
                    <h3 className="font-display text-xl uppercase tracking-widest text-[#F2F0E4] mb-3 group-hover:text-[#D4AF37] transition-colors">{p.title}</h3>
                    <p className="font-sans text-xs text-[#888888] mb-6">&ldquo;{p.goal}&rdquo;</p>
                    <div className="pt-4 border-t border-[#D4AF37]/20 text-xs text-[#888888]">TASKS: <strong className="text-[#F2F0E4]">{p.tasks}</strong></div>
                  </DecoCard>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="font-display text-2xl uppercase tracking-widest text-[#F2F0E4]">RECENT ACTIVITY</h2>
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
                {[
                  "Auto-Healing patched null pointer exception in EcoCampus Website UI.",
                  "AI Generation Engine compiled React code bundle for AI Product Concept.",
                  "Validation engine approved AST checks for Quantum Fleet Engine.",
                ].map((act, i) => (
                  <div key={i} className="pb-4 border-b border-[#D4AF37]/20 last:border-b-0 flex items-start gap-4">
                    <DecoDiamondIcon size="sm">❖</DecoDiamondIcon>
                    <p className="font-sans text-xs text-[#F2F0E4]">{act}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. AI WORKSPACE PAGE ── */}
      {activePage === "workspace" && (
        <div className="py-8 px-6 max-w-7xl mx-auto space-y-8">
          <div className="bg-[#141414] border-2 border-[#D4AF37] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-gold">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-[#D4AF37] rotate-45 animate-pulse" />
              <div>
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">AUTONOMOUS AI WORKSPACE</span>
                <h1 className="font-display text-3xl uppercase tracking-widest text-[#F2F0E4]">ECOCAMPUS LAUNCH</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-sans text-xs tracking-widest uppercase px-4 py-1.5 border border-[#D4AF37]/40 bg-[#0A0A0A] text-[#D4AF37]">
                ORCHESTRATION: {wsIsHealing ? "AUTO-HEALING..." : "ACTIVE"}
              </span>
              <DecoButton variant="primary" onClick={() => handleSimulateWorkspaceHealing()} className="h-10 text-[11px] px-5">
                START WORKFLOW ↗
              </DecoButton>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-4">
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] block">PROJECT INTENT & OBJECTIVE</span>
            <div className="flex flex-col md:flex-row items-end gap-4">
              <textarea rows={2} value={wsGoal} onChange={(e) => setWsGoal(e.target.value)} className="w-full artdeco-input py-2 text-base text-[#F2F0E4] resize-none" />
              <DecoButton variant="primary" onClick={handleSimulateWorkspaceHealing} className="h-14 px-8 whitespace-nowrap shrink-0">
                ORCHESTRATE ↗
              </DecoButton>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-8">
              {/* Workflow Pipeline */}
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-3">
                <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37] block mb-2">I. WORKFLOW PIPELINE</span>
                {[
                  { num: "I", name: "UNDERSTAND", status: "COMPLETE" },
                  { num: "II", name: "PLAN", status: "COMPLETE" },
                  { num: "III", name: "GENERATE", status: "RUNNING" },
                  { num: "IV", name: "EXECUTE", status: "PENDING" },
                  { num: "V", name: "VALIDATE", status: wsHasError ? "FAILED" : "COMPLETE" },
                  { num: "VI", name: "HEAL", status: wsIsHealing ? "RUNNING" : wsHasError ? "PENDING" : "COMPLETE" },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-[#D4AF37]/20 bg-[#0A0A0A]">
                    <span className="font-display text-sm text-[#D4AF37]">{s.num} {s.name}</span>
                    <span className={`font-sans text-[9px] uppercase px-2 py-0.5 border ${s.status === "COMPLETE" ? "text-[#D4AF37] border-[#D4AF37]" : s.status === "FAILED" ? "text-red-400 border-red-500/50" : "text-[#888888] border-[#888888]/40"}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              {/* Output Viewer */}
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-[#D4AF37]/20">
                  <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">OUTPUT ARTIFACT VIEWER</span>
                  <div className="flex gap-2">
                    {(["OVERVIEW", "TEXT", "WEBSITE", "CODE", "DOCUMENTS"] as const).map((t) => (
                      <button key={t} onClick={() => setWsTab(t)} className={`font-sans text-[10px] tracking-wider uppercase px-3 py-1 border ${wsTab === t ? "bg-[#D4AF37] text-black font-bold border-[#D4AF37]" : "border-[#D4AF37]/30 text-[#888888]"}`}>{t}</button>
                    ))}
                  </div>
                </div>

                {wsTab === "WEBSITE" && (
                  <div className="border-2 border-[#D4AF37]/50 p-2 shadow-gold bg-[#0A0A0A]">
                    <div className="border border-[#D4AF37]/30 bg-[#141414] p-6 text-center space-y-4">
                      <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] block">ECOCAMPUS LIVE APP</span>
                      <h3 className="font-display text-3xl uppercase tracking-widest text-[#F2F0E4]">SUSTAINABLE CAMPUS PLATFORM</h3>
                      <p className="font-sans text-xs text-[#888888] max-w-md mx-auto">Real-time solar telemetry and student sustainability incentives.</p>
                    </div>
                  </div>
                )}
                {wsTab === "TEXT" && (
                  <div className="bg-[#0A0A0A] p-6 border border-[#D4AF37]/30 font-sans text-xs text-[#F2F0E4] leading-relaxed">
                    <h4 className="font-display text-lg text-[#D4AF37] mb-2">ECOCAMPUS LAUNCH BRIEF</h4>
                    <p>EcoCampus empowers flagship universities with autonomous solar microgrid tracking and carbon footprint analytics.</p>
                  </div>
                )}
                {wsTab === "CODE" && (
                  <pre className="bg-[#0A0A0A] p-6 border border-[#D4AF37]/30 font-mono text-xs text-[#D4AF37]">
                    {`export default function EcoCampus() {\n  return <div className="bg-obsidian text-champagne p-6">EcoCampus App</div>;\n}`}
                  </pre>
                )}
                {wsTab === "OVERVIEW" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0A0A0A] p-4 border border-[#D4AF37]/30"><p className="font-display text-sm text-[#D4AF37]">Executive Brief</p><span className="text-xs text-[#888888]">1,420 words</span></div>
                    <div className="bg-[#0A0A0A] p-4 border border-[#D4AF37]/30"><p className="font-display text-sm text-[#D4AF37]">Interactive App</p><span className="text-xs text-[#888888]">React + Tailwind</span></div>
                  </div>
                )}
                {wsTab === "DOCUMENTS" && (
                  <div className="bg-[#0A0A0A] p-6 border border-[#D4AF37]/30 font-sans text-xs text-[#888888]">
                    <h4 className="font-display text-base text-[#F2F0E4] mb-2">SYSTEM SPECIFICATION SPEC-2026.MD</h4>
                    <p>Validation Checks: AST Syntax Evaluation, Null Safety Verification active.</p>
                  </div>
                )}
              </div>

              {/* Auto-Healing Interactive Bar */}
              <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-xs tracking-[0.3em] uppercase text-[#D4AF37]">AUTO-HEALING PROTOCOL</span>
                  <button onClick={handleSimulateWorkspaceHealing} className="text-xs font-sans uppercase px-3 py-1 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black">
                    {wsIsHealing ? "HEALING ACTIVE..." : "SIMULATE AUTO-HEAL ↗"}
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {["ERROR", "ANALYZE", "REPAIR", "RETRY", "VALIDATE", "SUCCESS"].map((s, i) => (
                    <div key={i} className={`p-2 border text-center font-sans text-[10px] uppercase font-bold ${wsHealingStep === i ? "border-[#D4AF37] bg-[#1E3D59] text-white" : wsHealingStep > i ? "border-[#D4AF37]/50 text-[#D4AF37]" : "border-[#D4AF37]/20 text-[#888888]/50"}`}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. HISTORY PAGE ── */}
      {activePage === "history" && (
        <div className="py-16 px-6 max-w-7xl mx-auto space-y-12">
          <div className="flex justify-between items-center pb-8 border-b-2 border-[#D4AF37]/30">
            <div>
              <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] block mb-2">ARCHIVAL CATALOGUE</span>
              <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4]">PROJECT HISTORY <span className="text-[#D4AF37]">LOGS</span></h1>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 md:p-8 space-y-4">
            {[
              { id: "HIST-01", title: "ECOCAMPUS LAUNCH", goal: "Launch package for eco-friendly campus startup.", status: "ACTIVE", col: "text-[#D4AF37] border-[#D4AF37]" },
              { id: "HIST-02", title: "AI PRODUCT CONCEPT", goal: "Landing page, copy, and React application.", status: "COMPLETED", col: "text-[#F2F0E4] border-[#F2F0E4]" },
              { id: "HIST-03", title: "SMART AGRICULTURE SUITE", goal: "Crop telemetry dashboard and API hooks.", status: "FAILED", col: "text-red-400 border-red-500/50" },
              { id: "HIST-04", title: "QUANTUM FLEET ENGINE", goal: "Logistics DAG optimization matrix.", status: "ACTIVE", col: "text-[#D4AF37] border-[#D4AF37]" },
            ].map((item) => (
              <div key={item.id} className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-5 flex items-center justify-between">
                <div>
                  <span className="font-display text-sm text-[#D4AF37]">{item.id}</span>
                  <h4 className="font-display text-base uppercase text-[#F2F0E4]">{item.title}</h4>
                  <p className="font-sans text-xs text-[#888888]">&ldquo;{item.goal}&rdquo;</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-sans text-[10px] tracking-wider uppercase px-3 py-1 border font-bold ${item.col}`}>{item.status}</span>
                  <DecoButton variant="ghost" onClick={() => navTo("workspace")} className="h-9 text-[10px] px-3">OPEN ↗</DecoButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-[#0A0A0A] border-t-2 border-[#D4AF37]/30 py-16 px-6 sm:px-12 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border border-[#D4AF37] rotate-45 bg-[#D4AF37]" />
            <span className="font-display text-xl tracking-[0.3em] uppercase text-[#D4AF37]">
              GENERATIVE AI FOR EVERYONE
            </span>
          </div>
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-[#888888]">
            Autonomous AI Workflow Platform — MCMXXV / MMXXV
          </p>
        </div>
      </footer>
    </div>
  );
}
