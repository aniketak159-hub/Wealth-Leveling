import { Component, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  tab: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class TabErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[TabErrorBoundary] "${this.props.tab}" tab crashed:`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-6 p-8">
        {/* Corner accents */}
        <div className="relative w-full max-w-md border border-destructive/40 bg-destructive/5 p-8 flex flex-col items-center gap-5">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-destructive/70" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-destructive/70" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-destructive/70" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-destructive/70" />

          <AlertTriangle className="w-10 h-10 text-destructive/80" />

          <div className="text-center">
            <div className="font-heading text-destructive tracking-widest uppercase text-sm mb-1">
              {this.props.tab} MODULE FAILURE
            </div>
            <p className="text-[11px] font-mono text-muted-foreground tracking-wide leading-relaxed">
              {this.state.error.message || "An unexpected error occurred in this panel."}
            </p>
          </div>

          <button
            onClick={this.reset}
            className="flex items-center gap-2 px-5 py-2.5 border border-destructive/50 text-destructive text-xs font-mono tracking-widest uppercase hover:bg-destructive/10 hover:border-destructive transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            REINITIALIZE MODULE
          </button>
        </div>
      </div>
    );
  }
}
