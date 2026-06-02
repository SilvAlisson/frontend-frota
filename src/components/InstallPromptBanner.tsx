import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X } from 'lucide-react';
import { Button } from './ui/Button';
import { useState } from 'react';

export function InstallPromptBanner() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Se o app já estiver instalado, não formos instaláveis no momento, ou o usuário fechou
  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-surface glass-premium border border-primary/20 rounded-[1.5rem] p-4 flex flex-col gap-3 shadow-float relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-text-muted hover:text-text-main transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-main leading-tight mb-1">
              Adicionar à Tela Inicial
            </h4>
            <p className="text-xs text-text-secondary leading-snug pr-4">
              Instale o aplicativo Frota KLIN para acesso rápido, login com Biometria e melhor performance.
            </p>
          </div>
        </div>

        <Button 
          onClick={promptInstall}
          className="w-full mt-1 bg-primary text-white border-none shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
          icon={<Download className="w-4 h-4" />}
        >
          Instalar Aplicativo Grátis
        </Button>
      </div>
    </div>
  );
}
