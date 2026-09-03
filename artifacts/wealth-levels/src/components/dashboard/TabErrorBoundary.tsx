import { Component, type ErrorInfo, type ReactNode } from "react";

interface TabErrorBoundaryProps {
  tabName: string;
  children: ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
  resetKey: number;
}

export default class TabErrorBoundary extends Component<
  TabErrorBoundaryProps,
  TabErrorBoundaryState
> {
  state: TabErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
    resetKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<TabErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected rendering error",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[Dashboard] ${this.props.tabName} tab failed to render`,
      error,
      errorInfo,
    );
  }

  private handleRetry = () => {
    this.setState((state) => ({
      hasError: false,
      errorMessage: null,
      resetKey: state.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="hud-panel min-h-[220px] p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-destructive font-heading font-bold tracking-widest">
            {this.props.tabName.toUpperCase()} TAB OFFLINE
          </div>
          <p className="max-w-md text-xs font-mono text-muted-foreground">
            This section encountered an error, but the rest of your dashboard is
            still available.
          </p>
          {this.state.errorMessage && (
            <p className="max-w-md text-[10px] font-mono text-destructive/70 break-words">
              {this.state.errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            className="hud-button px-4 py-2 text-xs font-heading tracking-widest"
          >
            REBOOT TAB
          </button>
        </div>
      );
    }

    return (
      <div key={this.state.resetKey} className="h-full">
        {this.props.children}
      </div>
    );
  }
}