import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import Hotjar from '@hotjar/browser';
import { registerSW } from 'virtual:pwa-register';

import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

// Registro PWA Automático
registerSW({ immediate: true });

// Inicialização Hotjar (Silenciosa se não configurado)
const hotjarId = Number(import.meta.env.VITE_HOTJAR_ID) || 0;
if (hotjarId) {
  Hotjar.init(hotjarId, 6);
}

// Inicialização do Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // 10% das transações em produção — evita estouro de cota
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Configuração do QueryClient para ouvir erros e enviar ao Sentry
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Captura erros de buscas (GET) automaticamente
      Sentry.captureException(error);
      console.error('Erro capturado pelo React Query (Query):', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Captura erros de mutações (POST, PUT, DELETE) automaticamente
      Sentry.captureException(error);
      console.error('Erro capturado pelo React Query (Mutation):', error);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 1,
      retry: 1,
    },
  },
});

import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './services/api';

// Global Error Listeners para não deixar nada escapar
window.addEventListener('error', (event) => {
  api.post('/logs', {
    level: 'CRITICAL',
    source: 'FRONTEND',
    message: event.message || 'Window Global Error',
    stackTrace: event.error?.stack || null,
    context: {
      _type: 'WINDOW_ERROR',
      _url: window.location.href,
      _navigator: { userAgent: navigator.userAgent }
    }
  }).catch(() => null);
});

window.addEventListener('unhandledrejection', (event) => {
  api.post('/logs', {
    level: 'ERROR',
    source: 'FRONTEND',
    message: 'Unhandled Promise Rejection: ' + (event.reason?.message || String(event.reason)),
    stackTrace: event.reason?.stack || null,
    context: {
      _type: 'UNHANDLED_REJECTION',
      _url: window.location.href,
      _navigator: { userAgent: navigator.userAgent }
    }
  }).catch(() => null);
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);