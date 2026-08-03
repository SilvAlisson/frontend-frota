import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeServiceWorker() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        if (mounted) setIsSupported(true);
        
        try {
          console.log('[PUSH-INIT] Registrando sw.js...');
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          
          const reg = await navigator.serviceWorker.ready; 
          
          if (reg && reg.active) {
            const sub = await reg.pushManager.getSubscription();
            if (mounted && sub) setSubscription(sub);
          }
        } catch (error) {
          console.error('[PUSH-INIT] Erro no useEffect:', error);
        } finally {
          if (mounted) setIsReady(true);
        }
      } else {
        if (mounted) setIsReady(true);
      }
    }

    initializeServiceWorker();
    
    return () => { mounted = false; };
  }, []);

  const subscribeToPush = async () => {
    console.log('[PUSH] 1. Iniciando subscribeToPush...');

    if (!isSupported) {
      console.log('[PUSH] X. Cancelado: Navegador não suporta.');
      toast.error("Notificações push não são suportadas neste navegador.");
      return false;
    }

    try {
      console.log('[PUSH] 2. Solicitando permissão ao usuário...');
      const permission = await Notification.requestPermission();
      console.log('[PUSH] 3. Permissão retornada:', permission);

      if (permission !== 'granted') {
        toast.error("Permissão para notificações negada.");
        return false;
      }

      console.log('[PUSH] 4. Buscando VAPID Public Key no backend...');
      const response = await api.get('/notifications/vapid-public-key');
      const publicKey = response.data.publicKey;
      console.log('[PUSH] 5. VAPID Key recebida?', !!publicKey);
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      console.log('[PUSH] 6. Aguardando Service Worker ficar "ready"... (Pode travar aqui!)');
      const registration = await navigator.serviceWorker.ready;
      console.log('[PUSH] 7. Service Worker está ready!', registration);

      if (!registration) {
        toast.error("Erro ao conectar com o motor de notificações.");
        return false;
      }
      
      console.log('[PUSH] 8. Verificando subscription existente...');
      let sub = await registration.pushManager.getSubscription();
      console.log('[PUSH] 9. Subscription atual existe?', !!sub);

      if (!sub) {
        console.log('[PUSH] 10. Criando nova subscription no navegador...');
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        console.log('[PUSH] 11. Subscription criada com sucesso!');
      }

      console.log('[PUSH] 12. Enviando para o backend...');
      await api.post('/notifications/subscribe', sub.toJSON());
      console.log('[PUSH] 13. Backend confirmou!');

      setSubscription(sub);
      toast.success("Notificações ativadas com sucesso!");
      return true;

    } catch (error) {
      console.error('[PUSH] ❌ ERRO CAPTURADO:', error);
      logger.apiError(error, 'Erro ao configurar notificações no dispositivo.');
      return false;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return false;
    try {
      await subscription.unsubscribe();
      await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
      setSubscription(null);
      toast.success("Notificações desativadas neste dispositivo.");
      return true;
    } catch (error) {
      logger.apiError(error, 'Erro ao desativar notificações.');
      return false;
    }
  };

  return {
    isSupported,
    isReady,
    subscription,
    subscribeToPush,
    unsubscribeFromPush
  };
}