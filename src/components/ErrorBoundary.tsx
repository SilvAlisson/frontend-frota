import React, { Component, ErrorInfo, ReactNode } from 'react';
import { api, sanitizePayload } from '../services/api';
import { ServerCrash, RefreshCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    };

    const context = {
      ...sanitizePayload(errorData),
      _navigator: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`
      },
      _url: window.location.href,
      _type: 'REACT_CRASH'
    };

    api.post('/logs', {
      level: 'CRITICAL',
      source: 'FRONTEND',
      message: error.message || 'React UI Crash',
      stackTrace: error.stack,
      context: context
    }).then(res => {
      if (res.data?.id) {
        this.setState({ errorId: res.data.id });
      }
    }).catch(() => null);
  }

  public render() {
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
              <div className="bg-[#0D1117] p-3 rounded-xl border border-border/50 mb-6">
                 <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Protocolo do Erro</p>
                 <p className="text-xs font-mono font-bold text-primary">{this.state.errorId}</p>
              </div>
            )}
            <Button 
              variant="primary" 
              className="w-full h-12 uppercase tracking-widest text-xs font-black shadow-lg"
              onClick={() => window.location.reload()}
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
