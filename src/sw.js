/// <reference lib="webworker" />

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      data: { url: data.url || '/' },
      requireInteraction: true // A notificação fica na tela até o usuário interagir
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (e) {
    console.error('Erro ao processar notificação push:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // Verifica se já existe uma janela aberta para a URL e foca nela
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          matchingClient = client;
          break;
        }
      }
      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
