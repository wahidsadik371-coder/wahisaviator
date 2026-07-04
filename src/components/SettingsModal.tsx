// Settings modal: audio, animation/performance, progress reset, and info.

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { APP } from "@/lib/constants";
import { Icon } from "./icons";

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-white/90">{title}</div>
        {desc && <div className="text-xs text-white/45">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-cyan-400 ${
        checked ? "bg-cyan-400/80" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const settings = useGameStore((s) => s.settings);
  const setSound = useGameStore((s) => s.setSound);
  const setVolume = useGameStore((s) => s.setVolume);
  const toggleAnimations = useGameStore((s) => s.toggleAnimations);
  const toggleParticles = useGameStore((s) => s.toggleParticles);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-strong w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-title" className="font-sans font-bold text-lg font-bold text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white focus-visible:outline-cyan-400"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <Row title="Sound effects" desc="Synthesized audio cues">
            <Toggle
              checked={settings.sound}
              onChange={setSound}
              ariaLabel="Toggle sound effects"
            />
          </Row>

          <Row title="Volume">
            <label htmlFor="volume-slider" className="sr-only">
              Master volume
            </label>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400"
            />
          </Row>

          <Row title="UI animations" desc="Motion transitions & glows">
            <Toggle
              checked={settings.animations}
              onChange={toggleAnimations}
              ariaLabel="Toggle UI animations"
            />
          </Row>

          <Row title="Particle effects" desc="Stars, trails, confetti">
            <Toggle
              checked={settings.showParticles}
              onChange={toggleParticles}
              ariaLabel="Toggle particle effects"
            />
          </Row>

          <Row title="Reset progress" desc="Clear saved coins & stats">
            <button
              onClick={() => {
                if (confirmReset) {
                  resetProgress();
                  setConfirmReset(false);
                } else {
                  setConfirmReset(true);
                  window.setTimeout(() => setConfirmReset(false), 2500);
                }
              }}
              aria-label={confirmReset ? "Confirm progress reset" : "Reset progress"}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition focus-visible:outline-cyan-400 ${
                confirmReset
                  ? "bg-rose-500 text-white"
                  : "border border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              }`}
            >
              {confirmReset ? "Confirm reset" : "Reset"}
            </button>
          </Row>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-white/45">
          <span className="font-semibold text-cyan-300">{APP.NAME}</span> uses
          virtual demo coins only — no real money, purchases, or withdrawals.
          Crash points are generated locally with a provably-fair algorithm.
        </div>

        {/* credits */}
        <div className="mt-3 overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 font-sans font-bold text-lg font-black text-white shadow-lg shadow-cyan-500/30">
              WS
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">
                Crafted by
              </div>
              <div className="truncate font-sans text-base font-bold text-white">
                {APP.DEVELOPER_HANDLE}
              </div>
            </div>
          </div>
          <div className="mt-3 text-center text-xs text-white/50">
            Designed, engineered, and illustrated by {APP.DEVELOPER}
          </div>
          <div className="mt-2 text-center text-xs text-white/35">
            © {APP.YEAR} {APP.NAME}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
