import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Signature of DOM-mutation crashes caused by external agents (browser
// translators, Grammarly, password managers, ad-blockers that inject UI).
// React's reconciliation loses track of nodes the external agent rewrote
// and explodes the moment it tries to unmount or update them. The page is
// fundamentally fine — the next mount usually succeeds. Auto-reload once.
const EXTERNAL_DOM_MUTATION_SIGNATURE =
  /removeChild|insertBefore|is not a child of this node|Failed to execute '[^']+' on 'Node'/i;

const AUTO_RELOAD_FLAG = "supenli:errorBoundary:autoReloaded";

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info);

    // Auto-recovery for transient DOM-mutation crashes from browser
    // translators / extensions. We do it ONCE per session (sessionStorage
    // flag) so a real bug doesn't trap the user in a reload loop.
    if (
      typeof window !== "undefined" &&
      typeof sessionStorage !== "undefined" &&
      EXTERNAL_DOM_MUTATION_SIGNATURE.test(error?.message ?? "") &&
      !sessionStorage.getItem(AUTO_RELOAD_FLAG)
    ) {
      sessionStorage.setItem(AUTO_RELOAD_FLAG, "1");
      console.warn("[ErrorBoundary] External DOM mutation detected — auto-reloading once to recover.");
      // Small delay so the console log lands before the reload kills the page.
      setTimeout(() => window.location.reload(), 50);
    }
  }

  handleReset = () => {
    // Clear the auto-reload flag so a future genuine crash can recover too.
    try { sessionStorage.removeItem(AUTO_RELOAD_FLAG); } catch { /* ignore */ }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              An unexpected error occurred. Your data is safe.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left bg-accent/20 border border-border/30 rounded-xl p-4">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Technical details
                </summary>
                <code className="text-[11px] text-destructive/80 break-all block mt-2">
                  {this.state.error.message}
                </code>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={this.handleReset} className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = "/dashboard"; }}
                className="w-full gap-2"
              >
                <Home className="w-4 h-4" />
                Back to dashboard
              </Button>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export function withErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  fallback?: ReactNode,
) {
  return function WithErrorBoundary(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
