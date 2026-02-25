"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "error",
        source: "client-boundary",
        message: error.message,
        stack: error.stack,
        url: window.location.href,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
            This error has been logged. Try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: "9px 20px", borderRadius: 6, border: "none", background: "#f97316", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
