import { Component, type ErrorInfo, type ReactNode } from 'react';
import { api, sanitizePayload } from '../services/api';
import { getDeviceContext } from '../utils/errorHandler';
import { ServerCrash, RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { logger } from '../lib/logger';

// SISTEMA DE BREADCRUMBS: Guarda os últimos 10 cliques do usuário silenciosamente
const MAX_BREADCRUMBS = 10;
const breadcrumbs: string[] = [];

const addBreadcrumb = (action: string) => {
  breadcrumbs.push(`[${new Date().toLocaleTimeString()}] ${action}`);
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
};

// Rastreador global de cliques (Injeta no Window sem pesar o React)
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const text = (target.innerText || target.getAttribute('aria-label') || target.tagName || '').substring(0, 40);
    if (text) addBreadcrumb(`Click em: ${text.replace(/\n/g, ' ').trim()}`);
  }, true);
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
  isChunkError?: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    //  O SEGREDO: Detecta se o erro foi causado por um deploy novo na Vercel (arquivo JS antigo apagado)
    const isChunkError = 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed');

    return { hasError: true, isChunkError };
  }

  // 1. CAPTURA DE ERROS DE RENDERIZAÇÃO (O Padrão do React)
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Se for erro de atualização do Vite, recarrega a página silenciosamente em vez de logar o erro
    if (this.state.isChunkError) {
      window.location.reload();
      return;
    }

    this.logErrorToAuditoria(error, 'REACT_RENDER_CRASH', errorInfo?.componentStack);
  }

  // 2. CAPTURA DE ERROS GLOBAIS E ASSÍNCRONOS (A Mágica do Sentry)
  private _unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
  private _previousWindowOnerror: OnErrorEventHandler = null;

  public componentDidMount() {
    this._previousWindowOnerror = window.onerror;
    window.onerror = (message, _source, _lineno, _colno, error) => {
      const globalError = error instanceof Error ? error : new Error(String(message));
      this.logErrorToAuditoria(globalError, 'WINDOW_ONERROR');
    };

    this._unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const promiseError = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.logErrorToAuditoria(promiseError, 'UNHANDLED_PROMISE');
    };
    window.addEventListener('unhandledrejection', this._unhandledRejectionHandler);
  }

  public componentWillUnmount() {
    // Restaura o onerror original e remove o listener para evitar memory leak
    window.onerror = this._previousWindowOnerror;
    if (this._unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this._unhandledRejectionHandler);
    }
  }

  // O MOTOR DE ENVIO: Centraliza a formatação para não repetir código
  private logErrorToAuditoria = (error: Error, type: string, componentStack?: string | null) => {
    if (error.message?.includes('logs')) return;

    const errorData: Record<string, unknown> = {
      message: error.message,
      stack: error.stack,
    };
    if (componentStack) errorData.componentStack = componentStack;

    const context = {
      ...(sanitizePayload(errorData) as Record<string, unknown>),
      ...(getDeviceContext() as Record<string, unknown>),
      _tipoErro: type,
      _breadcrumbs: [...breadcrumbs]
    };

    api.post('/logs', {
      level: 'CRITICAL',
      source: 'FRONTEND',
      message: `[${type}] ${error.message || 'Falha Inesperada'}`,
      stackTrace: error.stack,
      context: context
    }).then(res => {
      if (res.data?.id) {
        this.setState({ errorId: res.data.id });
      }
    }).catch(() => {
      logger.error('Falha ao enviar telemetria para a Central de Auditoria.');
    });
  };

  public render() {
    // Tela de transição rápida caso seja um erro de deploy (Vite Chunk)
    if (this.state.isChunkError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-text-secondary font-medium">Sincronizando nova versão do sistema...</p>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-surface border border-error/30 p-8 rounded-[2rem] max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ServerCrash className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-text-main mb-2">Ops! Ocorreu um erro.</h1>
            <p className="text-sm font-medium text-text-secondary mb-6 leading-relaxed">
              Encontramos uma instabilidade nesta tela. A nossa equipe de engenharia já foi notificada automaticamente com os detalhes.
            </p>
            {this.state.errorId && (
              <div className="bg-surface-hover/80 p-3 rounded-xl border border-border/50 mb-6">
                 <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Protocolo do Erro</p>
                 <p className="text-xs font-mono font-bold text-primary">{this.state.errorId}</p>
              </div>
            )}
            <Button 
              variant="primary" 
              className="w-full h-12 uppercase tracking-widest text-xs font-black shadow-lg"
              onClick={() => {
                window.location.href = window.location.href; 
              }}
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Recarregar Tela
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}