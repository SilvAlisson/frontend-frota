import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** UI opcional de fallback — se omitido usa o padrão */
  fallback?: (reset: () => void, error: Error | null) => ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log estruturado para facilitar debugging em produção
    console.error('[ErrorBoundary] Erro capturado:', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    this.setState({ errorInfo: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    // Se o consumer forneceu um fallback customizado, usa ele
    if (fallback) return fallback(this.handleReset, error);

    // Fallback padrão premium
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border border-error/20 bg-error/5 p-8 text-center shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
          </div>

          <h1 className="text-xl font-black text-text-main mb-2">
            Algo deu errado
          </h1>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            Um erro inesperado impediu o carregamento desta tela.
            Tente recarregar a página ou voltar ao início.
          </p>

          {/* Detalhe técnico — visível apenas em dev */}
          {import.meta.env.DEV && error && (
            <pre className="text-left text-xs bg-surface rounded-xl p-4 mb-6 overflow-auto max-h-32 text-error border border-error/20">
              {error.message}
            </pre>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
            <button
              onClick={() => { this.handleReset(); window.location.href = '/'; }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-text-main text-sm font-bold hover:bg-surface-hover transition-colors"
            >
              <Home className="w-4 h-4" />
              Início
            </button>
          </div>
        </div>
      </div>
    );
  }
}
