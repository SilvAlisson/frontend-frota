import { Router } from './Router';
import { Toaster } from 'sonner';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

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
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;


