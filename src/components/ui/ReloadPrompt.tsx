import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Verifica se há atualização a cada 1 hora silenciosamente
      if (r) {
        setInterval(() => { r.update(); }, 60 * 60 * 1000);
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
            Uma nova versão do sistema KLIN está disponível. Atualize para continuar com as melhorias.
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
              className="h-10 w-10 p-0 text-text-muted hover:bg-surface-hover rounded-xl"
            >
              <X className="w-4 h-4 mx-auto" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}