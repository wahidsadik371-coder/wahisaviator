// Lightweight error tracking + analytics layer.
//
// DESIGN GOALS (per "selective advanced" scope):
//   - No IndexedDB, no network requests, no service worker.
//   - In-memory ring buffer that batches errors and flushes to console
//     every 30s (configurable). Production would forward to Sentry etc.
//   - Privacy-preserving: no PII, only error metadata + game-related
//     breadcrumbs (which phase, which action, round id).
//   - Opt-out via the existing settings panel.
//   - Performance marks via the standard Performance API (mark/measure).
//
// USAGE:
//   import { monitoring } from "@/lib/monitoring";
//   monitoring.captureError(err, { context: "CrashArena rAF" });
//   monitoring.breadcrumb("bet_placed", { amount: 100 });
//   monitoring.mark("engine.start"); monitoring.measure("engine.start", "engine.ready");

export type ErrorSeverity = "fatal" | "error" | "warning" | "info";

export interface CapturedError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  ts: number;
  context?: string;
  breadcrumbs: Breadcrumb[];
  sessionDurationMs: number;
  url: string;
  userAgent: string;
}

export interface Breadcrumb {
  ts: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SessionMetrics {
  startedAt: number;
  roundsPlayed: number;
  betsPlaced: number;
  featuresUsed: Set<string>;
}

const RING_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000;

class Monitoring {
  private enabled = true;
  private readonly queue: CapturedError[] = [];
  private readonly breadcrumbs: Breadcrumb[] = [];
  private readonly session: SessionMetrics = {
    startedAt: Date.now(),
    roundsPlayed: 0,
    betsPlaced: 0,
    featuresUsed: new Set(),
  };
  private seq = 0;

  constructor() {
    if (typeof window === "undefined") return;
    // Flush periodically. Use setInterval because we want it to fire even
    // when the tab is backgrounded (the engine rAF pauses, but error
    // reporting should still happen). We don't store the handle because
    // this singleton lives for the page lifetime.
    window.setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Capture unhandled errors and promise rejections.
    window.addEventListener("error", (e) => {
      this.captureError(e.error ?? new Error(e.message), {
        context: "window.onerror",
        severity: "error",
      });
    });
    window.addEventListener("unhandledrejection", (e) => {
      const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
      this.captureError(err, {
        context: "unhandledrejection",
        severity: "error",
      });
    });

    // Flush on page hide so the last batch isn't lost.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush();
    });
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) {
      this.queue.length = 0;
      this.breadcrumbs.length = 0;
    }
  }

  /** Record a user action or game event for context in error reports. */
  breadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.breadcrumbs.push({
      ts: Date.now(),
      category,
      message,
      data,
    });
    if (this.breadcrumbs.length > RING_BUFFER_SIZE) this.breadcrumbs.shift();
  }

  /** Track session-level metrics. */
  trackRound(): void {
    this.session.roundsPlayed++;
  }
  trackBet(): void {
    this.session.betsPlaced++;
  }
  trackFeature(name: string): void {
    this.session.featuresUsed.add(name);
  }

  /** Capture an error with optional context + severity. */
  captureError(
    err: Error,
    opts: { context?: string; severity?: ErrorSeverity } = {}
  ): void {
    if (!this.enabled) return;
    const severity = opts.severity ?? "error";
    const captured: CapturedError = {
      id: `err_${Date.now()}_${this.seq++}`,
      message: err.message,
      stack: err.stack,
      severity,
      ts: Date.now(),
      context: opts.context,
      breadcrumbs: [...this.breadcrumbs],
      sessionDurationMs: Date.now() - this.session.startedAt,
      url: typeof location !== "undefined" ? location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    this.queue.push(captured);
    if (this.queue.length > RING_BUFFER_SIZE) this.queue.shift();

    // Mirror to console so dev tools still see it.
    const fn = severity === "fatal" || severity === "error" ? console.error
      : severity === "warning" ? console.warn
      : console.info;
    fn(`[monitoring:${severity}]`, err, opts.context ?? "");
  }

  /** Performance API wrappers. */
  mark(name: string): void {
    if (!this.enabled) return;
    try {
      performance.mark(name);
    } catch {
      /* name collision — ignore */
    }
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.enabled) return null;
    try {
      const m = performance.measure(name, startMark, endMark);
      return m.duration;
    } catch {
      return null;
    }
  }

  /** Flush the queue. In this client-side demo build, logs to console.
   *  In production, this would POST to an analytics endpoint. */
  flush(): void {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.queue.length);
    // eslint-disable-next-line no-console
    console.info(
      `[monitoring] flushed ${batch.length} error(s), session:`,
      {
        durationMs: Date.now() - this.session.startedAt,
        rounds: this.session.roundsPlayed,
        bets: this.session.betsPlaced,
        features: [...this.session.featuresUsed],
      },
      batch
    );
  }

  /** Snapshot for debugging. */
  getErrors(): readonly CapturedError[] {
    return this.queue;
  }
  getBreadcrumbs(): readonly Breadcrumb[] {
    return this.breadcrumbs;
  }
  getSession(): SessionMetrics {
    return {
      ...this.session,
      featuresUsed: new Set(this.session.featuresUsed),
    };
  }
}

export const monitoring = new Monitoring();
