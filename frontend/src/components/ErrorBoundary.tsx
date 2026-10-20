import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--ink)]">
          <div className="w-full max-w-md glass-card p-8 text-center border border-[var(--line)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
            <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">
              Error Handler
            </span>

            <h1 className="font-['Manrope'] text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)] mt-2 mb-2">
              Something went wrong
            </h1>

            <p className="text-xs leading-relaxed text-[var(--muted)] mb-6">
              An unexpected render error occurred in this view. Your session and saved data remain safe.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[var(--green)] hover:opacity-90 text-white font-['DM_Sans'] text-xs font-bold px-4 py-2 rounded-[var(--radius-sm)] transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-['DM_Sans'] text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Reload page
              </button>
              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] px-3 py-2 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
