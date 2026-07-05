// Fairness verifier — shows the full provably-fair commit→reveal flow.
//
// This implements the standard provably-fair UX used by real crash sites:
//   1. Server seed is generated, its SHA-256 hash shown as commitment.
//   2. The player provides a client seed.
//   3. Each round increments a nonce.
//   4. After 100 rounds (or manual rotation), the server seed is revealed.
//   5. The player can verify past rounds by recomputing crash points.

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { verifyRound, generateClientSeed } from "@/lib/rng";
import { Icon } from "./icons";

export function FairnessVerifier() {
  const clientSeed = useGameStore((s) => s.clientSeed);
  const setClientSeed = useGameStore((s) => s.setClientSeed);
  const rotateServerSeed = useGameStore((s) => s.rotateServerSeed);
  const previousServerSeeds = useGameStore((s) => s.previousServerSeeds);
  const getProvablyFairState = useGameStore((s) => s.getProvablyFairState);

  const [newClientSeed, setNewClientSeed] = useState(clientSeed);
  const [editing, setEditing] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ seed: string; results: { nonce: number; crash: number }[] } | null>(null);

  const pfState = getProvablyFairState();

  const handleSaveClientSeed = () => {
    setClientSeed(newClientSeed || generateClientSeed());
    setEditing(false);
  };

  const handleVerify = async (seed: string, hash: string, nonceRange: [number, number]) => {
    setVerifying(hash);
    const results: { nonce: number; crash: number }[] = [];
    // Verify the first 10 rounds of this epoch
    const maxNonce = Math.min(10, nonceRange[1]);
    for (let n = 0; n < maxNonce; n++) {
      const { crashPoint } = await verifyRound(seed, clientSeed, n);
      results.push({ nonce: n, crash: crashPoint });
    }
    setVerifyResult({ seed, results });
    setVerifying(null);
  };

  return (
    <div className="space-y-3">
      {/* Commit → Reveal explanation */}
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs leading-relaxed text-white/70">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Icon name="sparkles" className="h-3.5 w-3.5 text-cyan-300" />
          <span className="font-bold text-cyan-300">Provably Fair</span>
        </div>
        <ol className="list-decimal space-y-0.5 pl-4">
          <li>A <strong>server seed</strong> is generated and its SHA-256 hash shown below.</li>
          <li>Your <strong>client seed</strong> mixes into each round's outcome.</li>
          <li>A <strong>nonce</strong> increments each round (0, 1, 2, ...).</li>
          <li>Crash = HMAC-SHA256(serverSeed, clientSeed:nonce) → 0.99/(1-r)</li>
          <li>After 100 rounds, the server seed is <strong>revealed</strong> for verification.</li>
        </ol>
        <p className="mt-2 text-xs text-amber-200/70">
          This is a local simulation. Real crash games use server-side seeds for trustless verification.
        </p>
      </div>

      {/* Current Server Seed Commitment */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white/50">Server Seed Hash</span>
          <button
            onClick={rotateServerSeed}
            className="rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-white/60 hover:bg-white/10"
          >
            Rotate
          </button>
        </div>
        <div className="break-all font-mono text-xs text-cyan-300">
          {pfState.serverSeedHash || "Generating..."}
        </div>
        <div className="mt-1 text-xs text-white/40">
          Nonce: <span className="font-mono text-white/60">{pfState.nonce}</span> / 100
        </div>
      </div>

      {/* Client Seed */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white/50">Client Seed</span>
          {!editing && (
            <button
              onClick={() => { setNewClientSeed(clientSeed); setEditing(true); }}
              className="rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-white/60 hover:bg-white/10"
            >
              Change
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newClientSeed}
              onChange={(e) => setNewClientSeed(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-400/50"
              placeholder="Enter or generate..."
              maxLength={64}
            />
            <button
              onClick={() => setNewClientSeed(generateClientSeed())}
              className="rounded-lg bg-white/5 px-2 py-1.5 text-xs font-bold text-white/60 hover:bg-white/10"
            >
              Random
            </button>
            <button
              onClick={handleSaveClientSeed}
              className="rounded-lg bg-cyan-500/20 px-2 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="font-mono text-xs text-white/80">
            {clientSeed || "Not set (will auto-generate)"}
          </div>
        )}
        <div className="mt-1 text-xs text-white/40">
          Changing your client seed forces a new server seed.
        </div>
      </div>

      {/* Previous Server Seeds (Verification) */}
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
          Previous Server Seeds
        </div>
        {previousServerSeeds.length === 0 && (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center text-xs text-white/30">
            No seeds revealed yet. Play 100 rounds or rotate to reveal.
          </div>
        )}
        <div className="space-y-1">
          {previousServerSeeds.slice(0, 5).map((s, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white/60">
                  {s.hash.slice(0, 16)}...
                </span>
                <button
                  onClick={() => handleVerify(s.seed, s.hash, s.nonceRange)}
                  disabled={verifying === s.hash}
                  className="rounded bg-white/5 px-1.5 py-0.5 text-xs font-bold text-cyan-300 hover:bg-white/10 disabled:opacity-30"
                >
                  {verifying === s.hash ? "..." : "Verify"}
                </button>
              </div>
              <div className="text-xs text-white/30">
                {s.rounds} rounds · nonce 0–{s.nonceRange[1]}
              </div>
              {verifyResult?.seed === s.seed && (
                <div className="mt-1.5 space-y-0.5 rounded bg-black/20 p-1.5">
                  {verifyResult.results.map((r) => (
                    <div key={r.nonce} className="flex justify-between font-mono text-xs">
                      <span className="text-white/40">nonce {r.nonce}</span>
                      <span className={r.crash >= 2 ? "text-emerald-300" : "text-rose-300"}>
                        {r.crash.toFixed(2)}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm explanation */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-white/50">
        <strong className="text-white/70">Algorithm (HMAC-SHA256):</strong>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-black/30 p-2 font-mono text-xs text-cyan-300">
{`hash = HMAC-SHA256(serverSeed, clientSeed:nonce)
r = parseInt(hash.slice(0,13), 16) / 2^52
crash = floor(0.99 / (1 - r) * 100) / 100
return clamp(crash, 1.00, 1,000,000)`}
        </pre>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          <div>Precision: 52-bit</div>
          <div>Unique values: ~4.5 × 10¹⁵</div>
          <div>P(crash = 1.00x): ~5%</div>
          <div>P(crash ≥ 2x): ~48%</div>
        </div>
      </div>
    </div>
  );
}
