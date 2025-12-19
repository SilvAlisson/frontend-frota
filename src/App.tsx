import { Router } from './Router';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 1. Configuração do Cliente React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados considerados "frescos" por 1 minuto (não refaz fetch se mudar de aba rápido)
      staleTime: 1000 * 60 * 1,
      // Não recarrega automaticamente ao focar na janela 
      refetchOnWindowFocus: false,
      // Tenta novamente 1 vez em caso de erro de rede antes de falhar
      retry: 1,
    },
  },
});

function App() {
  return (
    // 2. Provedor Global do React Query
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background font-sans text-text antialiased">
        {/* Gestão de Rotas */}
        <Router />

        {/* Sistema de Notificações (Sonner) */}
        <Toaster
          richColors        // Cores semânticas
          position="top-right"
          expand={false}    // Empilha sutilmente
          closeButton       // Botão de fechar
          duration={4000}   // 4 segundos
          theme="light"     // Tema claro forçado
          style={{
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* Ferramenta de Debug  */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;