import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useScroll } from 'framer-motion';
import SpatialHUD from './SpatialHUD';
import StoryOverlay from './StoryOverlay';

const TOTAL_FRAMES = 192;

function padNum(n) {
  return String(n + 1).padStart(5, '0');
}

export default function AIStoryScroll({ onOpenWorkspace }) {
  const outerRef  = useRef(null);
  const canvasRef = useRef(null);
  const frames    = useRef([]);
  const rafId     = useRef(null);
  const curFrame  = useRef(0);
  const tgtFrame  = useRef(0);

  const [pct,   setPct]   = useState(0);
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  /* ── size canvas to match physical screen pixels ── */
  const sizeCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    c.width        = Math.round(W * dpr);
    c.height       = Math.round(H * dpr);
    c.style.width  = W + 'px';
    c.style.height = H + 'px';
  }, []);

  /* ── draw one frame ── */
  const draw = useCallback((idx) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const W   = c.width;
    const H   = c.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, W, H);

    // nearest loaded frame fallback
    let img = frames.current[idx];
    if (!img?.complete || !img?.naturalWidth) {
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        const a = frames.current[idx - d];
        const b = frames.current[idx + d];
        if (a?.complete && a?.naturalWidth) { img = a; break; }
        if (b?.complete && b?.naturalWidth) { img = b; break; }
      }
    }
    if (!img?.complete || !img?.naturalWidth) return;

    // object-cover — fills entire canvas
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth  * scale;
    const dh = img.naturalHeight * scale;
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, dw, dh);

    // ── Erase watermark corner & place left/right technical tags ──
    const pad  = 14 * dpr;
    const bw   = 130 * dpr;
    const bh   = 26 * dpr;
    const bx   = W - bw - pad;
    const by   = H - bh - pad;

    ctx.fillStyle = 'rgba(10,10,10,0.85)';
    ctx.fillRect(bx, by, bw, bh);

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(bx, by, bw, 1 * dpr);

    ctx.font = `${Math.round(8 * dpr)}px "Josefin Sans", sans-serif`;
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI WORKSPACE // V1.0', bx + bw / 2, by + bh / 2);
  }, []);

  /* ── preload all frames once ── */
  useEffect(() => {
    sizeCanvas();
    const arr = new Array(TOTAL_FRAMES);
    let n = 0;
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const im = new Image();
      im.onload = () => {
        n++;
        setPct(Math.round((n / TOTAL_FRAMES) * 100));
        if (n >= 5) setReady(true);
        if (i === 0) draw(0);
      };
      im.onerror = () => { n++; };
      im.src = `/KB-FRAMES/${padNum(i)}.png`;
      arr[i] = im;
    }
    frames.current = arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── scroll tracking ── */
  useEffect(() => {
    const onScroll = () => {
      const el = outerRef.current;
      if (!el) return;

      const scrolled   = window.scrollY - el.offsetTop;
      const scrollable = el.offsetHeight - window.innerHeight;

      if (scrollable <= 0) return;

      const progress = Math.min(1, Math.max(0, scrolled / scrollable));
      tgtFrame.current = progress * (TOTAL_FRAMES - 1);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── RAF animation loop ── */
  useEffect(() => {
    const tick = () => {
      curFrame.current += (tgtFrame.current - curFrame.current) * 0.18;
      draw(Math.round(curFrame.current));
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── resize ── */
  useEffect(() => {
    const onResize = () => {
      sizeCanvas();
      draw(Math.round(curFrame.current));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '550vh',
        backgroundColor: '#0A0A0A',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#0A0A0A',
          marginLeft: 'calc(50% - 50vw)',
        }}
      >
        {/* 3D Canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
        />

        {/* Ambient Spatial HUD Telemetry */}
        <SpatialHUD
          currentFrame={Math.round(curFrame.current)}
          totalFrames={TOTAL_FRAMES}
          progress={tgtFrame.current / (TOTAL_FRAMES - 1)}
          loadedCount={TOTAL_FRAMES}
        />

        {/* Scrollytelling Story Overlay */}
        <StoryOverlay
          scrollYProgress={scrollYProgress}
          onOpenWorkspace={onOpenWorkspace}
          onExploreWorkspace={() => {
            const el = document.getElementById('architecture');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Preloader Overlay */}
        {!ready && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#0A0A0A', gap: 16,
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '2px solid rgba(212,175,55,0.15)',
                borderTopColor: '#D4AF37',
                animation: 'ai3d-spin 0.75s linear infinite',
              }}
            />
            <span
              style={{
                fontFamily: '"Josefin Sans", sans-serif',
                fontSize: 10, letterSpacing: '0.35em',
                textTransform: 'uppercase', color: '#D4AF37',
              }}
            >
              Loading Workspace Pipeline — {pct}%
            </span>
            <div style={{ width: 160, height: 1, background: 'rgba(212,175,55,0.15)' }}>
              <div
                style={{
                  width: `${pct}%`, height: '100%',
                  background: '#D4AF37', transition: 'width 0.1s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes ai3d-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
