import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
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
// HOOK: CONSULTA VIA STREAMING (O MOTOR DA KIA)
// Consome a rota SSE (Server-Sent Events) para latência zero
// ============================================================================
export function useIAStream() {
  const [isPending, setIsPending] = useState(false);
  
  // Guardamos o signal do abortController atual para podermos cancelar se quisermos
  const abortControllerRef = useRef<AbortController | null>(null);

  const consultarStream = useCallback(async (
    payload: { 
      pergunta: string; 
      contextoSistema: string; 
      historico?: { role: string; text: string }[];
      signal?: AbortSignal; 
    },
    callbacks: {
      onStart: (msgId: string) => void;
      onChunk: (msgId: string, chunk: string) => void;
      onFinish: (msgId: string) => void;
      onError: () => void;
    }
  ) => {
    // 1. Se já tem requisição rodando e o usuário chamou de novo, cancelamos a antiga
    if (abortControllerRef.current) {
      console.warn('[useIA] Nova requisição detectada. Cancelando a requisição anterior.');
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Se o pai passar um signal, a gente repassa, senão a gente usa o nosso
    const signalToUse = payload.signal || abortController.signal;

    setIsPending(true);
    
    const msgId = crypto.randomUUID();
    callbacks.onStart(msgId);

    try {
      await iaService.consultarStream({ ...payload, signal: signalToUse }, {
        onChunk: (chunk) => callbacks.onChunk(msgId, chunk),
        onFinish: () => {
          callbacks.onFinish(msgId);
          setIsPending(false);
          abortControllerRef.current = null;
        },
        onError: (err: unknown) => {
          const isAbort = (err instanceof Error && err.name === 'AbortError') || String(err).includes('aborted') || String(err).includes('AbortError');
          
          if (isAbort) {
            console.warn('[useIA] Stream abortado intencionalmente (fechamento de componente ou clique no botão Parar).');
            callbacks.onFinish(msgId);
          } else {
            console.error('[useIA] Erro na requisição:', err);
            toast.error('Ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.', { duration: 5000 });
            callbacks.onError();
          }
          setIsPending(false);
          abortControllerRef.current = null;
        }
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const isAbort = err.name === 'AbortError' || String(err).includes('aborted');
      if (!isAbort) {
        callbacks.onError();
      }
      setIsPending(false);
      abortControllerRef.current = null;
    }
  }, []);

  return { consultarStream, isPending };
}

// ============================================================================
// HOOK: INSIGHTS DOS KPIS DO DASHBOARD
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
// HOOK: ENVIAR FEEDBACK DA IA
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