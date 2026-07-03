// Mounts once at the app root and wires the monitoring layer into React's
// error boundary lifecycle. The boundary itself calls monitoring.captureError
// via this component's exported `reportBoundaryError` helper.

import { useEffect } from "react";

import { monitoring } from "@/lib/monitoring";
import { useGameStore } from "@/store/useGameStore";

/** Invisible component — wires monitoring to settings + global listeners. */
export function ErrorReporter() {
  const analyticsEnabled = useGameStore((s) => s.settings.analytics ?? true);

  useEffect(() => {
    monitoring.setEnabled(analyticsEnabled);
  }, [analyticsEnabled]);

  // No DOM output — this component exists purely for its side effects.
  return null;
}

/** Helper for ErrorBoundary to call from componentDidCatch. */
export function reportBoundaryError(
  error: Error,
  componentStack: string | null
): void {
  monitoring.captureError(error, {
    context: `ErrorBoundary${componentStack ? " @ " + componentStack.split("\n")[1]?.trim() : ""}`,
    severity: "error",
  });
}
