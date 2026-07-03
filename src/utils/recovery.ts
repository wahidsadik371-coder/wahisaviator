// Recovery utilities — graceful degradation when things go wrong.

export interface RecoveryAction {
  type: "reload" | "reset_state" | "disable_feature" | "notify";
  message: string;
  feature?: string;
}

export function diagnoseCanvasFailure(err: Error): RecoveryAction {
  if (err.message.includes("getContext")) {
    return {
      type: "disable_feature",
      message: "Canvas 2D context unavailable. The game requires Canvas support.",
      feature: "canvas",
    };
  }
  return { type: "notify", message: "Canvas rendering issue detected. Try reloading." };
}

export function diagnoseAudioFailure(_err: Error): RecoveryAction {
  return {
    type: "disable_feature",
    message: "Web Audio unavailable. Game will continue without sound.",
    feature: "audio",
  };
}

export function diagnoseStorageFailure(err: Error): RecoveryAction {
  if (err.name === "QuotaExceededError") {
    return {
      type: "reset_state",
      message: "localStorage quota exceeded. Progress will be reset to continue.",
    };
  }
  return { type: "notify", message: "Storage error. Your progress may not persist." };
}

/** Backup current state before risky operations. */
const backups: { ts: number; state: unknown }[] = [];
export function backupState(state: unknown): void {
  backups.push({ ts: Date.now(), state });
  if (backups.length > 5) backups.shift();
}

export function getLatestBackup(): { ts: number; state: unknown } | null {
  return backups[backups.length - 1] ?? null;
}
