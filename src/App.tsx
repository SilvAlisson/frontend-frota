import { lazy, Suspense } from 'react';
import { Router } from './Router';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TooltipProvider } from './components/ui/Tooltip';
import { NetworkStatus } from './components/ui/NetworkStatus';
import { ReloadPrompt } from './components/ui/ReloadPrompt'; // 🚨 Componente do PWA adicionado aqui!

// 🛠️ DevTools: Carregado dinamicamente APENAS em desenvolvimento.
// Em produção, o Vite faz tree-shaking e ZERO bytes desta lib vão para o bundle.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : () => null;

function AppContent() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background font-sans text-text-main antialiased selection:bg-primary/20 selection:text-primary">
      <Router />
      <Toaster
        richColors
        position="top-right"
        expand={false}
        closeButton
        duration={4000}
        theme={theme}
        style={{
          fontFamily: 'var(--font-sans)',
        }}
      />
      {/* 🛠️ DevTools: Apenas em desenvolvimento — tree-shaken pelo Vite em produção */}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <NetworkStatus />
        {/* 🚨 Pop-up de atualização posicionado globalmente */}
        <ReloadPrompt /> 
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;