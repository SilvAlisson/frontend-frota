import { useEffect } from 'react';
import { Router } from './Router';
import { Toaster } from 'sonner';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { api } from './services/api';

function App() {
  // --- EFEITO PARA ACORDAR O SERVIDOR (COLD START) ---
  // Mantido para garantir que o Render saia da hibernação assim que o usuário abrir o app
  useEffect(() => {
    const acordarServidor = async () => {
      try {
        await api.get('/health');
        console.log('✅ Servidor respondendo!');
      } catch (error) {
        // Log interno apenas para acompanhamento técnico
        console.log('⏳ Servidor está iniciando...');
      }
    };
    acordarServidor();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-text antialiased">
      {/* Gestão de Rotas - O Sentry monitorará erros dentro de qualquer rota aqui */}
      <Router />

      {/* Sistema de Notificações (Sonner) */}
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

      {/* Ferramenta de Debug do React Query (Só aparece em desenvolvimento) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </div>
  );
}

export default App;