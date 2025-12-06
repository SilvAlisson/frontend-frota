import { Router } from './Router';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-text antialiased">
      {/* Gestão de Rotas */}
      <Router />

      {/* Sistema de Notificações (Sonner) */}
      <Toaster
        richColors        // Cores semânticas (verde para sucesso, vermelho para erro)
        position="top-right"
        expand={false}    // false é mais elegante, empilha os toasts sutilmente
        closeButton       // Permite fechar manualmente
        duration={4000}   // 4 segundos de exibição
        theme="light"     // Força tema claro para consistência com o design atual
        style={{
          fontFamily: 'var(--font-sans)', // Garante a mesma fonte do resto do app
        }}
      />
    </div>
  );
}

export default App;