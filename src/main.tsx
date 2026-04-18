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

// Inicialização Hotjar
const hotjarId = Number(import.meta.env.VITE_HOTJAR_ID) || 0;
if (hotjarId) {
  Hotjar.init(hotjarId, 6);
} else {
  console.warn('VITE_HOTJAR_ID não configurado. Hotjar Inativo.');
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

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);


