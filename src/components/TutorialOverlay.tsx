// Tutorial overlay — step-by-step onboarding for new players.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { TUTORIAL_STEPS } from "@/lib/tutorial";

export function TutorialOverlay() {
  const completed = useGameStore((s) => s.tutorialCompleted);
  const step = useGameStore((s) => s.tutorialStep);
  const setStep = useGameStore((s) => s.setTutorialStep);
  const complete = useGameStore((s) => s.completeTutorial);
  const [dismissed, setDismissed] = useState(false);

  if (completed || dismissed) return null;
  const current = TUTORIAL_STEPS[step];
  if (!current) return null;
  const isLast = step === TUTORIAL_STEPS.length - 1;

  const next = () => {
    if (isLast) {
      complete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="glass-strong w-full max-w-md rounded-3xl p-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              Tutorial · Step {step + 1} / {TUTORIAL_STEPS.length}
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-[10px] text-white/40 hover:text-white/70"
            >
              Skip
            </button>
          </div>

          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>

          <h2 id="tutorial-title" className="font-display text-xl font-bold text-white">
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{current.description}</p>

          <div className="mt-4 flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="tap-target flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white/70 hover:bg-white/10"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="tap-target flex-1 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 py-2.5 text-sm font-bold text-white shadow-lg hover:opacity-90"
            >
              {isLast ? "Finish (+5K coins)" : "Next"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
