import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

// --- Tipos ---
export interface MensagemChat {
  id: string;
  tipo: 'usuario' | 'kia';
  conteudo: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// ============================================================================
// 🚀 HOOK: CONSULTA VIA STREAMING (O MOTOR DA KIA)
// Consome a rota SSE (Server-Sent Events) para latência zero
// ============================================================================
export function useIAStream() {
  const [isPending, setIsPending] = useState(false);

  const consultarStream = useCallback(async (
    payload: { pergunta: string; contextoSistema: string; historico?: { role: string; text: string }[] },
    callbacks: {
      onStart: (msgId: string) => void;
      onChunk: (msgId: string, chunk: string) => void;
      onFinish: (msgId: string) => void;
      onError: () => void;
    }
  ) => {
    setIsPending(true);
    const msgId = crypto.randomUUID();
    callbacks.onStart(msgId);

    try {
      // Resgata o token do Fallback (QR Code) diretamente da sessão
      const token = sessionStorage.getItem('authToken');

      // Monta os cabeçalhos emulando o interceptor do api.ts
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Usamos a Fetch API nativa pois o Axios não é ideal para ler Streams puros
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ia/consultar-stream`, {
        method: 'POST',
        headers,
        credentials: 'include', // VITAL: Garante que os Cookies do better-auth viajam
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Falha na resposta do servidor: ${response.status}`);
      if (!response.body) throw new Error('ReadableStream não suportado pelo navegador');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // ✅ CORREÇÃO: Buffer acumulador para lidar com chunks SSE fragmentados.
      // A Fetch API pode entregar bytes em pedaços arbitrários — um evento SSE
      // pode chegar partido ao meio. O buffer garante que só processamos eventos
      // completos (separados por \n\n).
      let buffer = '';
      let streamFinished = false;

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Quebra o buffer em eventos SSE completos (delimitados por \n\n)
        const events = buffer.split('\n\n');

        // O último elemento pode estar incompleto — guardamos para o próximo chunk
        buffer = events.pop() ?? '';

        for (const event of events) {
          const dataLine = event.split('\n').find(l => l.startsWith('data: '));
          if (!dataLine) continue;

          const dataStr = dataLine.substring(6).trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (data.done) {
              streamFinished = true;
              break;
            }

            if (data.error) {
              console.error('[useIAStream] Erro retornado pelo stream:', data.error);
              callbacks.onError();
              streamFinished = true;
              break;
            }

            if (data.text) {
              callbacks.onChunk(msgId, data.text);
            }
          } catch (e) {
            console.warn('[useIAStream] Erro ao fazer parse do evento SSE:', e, '| Evento:', dataStr);
          }
        }
      }

      callbacks.onFinish(msgId);
    } catch (error) {
      console.error('[useIAStream] Erro fatal ao consumir stream:', error);
      callbacks.onError();
    } finally {
      setIsPending(false);
    }
  }, []);

  return { consultarStream, isPending };
}

// ============================================================================
// 📊 HOOK: INSIGHTS DOS KPIS DO DASHBOARD
// ============================================================================
export function useInsightsKPIs() {
  return useMutation({
    mutationFn: async ({
      kpis,
      mes,
      ano,
    }: {
      kpis: Record<string, unknown>;
      mes: number;
      ano: number;
    }): Promise<string> => {
      const { data } = await api.post('/ia/insights-kpis', { kpis, mes, ano });
      return data.insights;
    },
  });
}

// ============================================================================
// 🚜 HOOK: DIAGNÓSTICO DE VEÍCULO
// ============================================================================
export function useAnaliseVeiculo() {
  return useMutation({
    mutationFn: async (veiculoId: string): Promise<{ diagnostico: string; veiculo: { placa: string; modelo: string } }> => {
      const { data } = await api.post('/ia/analise-veiculo', { veiculoId });
      return data;
    },
  });
}

// ============================================================================
// 👥 HOOK: RELATÓRIO NARRATIVO DE RH
// ============================================================================
export function useRelatorioRH() {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data } = await api.post('/ia/relatorio-rh', {});
      return data.relatorio;
    },
  });
}

// ============================================================================
// 👍👎 HOOK: ENVIAR FEEDBACK DA IA
// ============================================================================
export function useIAFeedback() {
  return useMutation({
    mutationFn: async (payload: {
      mensagemId: string;
      pergunta: string;
      respostaIA: string;
      avaliacao: 'positivo' | 'negativo';
      contextoRota?: string;
    }): Promise<void> => {
      await api.post(`/ia/feedback/${payload.mensagemId}`, payload);
    },
  });
}