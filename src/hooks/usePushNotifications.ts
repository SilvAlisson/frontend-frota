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
          const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
          const swOptions = import.meta.env.DEV ? { scope: '/', type: 'module' as const } : { scope: '/' };
          await navigator.serviceWorker.register(swUrl, swOptions);
          
          const reg = await navigator.serviceWorker.ready; 
          
          if (reg && reg.active) {
            const sub = await reg.pushManager.getSubscription();
            if (mounted && sub) setSubscription(sub);
          }
        } catch (error: unknown) {
          logger.apiError(error, '[PUSH-INIT] Erro ao inicializar service worker');
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
    if (!isSupported) {
      toast.error("Notificações push não são suportadas neste navegador.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        toast.error("Permissão para notificações negada.");
        return false;
      }

      const response = await api.get('/notifications/vapid-public-key');
      const publicKey = response.data.publicKey;
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        toast.error("Erro ao conectar com o motor de notificações.");
        return false;
      }
      
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      await api.post('/notifications/subscribe', sub.toJSON());

      setSubscription(sub);
      toast.success("Notificações ativadas com sucesso!");
      return true;

    } catch (error: unknown) {
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