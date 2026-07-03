// The main game stage: a 60fps canvas that renders the multiplier curve,
// a custom neon hovercraft with an exhaust trail, a depth grid, and a crash
// explosion. Crisp multiplier/phase text is drawn as an HTML overlay on top.
//
// FIX: Now uses the shared useCanvasAnimation hook so rAF + ResizeObserver +
// visibilitychange + AbortController cleanup are all centralized. Particle
// objects (boom, trail) are pooled to avoid GC churn during long sessions.

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

import { engine } from "@/engine/crashEngine";
import { GAME, multiplierAt } from "@/lib/constants";
import { formatCoins, formatMult } from "@/lib/format";
import { useCanvasAnimation, useEngineState, ParticlePool } from "@/hooks";
import { useGameStore } from "@/store/useGameStore";
import { getCosmeticById } from "@/lib/cosmetics";
import type { CosmeticPalette } from "@/lib/types";
import { DevStamp } from "./Watermark";

interface TrailDot {
  x: number;
  y: number;
  life: number;
}

interface Boom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

function multColor(m: number): string {
  if (m >= 50) return "#fbbf24";
  if (m >= 10) return "#f472b6";
  if (m >= 2) return "#a3e635";
  return "#22d3ee";
}
function multGlow(m: number): string {
  if (m >= 50) return "glow-pink";
  if (m >= 10) return "glow-pink";
  if (m >= 2) return "glow-lime";
  return "glow-cyan";
}

// Default palette (matches the original hardcoded colors).
const DEFAULT_PALETTE: CosmeticPalette = {
  id: "default",
  name: "Standard Issue",
  hull: "#a5b4fc",
  accent: "#22d3ee",
  flame: "#fb923c",
  rarity: "common",
};

/**
 * Resolve a palette color that may be "rainbow" into a concrete CSS color.
 * For rainbow, we cycle hues based on the rAF timestamp so the hovercraft
 * shimmers through the spectrum. For normal colors, return as-is.
 */
function resolveColor(value: string, ts: number): string {
  if (value !== "rainbow") return value;
  // Cycle hue every 3 seconds for a smooth shimmer.
  const hue = (ts / 30) % 360;
  return `hsl(${hue}, 85%, 60%)`;
}

/** Lighten a hex color by mixing it with white (for gradient highlights). */
function lighten(hex: string, amount: number): string {
  if (hex.startsWith("hsl")) return hex; // can't easily lighten HSL — return as-is
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Darken a hex color by mixing it with black (for gradient shadows). */
function darken(hex: string, amount: number): string {
  if (hex.startsWith("hsl")) return hex;
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function CrashArena() {
  const perfMode = useGameStore((s) => s.settings.performanceMode);
  const showParticles = useGameStore((s) => s.settings.showParticles);
  const activeCosmeticsId = useGameStore((s) => s.activeCosmetics.hovercraftId);
  const settingsRef = useRef({ perfMode, showParticles });
  settingsRef.current = { perfMode, showParticles };

  // Resolve the active cosmetic palette, falling back to default.
  // useMemo would re-run on every store change; a ref is cheaper since
  // the palette only changes when the user equips a different skin.
  const paletteRef = useRef<CosmeticPalette>(DEFAULT_PALETTE);
  const cosmetic = getCosmeticById(activeCosmeticsId);
  paletteRef.current = cosmetic?.palette ?? DEFAULT_PALETTE;

  const { canvasRef, ctx, size, setFrame } = useCanvasAnimation({
    scaleToDpr: true,
    maxDpr: 2,
    pauseWhenHidden: true,
    observeCanvas: true,
  });

  // Persistent simulation state held across renders. Stored in a ref so the
  // setFrame callback closure can mutate them without re-subscribing.
  const stateRef = useRef({
    stars: Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
    })) as Star[],
    trail: [] as TrailDot[],
    boom: [] as Boom[],
    boomRound: -1,
  });

  // Object pools for trail and boom particles (avoids per-frame allocation).
  const trailPoolRef = useRef(
    new ParticlePool<TrailDot>(
      () => ({ x: 0, y: 0, life: 1 }),
      (p) => {
        p.x = 0;
        p.y = 0;
        p.life = 1;
      },
      32
    )
  );
  const boomPoolRef = useRef(
    new ParticlePool<Boom>(
      () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 1, size: 0, hue: 18 }),
      (p) => {
        p.x = 0;
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.life = 1;
        p.size = 0;
        p.hue = 18;
      },
      48
    )
  );

  useEffect(() => {
    if (!ctx) return;
    const PAD = { l: 52, r: 26, t: 30, b: 34 };

    const triggerBoom = (x: number, y: number) => {
      // Return existing boom particles to the pool before allocating new ones.
      const pool = boomPoolRef.current;
      pool.releaseAll(stateRef.current.boom);
      const n = 46;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        const sp = 1 + Math.random() * 5;
        const p = pool.acquire();
        p.x = x;
        p.y = y;
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp - 1;
        p.life = 1;
        p.size = 2 + Math.random() * 3;
        p.hue = Math.random() < 0.5 ? 18 : 48;
        stateRef.current.boom.push(p);
      }
    };

    const drawGrid = (xMax: number, yMax: number, w: number, h: number) => {
      const plotW = w - PAD.l - PAD.r;
      const plotH = h - PAD.t - PAD.b;
      ctx.lineWidth = 1;
      ctx.font = "11px JetBrains Mono, monospace";
      const ticks = [1, 2, 3, 5, 10, 25, 50, 100];
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (const tv of ticks) {
        if (tv > yMax + 1) continue;
        const y = h - PAD.b - ((tv - 1) / yMax) * plotH;
        ctx.strokeStyle = "rgba(120,140,220,0.10)";
        ctx.beginPath();
        ctx.moveTo(PAD.l, y);
        ctx.lineTo(w - PAD.r, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(150,170,230,0.45)";
        ctx.fillText(tv + "x", PAD.l - 8, y);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const stepT = xMax > 12000 ? 4000 : xMax > 5000 ? 2000 : 1000;
      for (let t = 0; t <= xMax; t += stepT) {
        const x = PAD.l + (t / xMax) * plotW;
        ctx.strokeStyle = "rgba(120,140,220,0.08)";
        ctx.beginPath();
        ctx.moveTo(x, PAD.t);
        ctx.lineTo(x, h - PAD.b);
        ctx.stroke();
        ctx.fillStyle = "rgba(150,170,230,0.35)";
        ctx.fillText((t / 1000).toFixed(0) + "s", x, h - PAD.b + 6);
      }
    };

    const buildPath = (tEnd: number, w: number, h: number) => {
      const plotW = w - PAD.l - PAD.r;
      const plotH = h - PAD.t - PAD.b;
      const xMax = Math.max(tEnd, 600);
      const yMax = Math.max(multiplierAt(tEnd) - 1, 0.2);
      const xScale = (0.82 * plotW) / xMax;
      const yScale = (0.74 * plotH) / yMax;
      const toX = (tt: number) => PAD.l + tt * xScale;
      const toY = (mm: number) => h - PAD.b - (mm - 1) * yScale;
      const steps = Math.max(2, Math.min(140, Math.floor(tEnd / 28)));
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const tt = (tEnd * i) / steps;
        pts.push({ x: toX(tt), y: toY(multiplierAt(tt)) });
      }
      return { pts, xMax, yMax };
    };

    const drawCurveFill = (
      pts: { x: number; y: number }[],
      color: string,
      h: number
    ) => {
      if (pts.length < 2) return;
      const grad = ctx.createLinearGradient(0, PAD.t, 0, h - PAD.b);
      grad.addColorStop(0, color + "55");
      grad.addColorStop(1, color + "00");
      ctx.beginPath();
      ctx.moveTo(pts[0].x, h - PAD.b);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.lineTo(pts[pts.length - 1].x, h - PAD.b);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const drawCurveStroke = (
      pts: { x: number; y: number }[],
      color: string,
      perf: boolean,
      w: number
    ) => {
      if (pts.length < 2) return;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 3.5;
      if (!perf) {
        ctx.shadowBlur = 16;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }
      const grad = ctx.createLinearGradient(PAD.l, 0, w - PAD.r, 0);
      grad.addColorStop(0, "#22d3ee");
      grad.addColorStop(0.6, color);
      grad.addColorStop(1, "#f472b6");
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawHovercraft = (x: number, y: number, color: string, perf: boolean, ts: number) => {
      const palette = paletteRef.current;
      // Resolve all palette colors (handles "rainbow" → animated HSL).
      const hullColor = resolveColor(palette.hull, ts);
      const accentColor = resolveColor(palette.accent, ts);
      const flameColor = resolveColor(palette.flame, ts);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.62);
      const flick = 0.7 + Math.random() * 0.6;
      // Engine flame — uses palette.flame
      ctx.beginPath();
      ctx.moveTo(-5, 15);
      ctx.lineTo(0, 15 + 20 * flick);
      ctx.lineTo(5, 15);
      ctx.closePath();
      const fg = ctx.createLinearGradient(0, 15, 0, 15 + 20 * flick);
      fg.addColorStop(0, lighten(flameColor, 60));
      fg.addColorStop(0.5, flameColor);
      fg.addColorStop(1, "rgba(244,63,94,0)");
      ctx.fillStyle = fg;
      if (!perf) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = flameColor;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      // Hull — uses palette.hull (gradient from light → mid → dark)
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.quadraticCurveTo(20, -2, 13, 10);
      ctx.lineTo(7, 7);
      ctx.lineTo(11, 17);
      ctx.lineTo(-11, 17);
      ctx.lineTo(-7, 7);
      ctx.lineTo(-13, 10);
      ctx.quadraticCurveTo(-20, -2, 0, -20);
      ctx.closePath();
      if (!perf) {
        ctx.shadowBlur = 22;
        ctx.shadowColor = color;
      }
      const hg = ctx.createLinearGradient(-14, -20, 14, 17);
      hg.addColorStop(0, lighten(hullColor, 80));
      hg.addColorStop(0.5, hullColor);
      hg.addColorStop(1, darken(hullColor, 40));
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = lighten(hullColor, 100);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Cockpit — uses palette.accent
      ctx.beginPath();
      ctx.arc(0, -3, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-1.2, -4.2, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.restore();
    };

    const drawStars = (speed: number, w: number, h: number) => {
      const stars = stateRef.current.stars;
      for (const s of stars) {
        s.y -= s.z * speed;
        if (s.y < 0) {
          s.y = 1;
          s.x = Math.random();
        }
        ctx.globalAlpha = 0.25 + s.z * 0.5;
        ctx.fillStyle = "#9fb4ff";
        ctx.fillRect(s.x * w, s.y * h, s.z * 2, s.z * 2);
      }
      ctx.globalAlpha = 1;
    };

    const drawBoom = (dt: number, perf: boolean) => {
      const boom = stateRef.current.boom;
      const pool = boomPoolRef.current;
      for (let i = boom.length - 1; i >= 0; i--) {
        const b = boom[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.12;
        b.vx *= 0.98;
        b.life -= dt / 900;
        if (b.life <= 0) {
          boom.splice(i, 1);
          pool.release(b);
          continue;
        }
        ctx.globalAlpha = Math.max(0, b.life);
        if (!perf) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsl(${b.hue}, 100%, 60%)`;
        }
        ctx.fillStyle = `hsl(${b.hue}, 100%, ${50 + b.life * 20}%)`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, Math.max(0.1, b.size * b.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    setFrame((dt, ts) => {
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      const snap = engine.getSnapshot();
      const { perfMode: perf, showParticles: particles } = settingsRef.current;

      // Defensive reset at the top of every frame so a stale globalAlpha /
      // shadowBlur from a previous frame (or from a crashed rAF tick) can
      // never silently make the hovercraft invisible.
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, w, h);

      if (snap.phase === "running") drawStars(0.004 + snap.multiplier * 0.0009, w, h);
      else if (snap.phase === "crashed") drawStars(0.001, w, h);
      else drawStars(0.0015, w, h);

      if (snap.phase === "waiting") {
        const { xMax, yMax } = buildPath(600, w, h);
        drawGrid(xMax, yMax, w, h);
        const baselineY = h - PAD.b;
        ctx.strokeStyle = "rgba(120,140,220,0.25)";
        ctx.setLineDash([6, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAD.l, baselineY);
        ctx.lineTo(w - PAD.r, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);
        const bob = Math.sin(ts / 380) * 6;
        drawHovercraft(PAD.l + 26, baselineY - 26 + bob, "#22d3ee", perf, ts);
      } else if (snap.phase === "running") {
        const t = snap.elapsedMs;
        const { pts, xMax, yMax } = buildPath(t, w, h);
        drawGrid(xMax, yMax, w, h);
        const color = multColor(snap.multiplier);
        drawCurveFill(pts, color, h);
        drawCurveStroke(pts, color, perf, w);
        const tip = pts[pts.length - 1];
        if (particles && tip) {
          // Pool the trail dots so we never allocate inside the rAF.
          const trail = stateRef.current.trail;
          const pool = trailPoolRef.current;
          const dot = pool.acquire();
          dot.x = tip.x;
          dot.y = tip.y;
          dot.life = 1;
          trail.push(dot);
          if (trail.length > 26) {
            const old = trail.shift();
            if (old) pool.release(old);
          }
          for (const d of trail) {
            d.life -= dt / 500;
            const lifeClamped = Math.max(0, d.life);
            // Skip dead dots entirely — drawing an arc with radius 0 is a
            // waste, and with a negative radius ctx.arc() THROWS, which
            // would skip drawHovercraft() below.
            if (lifeClamped <= 0) continue;
            ctx.globalAlpha = lifeClamped * 0.5;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(d.x, d.y, Math.max(0.1, 2.4 * lifeClamped), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        if (tip) drawHovercraft(tip.x, tip.y, color, perf, ts);
      } else {
        // crashed
        if (stateRef.current.boomRound !== snap.roundId) {
          stateRef.current.boomRound = snap.roundId;
          const tCrash = Math.log(Math.max(1.01, snap.crashPoint)) / GAME.GROWTH_PER_MS;
          const { pts } = buildPath(tCrash, w, h);
          const tip = pts[pts.length - 1];
          if (tip) triggerBoom(tip.x, tip.y);
        }
        const tCrash = Math.log(Math.max(1.01, snap.crashPoint)) / GAME.GROWTH_PER_MS;
        const { pts, xMax, yMax } = buildPath(tCrash, w, h);
        drawGrid(xMax, yMax, w, h);
        drawCurveFill(pts, "#ef4444", h);
        drawCurveStroke(pts, "#ef4444", perf, w);
        drawBoom(dt, perf);
      }
    });

    return () => {
      // Return any in-flight particles to the pool on unmount so the pool
      // is hot when the component re-mounts (StrictMode dev double-invoke).
      trailPoolRef.current.releaseAll(stateRef.current.trail);
      boomPoolRef.current.releaseAll(stateRef.current.boom);
    };
  }, [ctx, size, setFrame]);

  // ---------- HTML overlay ----------
  const snap = useEngineState();
  const activeBet = useGameStore((s) => s.activeBet);

  const potential =
    activeBet && activeBet.status === "active"
      ? Math.round(activeBet.amount * snap.multiplier)
      : null;

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a0f24] to-[#05060f] shadow-2xl"
      role="region"
      aria-label="Crash game arena"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center sm:px-6">
        {snap.phase === "waiting" && (
          <motion.div
            key="wait"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <CountdownRing ms={snap.countdownMs} />
            <p className="mt-4 font-display text-xs uppercase tracking-[0.25em] text-white/50 sm:mt-5 sm:text-sm sm:tracking-[0.3em]">
              Place your bets
            </p>
          </motion.div>
        )}

        {snap.phase === "running" && (
          <motion.div
            key="run"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div
              className={`font-display text-5xl font-black tabular sm:text-6xl md:text-7xl lg:text-8xl ${multGlow(
                snap.multiplier
              )}`}
              style={{ color: multColor(snap.multiplier) }}
              aria-live="polite"
              aria-label={`Multiplier ${snap.multiplier.toFixed(2)} times`}
            >
              {formatMult(snap.multiplier)}
            </div>
            {activeBet && activeBet.status === "active" && potential !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 sm:px-5 sm:text-sm"
              >
                Cash out now for{" "}
                <span className="font-mono">{formatCoins(potential)}</span> 🪙
              </motion.div>
            )}
            {activeBet && activeBet.status === "won" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-3 rounded-full border border-emerald-400/50 bg-emerald-400/15 px-5 py-2 text-sm font-bold text-emerald-300 glow-lime sm:px-6 sm:text-base"
              >
                CASHED OUT @ {formatMult(activeBet.cashedAt ?? 1)} · +
                {formatCoins(activeBet.payout)}
              </motion.div>
            )}
          </motion.div>
        )}

        {snap.phase === "crashed" && (
          <motion.div
            key="crash"
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: [1.15, 0.96, 1], opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center"
          >
            <div className="font-display text-2xl font-black uppercase tracking-widest text-red-400 glow-red sm:text-3xl md:text-4xl">
              Crashed
            </div>
            <div className="mt-1 font-display text-4xl font-black tabular text-red-500 glow-red sm:text-5xl md:text-6xl">
              {formatMult(snap.crashPoint)}
            </div>
          </motion.div>
        )}
      </div>

      {/* dev watermark stamp */}
      <DevStamp />

      {/* fairness badge */}
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono text-[10px] text-white/40 backdrop-blur sm:bottom-3 sm:right-3 sm:px-2.5">
        fair #{snap.revealedSeed?.slice(0, 10) ?? snap.seedHash.slice(0, 10)}
      </div>
    </div>
  );
}

function CountdownRing({ ms }: { ms: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, ms / GAME.COUNTDOWN_MS));
  const seconds = Math.ceil(ms / 1000);
  return (
    <div
      className="relative h-28 w-28 sm:h-32 sm:w-32"
      role="timer"
      aria-label={`${seconds} seconds until launch`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.7))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-black text-white glow-cyan sm:text-4xl">
          {seconds}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          sec
        </span>
      </div>
    </div>
  );
}
