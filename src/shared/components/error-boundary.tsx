"use client";

import { Component, type ReactNode } from "react";

type WidgetErrorBoundaryProps = {
  children: ReactNode;
  /** Rendered instead of the subtree once it has crashed. */
  fallback: ReactNode;
};

type WidgetErrorBoundaryState = { hasError: boolean };

/**
 * Isolates an optional widget (e.g. the Leaflet map, whose DOM third-party
 * browser extensions sometimes mangle during hydration) so a crash degrades
 * to the fallback instead of unwinding the whole page to the root boundary.
 */
export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  state: WidgetErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
