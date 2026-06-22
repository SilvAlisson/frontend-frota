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
// 🚀 HOOK: CONSULTA VIA STREAMING (O NOVO MOTOR DA KIA)
// Consome a rota SSE (Server-Sent Events) para latência zero
// ============================================================================
export function useIAStream() {
  const [isPending, setIsPending] = useState(false);

  const consultarStream = useCallback(async (
    payload: { pergunta: string; contextoSistema: string; historico?: any[] },
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
      // 1. Resgata o token do Fallback (QR Code) diretamente da sessão
      const token = sessionStorage.getItem('authToken');
      
      // 2. Monta os cabeçalhos emulando o interceptor do api.ts
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
        credentials: 'include', // 👈 VITAL: Garante que os Cookies do better-auth viajam (equivalente a withCredentials: true)
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Falha na resposta do servidor');
      if (!response.body) throw new Error('ReadableStream não suportado pelo navegador');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        
        // O SSE separa os blocos de dados por quebras duplas de linha
        const lines = chunkText.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6); // Remove o prefixo 'data: '
            if (!dataStr.trim()) continue;

            try {
              const data = JSON.parse(dataStr);
              
              if (data.done) {
                break;
              }
              
              if (data.error) {
                console.error('[useIAStream] Erro retornado pelo stream:', data.error);
                callbacks.onError();
                break;
              }
              
              if (data.text) {
                callbacks.onChunk(msgId, data.text);
              }
            } catch (e) {
              console.warn('[useIAStream] Erro ao fazer parse do chunk SSE:', e, 'Dado original:', dataStr);
            }
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
  }, []); // Removemos a dependência do `token` que vinha do AuthContext

  return { consultarStream, isPending };
}

// ============================================================================
// ⚠️ HOOK LEGADO: CONSULTA GERAL SÍNCRONA
// ============================================================================
export function useConsultaIA() {
  return useMutation({
    mutationFn: async ({ pergunta, historico }: { pergunta: string, historico: { role: string, text: string }[] }): Promise<string> => {
      const { data } = await api.post('/ia/consulta', { pergunta, historico });
      return data.resposta;
    },
  });
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
      const { data } = await api.get(`/ia/analise-veiculo/${veiculoId}`);
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