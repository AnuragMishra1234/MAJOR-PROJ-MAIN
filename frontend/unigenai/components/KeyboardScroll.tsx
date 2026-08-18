"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import { useScroll, useTransform } from "framer-motion";

/* ─── CONFIGURATION ──────────────────────────────────────────────── */
const TOTAL_FRAMES = 192;
const BG_COLOR = "#ECECEC";           // Fog background matching 3D frames
const SCROLL_MULTIPLIER = 4;          // Depth of 3D scroll scrubbing

function frameUrl(n: number) {
  const idx = String(n).padStart(5, "0");
  return `/frames/${idx}.png`;
}

/* ─── PURE 3D KEYBOARD SCROLL COMPONENT (NO OVERLAYS) ─────────────── */
export default function KeyboardScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  /* ── Scroll tracking ─────────────────────────────────────────── */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, TOTAL_FRAMES - 1]
  );

  /* ── Image preloading ────────────────────────────────────────── */
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let completed = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i);
      img.onload = () => {
        completed++;
        setLoaded(Math.round((completed / TOTAL_FRAMES) * 100));
        if (completed === TOTAL_FRAMES) setReady(true);
      };
      img.onerror = () => {
        completed++;
        setLoaded(Math.round((completed / TOTAL_FRAMES) * 100));
        if (completed === TOTAL_FRAMES) setReady(true);
      };
      images.push(img);
    }
    imagesRef.current = images;
    return () => {
      images.forEach((img) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
      });
    };
  }, []);

  /* ── Canvas draw (CONTAIN FIT & Full viewport) ────────────────── */
  const drawFrame = useCallback((idx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear background with exact frame fog color
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    // CONTAIN fit — absolute precision, centered, never cropped
    const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (W - drawW) / 2;
    const dy = (H - drawH) / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);
  }, []);

  /* ── Smooth 60fps RAF loop ────────────────────────────────────── */
  useEffect(() => {
    const loop = () => {
      const idx = Math.round(frameRef.current);
      drawFrame(Math.max(0, Math.min(idx, TOTAL_FRAMES - 1)));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame]);

  /* ── Sync scroll position to frame index ─────────────────────── */
  useEffect(() => {
    const unsub = frameIndex.on("change", (v) => {
      frameRef.current = v;
    });
    return unsub;
  }, [frameIndex]);

  /* ── Responsive canvas sizing ────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(Math.round(frameRef.current));
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawFrame]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${SCROLL_MULTIPLIER * 100}vh` }}
      className="relative w-full bg-[#ECECEC]"
    >
      {/* ── Preloader ─────────────────────────────────────────── */}
      {!ready && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ECECEC] text-black">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border border-black/10" />
            <div
              className="absolute inset-0 w-16 h-16 rounded-full border border-black/70"
              style={{
                clipPath: `inset(0 ${100 - loaded}% 0 0 round 9999px)`,
                transition: "clip-path 0.2s ease",
              }}
            />
          </div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-black/50 font-sans">
            Calibrating 3D Assembly — {loaded}%
          </p>
        </div>
      )}

      {/* ── Sticky 100vh Container: PURE 3D VISUAL ONLY (NO OVERLAYS) ──── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: "100vw", height: "100vh" }}
        />
        {/* Seamless transition gradient fading fog tone into obsidian black */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
