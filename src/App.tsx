import { Router } from './Router';
import { Toaster } from 'sonner';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-text antialiased">
      {/* Gestão de Rotas:
        Agora o Router é leve e focado apenas em navegação.
      */}
      <Router />

      {/* Sistema de Notificações (Sonner):
        Centralizado e estilizado com as variáveis do sistema.
      */}
      <Toaster
        richColors
        position="top-right"
        expand={false}
        closeButton
        duration={4000}
        theme="light"
        style={{
          fontFamily: 'var(--font-sans)',
        }}
      />

      {/* Ferramenta de Debug do React Query (Visível apenas em desenvolvimento) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </div>
  );
}

export default App;