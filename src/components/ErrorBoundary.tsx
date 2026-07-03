// React error boundary that catches render-time exceptions in the component
// subtree it wraps. Used to isolate canvas-heavy components (Background,
// CrashArena, Confetti) so a single failure does not blank the whole app.
//
// Why a class component: React still requires Component-extends for
// error boundaries — getDerivedStateFromError / componentDidCatch are not
// available to function components.

import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportBoundaryError } from "./ErrorReporter";

interface Props {
  /** Rendered when the boundary catches an error. */
  fallback: ReactNode;
  /** Optional children — the normal subtree to render. */
  children?: ReactNode;
  /** Optional callback for production error reporting. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console log for local debugging + forward to monitoring layer.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] caught:", error, info.componentStack);
    reportBoundaryError(error, info.componentStack ?? null);
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
