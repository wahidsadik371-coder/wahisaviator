// Debug overlay — dev-only FPS counter + state inspector.
// Toggle with Ctrl+Shift+D.

import { useEffect, useState } from "react";

import { useGameStore } from "@/store/useGameStore";
import { monitoring } from "@/lib/monitoring";

export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    const loop = (ts: number) => {
      frames++;
      if (ts - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = ts;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;
  if (!import.meta.env.DEV) return null;

  const state = useGameStore.getState();
  const session = monitoring.getSession();

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-xs rounded-xl border border-cyan-400/30 bg-black/90 p-3 font-mono text-xs text-white/80 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-cyan-300">DEBUG</span>
        <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">×</button>
      </div>
      <div className="space-y-0.5">
        <div>FPS: <span className="text-emerald-300">{fps}</span></div>
        <div>Balance: <span className="text-amber-300">{state.balance}</span></div>
        <div>Level: <span className="text-cyan-300">{state.level}</span> · XP: {state.totalXP}</div>
        <div>Phase: <span className="text-violet-300">{state.activeBet?.status ?? "none"}</span></div>
        <div>Rounds: {state.stats.roundsPlayed} · Wins: {state.stats.wins}</div>
        <div>Missions: {state.activeDailyMissions.length} daily, {state.activeWeeklyMissions.length} weekly</div>
        <div>Session: {Math.floor((Date.now() - session.startedAt) / 1000)}s</div>
        <div>Errors queued: {monitoring.getErrors().length}</div>
        <div>Breadcrumbs: {monitoring.getBreadcrumbs().length}</div>
      </div>
    </div>
  );
}
