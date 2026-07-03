// Confetti burst canvas, triggered by store confettiToken on big wins.
// Respects the animations / particles settings.
//
// FIX: Now uses the shared useCanvasAnimation hook + a ParticlePool so the
// 150 confetti pieces spawned per win are recycled instead of GC'd.

import { useEffect, useRef } from "react";

import { useGameStore } from "@/store/useGameStore";
import { useCanvasAnimation, ParticlePool } from "@/hooks";

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
}

const COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#a3e635",
  "#fbbf24",
  "#ffffff",
];

export function Confetti() {
  const token = useGameStore((s) => s.confettiToken);
  const enabled = useGameStore(
    (s) => s.settings.animations && s.settings.showParticles
  );

  const tokenRef = useRef(token);
  tokenRef.current = token;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const { canvasRef, ctx, size, setFrame } = useCanvasAnimation({
    scaleToDpr: false,
    maxDpr: 1,
    pauseWhenHidden: true,
    observeCanvas: false,
  });

  const stateRef = useRef({
    parts: [] as Piece[],
    lastToken: token,
  });

  const poolRef = useRef(
    new ParticlePool<Piece>(
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        vr: 0,
        size: 0,
        color: COLORS[0],
        life: 1,
      }),
      (p) => {
        p.x = 0;
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.rot = 0;
        p.vr = 0;
        p.size = 0;
        p.color = COLORS[0];
        p.life = 1;
      },
      160
    )
  );

  useEffect(() => {
    if (!ctx) return;

    const spawn = (w: number, _h: number) => {
      if (!enabledRef.current) return;
      const pool = poolRef.current;
      const n = 150;
      for (let i = 0; i < n; i++) {
        const p = pool.acquire();
        p.x = Math.random() * w;
        p.y = -20 - Math.random() * 120;
        p.vx = (Math.random() - 0.5) * 7;
        p.vy = 2 + Math.random() * 5;
        p.rot = Math.random() * Math.PI * 2;
        p.vr = (Math.random() - 0.5) * 0.35;
        p.size = 6 + Math.random() * 7;
        p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        p.life = 1;
        stateRef.current.parts.push(p);
      }
    };

    setFrame(() => {
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      const state = stateRef.current;
      const pool = poolRef.current;

      if (tokenRef.current !== state.lastToken) {
        state.lastToken = tokenRef.current;
        spawn(w, h);
      }

      ctx.clearRect(0, 0, w, h);
      const parts = state.parts;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09;
        p.vx *= 0.99;
        p.rot += p.vr;
        p.life -= 0.0045;
        if (p.y > h + 50 || p.life <= 0) {
          parts.splice(i, 1);
          pool.release(p);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    });

    return () => {
      // Release any in-flight pieces back to the pool on unmount.
      poolRef.current.releaseAll(stateRef.current.parts);
    };
  }, [ctx, size, setFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40"
      aria-hidden="true"
    />
  );
}
