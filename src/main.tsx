import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

// Inicialização do Sentry (Mantenha como fizemos antes)
Sentry.init({
  dsn: "https://b83bf56cbadf398a05e143441056201b@o4510641487609856.ingest.us.sentry.io/4510641635983360",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// [IMPLEMENTAÇÃO] Configuração do QueryClient para ouvir erros e enviar ao Sentry
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