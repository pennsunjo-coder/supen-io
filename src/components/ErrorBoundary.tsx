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
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Icone d'erreur */}
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* Message */}
            <h1 className="text-xl font-bold text-foreground mb-2">
              Oups, quelque chose s'est mal passe
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Une erreur inattendue s'est produite. Tes donnees sont en securite.
            </p>

            {/* Details collapsibles */}
            {this.state.error && (
              <details className="mb-6 text-left bg-accent/20 border border-border/30 rounded-xl p-4">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Details techniques
                </summary>
                <code className="text-[11px] text-destructive/80 break-all block mt-2">
                  {this.state.error.message}
                </code>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleReset} className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Reessayer
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = "/dashboard"; }}
                className="w-full gap-2"
              >
                <Home className="w-4 h-4" />
                Retour au dashboard
              </Button>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                Recharger la page
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
