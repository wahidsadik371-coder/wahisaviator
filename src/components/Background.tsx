// Ambient animated background: parallax starfield + soft nebula glows.
// Performance-aware (respects settings). Pure decoration, pointer-events none.
//
// FIX: Now uses the shared useCanvasAnimation hook for centralized rAF +
// ResizeObserver + visibilitychange + AbortController cleanup. The previous
// implementation listened to window.resize directly (no debounce) which
// thrashed on drag-resize, and never paused when the tab was hidden.

import { useEffect, useRef } from "react";

import { useGameStore } from "@/store/useGameStore";
import { useCanvasAnimation } from "@/hooks";

interface Star {
  x: number;
  y: number;
  z: number;
  tw: number;
  tws: number;
}

function makeStars(n: number): Star[] {
  const arr: Star[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
      tw: Math.random() * Math.PI * 2,
      tws: 0.4 + Math.random() * 1.6,
    });
  }
  return arr;
}

export function Background() {
  const perfMode = useGameStore((s) => s.settings.performanceMode);
  const showParticles = useGameStore((s) => s.settings.showParticles);
  const settingsRef = useRef({ perfMode, showParticles });
  settingsRef.current = { perfMode, showParticles };

  const { canvasRef, ctx, size, setFrame } = useCanvasAnimation({
    scaleToDpr: false, // full-viewport decorative canvas; raw pixels are fine
    maxDpr: 1,
    pauseWhenHidden: true,
    observeCanvas: false, // track window size, not canvas element size
  });

  const stateRef = useRef({
    stars: makeStars(170),
    shoot: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
  });

  useEffect(() => {
    if (!ctx) return;

    setFrame((dt) => {
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      const { perfMode: perf, showParticles: particles } = settingsRef.current;
      const { stars, shoot } = stateRef.current;

      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.tw += (s.tws * dt) / 1000;
        s.y += (s.z * 0.012 * dt) / 16;
        if (s.y > 1) {
          s.y = 0;
          s.x = Math.random();
        }
        const px = s.x * w;
        const py = s.y * h;
        const alpha = perf
          ? 0.5
          : 0.35 + Math.sin(s.tw) * 0.3 * s.z + 0.35;
        const sz = s.z * 1.7;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        if (!perf && s.z > 0.6) {
          ctx.shadowBlur = sz * 3;
          ctx.shadowColor = "rgba(180,200,255,0.8)";
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = "#cfe1ff";
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (particles && !perf) {
        if (Math.random() < 0.012 && shoot.length < 2) {
          shoot.push({
            x: Math.random() * w,
            y: -20,
            vx: (Math.random() - 0.5) * 3,
            vy: 4 + Math.random() * 4,
            life: 1,
          });
        }
        for (let i = shoot.length - 1; i >= 0; i--) {
          const sh = shoot[i];
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life -= dt / 1400;
          if (sh.life <= 0 || sh.y > h + 30) {
            shoot.splice(i, 1);
            continue;
          }
          const grad = ctx.createLinearGradient(
            sh.x,
            sh.y,
            sh.x - sh.vx * 8,
            sh.y - sh.vy * 8
          );
          grad.addColorStop(0, `rgba(200,220,255,${sh.life})`);
          grad.addColorStop(1, "rgba(200,220,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - sh.vx * 8, sh.y - sh.vy * 8);
          ctx.stroke();
        }
      }
    });
  }, [ctx, size, setFrame]);

  return (
    <div
      className="clip-both pointer-events-none fixed inset-0 -z-10"
      style={{ overflow: "clip" }}
    >
      {/* Nebula glows — decorative, positioned beyond viewport edges.
          overflow: clip on the parent ensures they don't contribute
          to document.scrollWidth on mobile browsers. */}
      <div className="absolute -left-40 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="absolute right-[-15%] top-[20%] h-[38rem] w-[38rem] rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[25%] h-[40rem] w-[40rem] rounded-full bg-fuchsia-600/15 blur-[130px]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    </div>
  );
}
