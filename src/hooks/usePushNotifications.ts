import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
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
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Checa se já temos subscription
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Permissão para notificações negada.");
        return false;
      }

      const { data: { publicKey } } = await api.get('/notifications/vapid-public-key');
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      const registration = await navigator.serviceWorker.ready;
      
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Manda a subscription pro backend
      await api.post('/notifications/subscribe', sub.toJSON());
      setSubscription(sub);
      
      toast.success("Notificações ativadas com sucesso!");
      return true;

    } catch (error) {
      console.error('Erro ao assinar push:', error);
      toast.error("Erro ao configurar notificações no dispositivo.");
      return false;
    }
  };

  return {
    isSupported,
    subscription,
    subscribeToPush
  };
}
