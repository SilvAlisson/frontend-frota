export interface StreamCallbacks {
  onStart: () => void;
  onChunk: (chunk: string) => void;
  onFinish: () => void;
  onError: (err: unknown) => void;
}

export interface IAPayload {
  pergunta: string;
  contextoSistema: string;
  historico?: { role: string; text: string }[];
}

export const iaService = {
  async consultarStream(payload: IAPayload, callbacks: StreamCallbacks): Promise<void> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        controller.abort(new Error('Timeout: O servidor demorou mais de 15 segundos para enviar uma resposta.'));
      }, 15000);
    };

    callbacks.onStart();
    resetTimeout(); // Inicia o timeout da primeira resposta

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ia/consultar-stream`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`Falha na resposta do servidor: ${response.status}`);
      if (!response.body) throw new Error('ReadableStream não suportado pelo navegador');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let streamFinished = false;
      let queue = '';
      let isFlushing = false;
      let networkDone = false;

      const processQueue = async () => {
        if (isFlushing) return;
        isFlushing = true;
        while (queue.length > 0) {
          const take = queue.length > 200 ? 4 : queue.length > 80 ? 2 : 1;
          const chunk = queue.substring(0, take);
          queue = queue.substring(take);
          
          callbacks.onChunk(chunk);
          
          const delay = 10 + Math.random() * 15;
          await new Promise(r => setTimeout(r, delay));
        }
        isFlushing = false;
        
        if (networkDone && queue.length === 0) {
          callbacks.onFinish();
        }
      };

      while (!streamFinished) {
        const { done, value } = await reader.read();
        resetTimeout(); // Reseta o timeout a cada novo pedaço lido!

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          if (!event.trim()) continue;
          
          if (event.startsWith('data: ')) {
            const dataStr = event.slice(6);
            if (dataStr === '[DONE]') {
              streamFinished = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                queue += parsed.text;
                processQueue();
              }
            } catch (e) {
              console.error('Erro ao parsear chunk JSON SSE:', dataStr, e);
            }
          }
        }
      }

      clearTimeout(timeoutId); // Limpa o timer definitivamente quando a stream acabar
      networkDone = true;
      
      if (!isFlushing) {
        await processQueue();
      }

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[IAService] Erro no stream:', error);
      callbacks.onError(error);
      throw error;
    }
  }
};
