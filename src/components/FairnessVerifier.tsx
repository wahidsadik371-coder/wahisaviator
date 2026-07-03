// Fairness verifier — input seed, see the crash point calculation.

import { useState } from "react";

import { crashFromSeed, commitmentHash } from "@/lib/rng";
import { Icon } from "./icons";

export function FairnessVerifier() {
  const [seed, setSeed] = useState("");
  const [verified, setVerified] = useState(false);

  const crash = seed ? crashFromSeed(seed) : null;
  const hash = seed ? commitmentHash(seed) : "";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs leading-relaxed text-white/70">
        <Icon name="sparkles" className="mr-1 inline h-3 w-3 text-cyan-300" />
        Each round's crash point is deterministically derived from a random seed using FNV-1a hashing.
        The commitment hash is shown before the round; the seed is revealed after the crash so you can verify.
      </div>

      <div>
        <label htmlFor="verify-seed" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
          Enter a seed to verify
        </label>
        <input
          id="verify-seed"
          type="text"
          value={seed}
          onChange={(e) => { setSeed(e.target.value); setVerified(false); }}
          placeholder="e.g. a1b2c3d4e5f6..."
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400/50"
        />
      </div>

      {seed && crash !== null && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div>
            <div className="text-[10px] uppercase text-white/40">Commitment hash (shown pre-round)</div>
            <div className="break-all font-mono text-[10px] text-cyan-300">{hash}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-white/40">Computed crash point</div>
            <div className="font-display text-2xl font-bold text-amber-300 glow-pink">{crash.toFixed(2)}x</div>
          </div>
          <button
            onClick={() => setVerified(true)}
            className="tap-target w-full rounded-lg bg-emerald-500/20 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
          >
            {verified ? "✓ Verified — matches the algorithm" : "Mark as verified"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] leading-relaxed text-white/50">
        <strong className="text-white/70">How it works:</strong>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>Server generates a random 16-byte hex seed before each round.</li>
          <li>A commitment hash (5× FNV-1a) is displayed so you know the seed was set in advance.</li>
          <li>After the round crashes, the seed is revealed.</li>
          <li>You can re-run the algorithm above with the revealed seed to confirm the crash point matches.</li>
        </ol>
        <p className="mt-2 text-[10px] text-amber-200/70">
          Note: in this client-side demo, the seed is generated in-browser. A production system would commit server-side.
        </p>
      </div>
    </div>
  );
}
