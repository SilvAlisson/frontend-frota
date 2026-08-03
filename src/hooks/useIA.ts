import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../lib/logger';
import { iaService } from '../services/modules/iaService';
import { toast } from 'sonner';

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
  
  // 💡 O Cadeado: Usamos useRef porque ele atualiza instantaneamente (síncrono),
  // diferente do useState que pode demorar alguns milissegundos.
  const isPendingRef = useRef(false);

  const consultarStream = useCallback(async (
    payload: { pergunta: string; contextoSistema: string; historico?: { role: string; text: string }[] },
    callbacks: {
      onStart: (msgId: string) => void;
      onChunk: (msgId: string, chunk: string) => void;
      onFinish: (msgId: string) => void;
      onError: () => void;
    }
  ) => {
    // 💡 1. Previne a dupla-execução: Se já estiver rodando, corta imediatamente.
    if (isPendingRef.current) {
      console.warn('[useIA] Requisição em andamento. Ignorando chamada duplicada.');
      return;
    }

    setIsPending(true);
    isPendingRef.current = true;
    
    const msgId = crypto.randomUUID();
    callbacks.onStart(msgId);

    try {
      await iaService.consultarStream(payload, {
        onStart: () => callbacks.onStart(msgId),
        onChunk: (chunk) => callbacks.onChunk(msgId, chunk),
        onFinish: () => {
          callbacks.onFinish(msgId);
          setIsPending(false);
          isPendingRef.current = false;
        },
        onError: (err: any) => {
          // 💡 2. O Silenciador: Verifica se é um AbortError (cancelamento intencional)
          const isAbort = err?.name === 'AbortError' || String(err).includes('aborted') || String(err).includes('AbortError');
          
          if (isAbort) {
            console.warn('[useIA] Stream abortado intencionalmente (fechamento de componente ou recarregamento).');
            // Finaliza a UI de forma limpa em vez de estourar erro
            callbacks.onFinish(msgId);
          } else {
            console.error('[useIA] Erro na requisição:', err);
            toast.error('Ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.', { duration: 5000 });
            callbacks.onError();
          }
          
          setIsPending(false);
          isPendingRef.current = false;
        }
      });
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError' || String(error).includes('aborted') || String(error).includes('AbortError');
      if (!isAbort) {
        callbacks.onError();
      }
      setIsPending(false);
      isPendingRef.current = false;
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