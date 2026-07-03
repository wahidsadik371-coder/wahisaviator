// Lightweight synthesized sound engine using the Web Audio API.
// No audio assets — every effect is generated on the fly so the bundle stays tiny.
//
// FIXES:
//   - ensure() now returns null and emits a one-time console warning when
//     the Web Audio API is unavailable (older browsers, strict CSP, SSR).
//   - All public methods are no-ops when the context is null rather than
//     throwing — play() silently degrades.
//   - setVolume() guards against NaN / out-of-range.
//   - TypeScript strict null checks throughout (master/ctx always paired).

type SfxName =
  | "click"
  | "bet"
  | "launch"
  | "cashout"
  | "win"
  | "crash"
  | "tick"
  | "coin"
  | "achievement";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private warned = false;
  enabled = true;
  volume = 0.6;

  /**
   * Lazily create + resume the AudioContext. Returns null if Web Audio is
   * unavailable; callers must null-check before scheduling any nodes.
   */
  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) {
        if (!this.warned) {
          this.warned = true;
          // eslint-disable-next-line no-console
          console.warn(
            "[SoundEngine] Web Audio API is unavailable in this environment. " +
              "Sounds will be silently skipped."
          );
        }
        return null;
      }
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        if (!this.warned) {
          this.warned = true;
          // eslint-disable-next-line no-console
          console.warn(
            "[SoundEngine] Failed to create AudioContext:",
            err
          );
        }
        this.ctx = null;
        this.master = null;
        return null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      // Fire-and-forget — resume() is async but we don't need to wait.
      void this.ctx.resume().catch(() => {
        /* user gesture may not have arrived yet; ignore */
      });
    }
    return this.ctx;
  }

  /** Must be called from a user gesture to unlock audio on most browsers. */
  unlock(): void {
    this.ensure();
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  setVolume(v: number): void {
    // Guard against NaN / out-of-range inputs from external sources.
    const clamped = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.6;
    this.volume = clamped;
    if (this.master) this.master.gain.value = clamped;
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number
  ): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noise(start: number, dur: number, peak: number, hp = 400): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(start);
    src.stop(start + dur);
  }

  play(name: SfxName): void {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return; // silently degrade — see ensure() warning
    const t = ctx.currentTime;
    switch (name) {
      case "click":
        this.tone(620, t, 0.07, "square", 0.12);
        break;
      case "tick":
        this.tone(880, t, 0.05, "triangle", 0.1);
        break;
      case "bet":
        this.tone(440, t, 0.08, "triangle", 0.16);
        this.tone(660, t + 0.06, 0.1, "triangle", 0.16);
        break;
      case "coin":
        this.tone(1320, t, 0.08, "triangle", 0.18);
        this.tone(1760, t + 0.05, 0.12, "sine", 0.16);
        break;
      case "launch":
        this.tone(180, t, 0.5, "sawtooth", 0.14);
        this.noise(t, 0.5, 0.12, 300);
        break;
      case "cashout": {
        // Pleasant major chord arpeggio.
        const base = 523.25;
        [0, 4, 7, 12].forEach((semi, i) => {
          this.tone(
            base * Math.pow(2, semi / 12),
            t + i * 0.05,
            0.32,
            "triangle",
            0.15
          );
        });
        break;
      }
      case "win":
        [0, 4, 7, 12, 16, 19].forEach((semi, i) => {
          this.tone(
            392 * Math.pow(2, semi / 12),
            t + i * 0.07,
            0.4,
            "square",
            0.12
          );
        });
        break;
      case "crash":
        this.noise(t, 0.6, 0.3, 200);
        this.tone(140, t, 0.6, "sawtooth", 0.22);
        this.tone(90, t + 0.1, 0.7, "sine", 0.2);
        break;
      case "achievement":
        [0, 7, 12, 19].forEach((semi, i) => {
          this.tone(
            659 * Math.pow(2, semi / 12),
            t + i * 0.08,
            0.4,
            "triangle",
            0.14
          );
        });
        break;
    }
  }
}

export const sound = new SoundEngine();
