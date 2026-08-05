import { useState, useEffect } from 'react';

// Extensão do tipo window para suportar o evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent;
  }
  interface Navigator {
    standalone?: boolean;
  }
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Verifica se já temos o evento salvo pelo index.html antes do React montar
    if (window.deferredInstallPrompt) {
      handleBeforeInstallPrompt(window.deferredInstallPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Deteção se já estamos num PWA Instalado e esconder prompt (Display-mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt nativo
    await deferredPrompt.prompt();
    
    // Aguarda a decisão do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, promptInstall };
}
