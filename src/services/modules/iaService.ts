export interface StreamCallbacks {
  onStart: (msgId: string) => void;
  onChunk: (msgId: string, chunk: string) => void;
  onFinish: (msgId: string) => void;
  onError: (err: unknown) => void;
}

export interface IAPayload {
  pergunta: string;
  contextoSistema: string;
  historico?: { role: string; text: string }[];
}

export const iaService = {
  async consultarStream(payload: IAPayload, callbacks: StreamCallbacks): Promise<void> {
    const msgId = crypto.randomUUID();
    callbacks.onStart(msgId);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ia/consultar-stream`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
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
          
          callbacks.onChunk(msgId, chunk);
          
          const delay = 10 + Math.random() * 15;
          await new Promise(r => setTimeout(r, delay));
        }
        isFlushing = false;
        
        if (networkDone && queue.length === 0) {
          callbacks.onFinish(msgId);
        }
      };

      while (!streamFinished) {
        const { done, value } = await reader.read();
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

      networkDone = true;
      if (!isFlushing) {
        await processQueue();
      }

    } catch (error) {
      console.error('[IAService] Erro no stream:', error);
      callbacks.onError(error);
      throw error;
    }
  }
};
