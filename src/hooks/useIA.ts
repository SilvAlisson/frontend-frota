import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../lib/logger';

import { iaService } from '../services/modules/iaService';

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
      await iaService.consultarStream(payload, {
        onStart: callbacks.onStart,
        onChunk: callbacks.onChunk,
        onFinish: (msgId) => {
          callbacks.onFinish(msgId);
          setIsPending(false);
        },
        onError: (err) => {
          callbacks.onError();
          setIsPending(false);
        }
      });
    } catch (error) {
      callbacks.onError();
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