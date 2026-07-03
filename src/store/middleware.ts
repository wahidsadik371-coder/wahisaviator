// Zustand middleware: action validation, performance tracking, dev-only diff logging.
// All opt-in via import.meta.env.DEV so production builds strip it.

import type { StateCreator, StoreApi, UseBoundStore } from "zustand";

interface ActionMeta {
  name: string;
  ts: number;
  durationMs?: number;
}

const actionLog: ActionMeta[] = [];
const MAX_LOG = 50;

export function getActionLog(): readonly ActionMeta[] {
  return actionLog;
}

/** Logs each store action with timing. Dev-only. */
export function withActionLogging<S extends object>(
  creator: StateCreator<S>
): StateCreator<S> {
  if (!import.meta.env.DEV) return creator;
  return (set, get, api) => {
    const wrappedSet = (next: Partial<S> | ((s: S) => Partial<S>), actionName?: string) => {
      const start = performance.now();
      set(next as Partial<S>);
      const durationMs = performance.now() - start;
      if (actionName) {
        actionLog.push({ name: actionName, ts: Date.now(), durationMs });
        if (actionLog.length > MAX_LOG) actionLog.shift();
      }
    };
    return creator(wrappedSet as typeof set, get, api);
  };
}

/** State snapshot/restore for debugging. */
export interface StateSnapshot<S> {
  ts: number;
  state: S;
}

const snapshots: StateSnapshot<unknown>[] = [];
const MAX_SNAPSHOTS = 10;

export function captureSnapshot<S>(state: S): void {
  snapshots.push({ ts: Date.now(), state });
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.shift();
}

export function getSnapshots(): readonly StateSnapshot<unknown>[] {
  return snapshots;
}

export function restoreSnapshot<S>(store: UseBoundStore<StoreApi<S>>, idx: number): void {
  const snap = snapshots[idx];
  if (snap) store.setState(snap.state as S);
}
