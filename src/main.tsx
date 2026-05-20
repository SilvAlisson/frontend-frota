import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import Hotjar from '@hotjar/browser';

import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

// ============================================================
// 🔒 007 — LIMPEZA AUTOMÁTICA DO LEGADO OFFLINE-FIRST (PWA)
// Remove Service Workers, caches e chaves residuais da
// implementação offline-first que foi revertida.
// Roda apenas uma vez por versão de limpeza (chave versionada).
// ============================================================
const CLEANUP_VERSION = 'klin-cleanup-v2';
if (!sessionStorage.getItem(CLEANUP_VERSION)) {
  sessionStorage.setItem(CLEANUP_VERSION, '1');

  // 1. Desregistra todos os Service Workers registrados
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(sw => {
        sw.unregister();
        if (import.meta.env.DEV) console.info('[Cleanup] Service Worker desregistrado:', sw.scope);
      });
    });
  }

  // 2. Limpa todos os caches do browser (workbox, precache, etc.)
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        if (import.meta.env.DEV) console.info('[Cleanup] Cache removido:', cacheName);
      });
    });
  }

  // 3. Remove chaves residuais do localStorage do sistema offline
  const OFFLINE_KEYS = [
    'offline-queue', 'offline_queue', 'sync-queue', 'syncQueue',
    'pendingActions', 'pending-actions', 'offlineActions',
    'workbox-expiration', 'klin-offline', 'pwa-install-prompt',
    'sw-registered', 'offline-mode', 'last-sync'
  ];
  OFFLINE_KEYS.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // 4. Remove IndexedDB residuais (workbox, background-sync)
  if ('indexedDB' in window) {
    const DB_NAMES = ['workbox-background-sync', 'klin-offline-db', 'offline-queue-db'];
    DB_NAMES.forEach(dbName => {
      try {
        indexedDB.deleteDatabase(dbName);
        if (import.meta.env.DEV) console.info('[Cleanup] IndexedDB removido:', dbName);
      } catch { /* Silencioso — banco pode não existir */ }
    });
  }
}



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
      if (import.meta.env.DEV) console.error('Erro capturado pelo React Query (Query):', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Captura erros de mutações (POST, PUT, DELETE) automaticamente
      Sentry.captureException(error);
      if (import.meta.env.DEV) console.error('Erro capturado pelo React Query (Mutation):', error);
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
