import { Router } from './Router';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-text">
      {/* O componente Router gere as páginas */}
      <Router />

      {/* O Toaster fica aqui, invisível até ser chamado */}
      <Toaster
        richColors
        position="top-right"
        expand={true}
        duration={4000}
      />
    </div>
  );
}

export default App;