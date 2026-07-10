
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import Hotjar from '@hotjar/browser';

import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';
import { env } from './config/env';

// Registro oficial do PWA para auto-update silencioso e cache inteligente
import 'virtual:pwa-register';



// Inicialização Hotjar (Silenciosa se não configurado)
const hotjarId = Number(env.hotjarId) || 0;
if (hotjarId) {
  Hotjar.init(hotjarId, 6);
}

// Inicialização do Sentry
Sentry.init({
  dsn: env.sentryDsn as string,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // 10% das transações em produção — evita estouro de cota
  tracesSampleRate: env.isProd ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Configuração do QueryClient para ouvir erros e enviar ao Sentry
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Captura erros de buscas (GET) automaticamente
      Sentry.captureException(error);
      if (env.isDev) console.error('Erro capturado pelo React Query (Query):', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Captura erros de mutações (POST, PUT, DELETE) automaticamente
      Sentry.captureException(error);
      if (env.isDev) console.error('Erro capturado pelo React Query (Mutation):', error);
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
import { setupGlobalErrorLogging } from './services/logger';

setupGlobalErrorLogging();

window.addEventListener('error', (e) => {
  const errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.background = 'red';
  errDiv.style.color = 'white';
  errDiv.style.padding = '20px';
  errDiv.style.zIndex = '999999';
  errDiv.innerHTML = `<h3>Error</h3><pre>${e.error?.stack || e.message}</pre>`;
  document.body.appendChild(errDiv);
});
window.addEventListener('unhandledrejection', (e) => {
  const errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.background = 'orange';
  errDiv.style.color = 'white';
  errDiv.style.padding = '20px';
  errDiv.style.zIndex = '999999';
  errDiv.innerHTML = `<h3>Unhandled Rejection</h3><pre>${e.reason?.stack || e.reason}</pre>`;
  document.body.appendChild(errDiv);
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
