import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // 1. Quando o utilizador regressa ao separador (troca de app ou desbloqueia o ecrã)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            r.update(); // Verifica imediatamente no servidor se há uma nova versão
          }
        });

        // 2. Quando a janela ganha foco (clique no PC ou toque no telemóvel)
        window.addEventListener('focus', () => {
          r.update();
        });
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-[calc(100vw-3rem)] p-5 glass-premium bg-surface border border-primary/30 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-8">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <RefreshCw className="w-5 h-5 animate-spin-slow" />
        </div>
        <div className="flex-1">
          <h3 className="font-header font-black text-text-main tracking-tight">Nova Atualização</h3>
          <p className="text-xs text-text-muted mt-1 mb-4">
            Uma nova versão do sistema está disponível. Atualize para aceder às melhorias.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => updateServiceWorker(true)} 
              className="flex-1 bg-primary text-white hover:bg-primary-hover h-10 shadow-md"
            >
              Atualizar Agora
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setNeedRefresh(false)}
              className="h-10 w-10 p-0 flex items-center justify-center text-text-muted hover:bg-surface-hover rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}