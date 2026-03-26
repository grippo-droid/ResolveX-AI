import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-red-50/50 rounded-2xl border border-red-100">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5M12 15v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-[16px] font-bold text-[#0A0A0A] mb-1">
            {this.props.fallbackMessage || "Something went wrong."}
          </h2>
          <p className="text-[13px] text-[#6B6B6B] max-w-sm mb-4">
            The application experienced an unexpected crash while attempting to render this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: "" })}
            className="px-4 py-2 text-[12px] font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#222]"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
