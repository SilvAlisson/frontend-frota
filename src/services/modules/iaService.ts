import { RENDER_API_BASE_URL } from '../../config';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onFinish: () => void;
  onError: (err: unknown) => void;
}

export interface IAPayload {
  pergunta: string;
  contextoSistema: string;
  historico?: { role: string; text: string }[];
  signal?: AbortSignal; // Adicionado para receber o comando de parada externo
}

const STREAM_TIMEOUT_MS = 60000; // 60 segundos para abortar se o servidor travar

export const iaService = {
  async consultarStream(payload: IAPayload, callbacks: StreamCallbacks): Promise<void> {
    // Separa o signal do resto do payload (não deve ser enviado no JSON ao backend)
    const { signal: externalSignal, ...bodyPayload } = payload;
    
    // Controlador interno para gerenciar o Timeout e o cancelamento do Usuário
    const controller = new AbortController();
    
    // Se houver um sinal de aborto externo (botão Parar), repassamos para o fetch
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => {
        controller.abort(externalSignal.reason);
      });
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        controller.abort(new Error(`Timeout: O servidor demorou mais de ${STREAM_TIMEOUT_MS / 1000} segundos para responder.`));
      }, STREAM_TIMEOUT_MS); // Usando a constante definida no topo do arquivo
    };

    resetTimeout(); // Inicia o timeout da primeira resposta

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${RENDER_API_BASE_URL}/ia/consultar-stream`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(bodyPayload),
        signal: controller.signal // Controlador interno: fusão entre Timeout e Cancelamento Manual
      });

      if (!response.ok) throw new Error(`Falha na resposta do servidor: ${response.status}`);
      if (!response.body) throw new Error('ReadableStream não suportado pelo navegador');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let streamFinished = false;
      let queue = '';
      let isFlushing = false;

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
      
      // Espera a fila de animação ser completamente drenada antes de sinalizar fim
      while (queue.length > 0 || isFlushing) {
        await new Promise(r => setTimeout(r, 20));
      }
      callbacks.onFinish();

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      const isAbort = error instanceof Error && error.name === 'AbortError';
      
      // Se for um aborto intencional, loga apenas no nível de debug ou silencia para manter o console limpo
      if (!isAbort) {
        console.error('[IAService] Erro no stream:', error);
      }
      callbacks.onError(error);
      throw error;
    }
  }
};