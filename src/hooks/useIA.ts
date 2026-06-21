import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

// --- Tipos ---
export interface MensagemChat {
  id: string;
  tipo: 'usuario' | 'kia';
  conteudo: string;
  timestamp: Date;
}

// --- Hook: Consulta Geral (Chat) ---
export function useConsultaIA() {
  return useMutation({
    mutationFn: async (pergunta: string): Promise<string> => {
      const { data } = await api.post('/ia/consulta', { pergunta });
      return data.resposta;
    },
  });
}

// --- Hook: Insights dos KPIs do Dashboard ---
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

// --- Hook: Diagnóstico de Veículo ---
export function useAnaliseVeiculo() {
  return useMutation({
    mutationFn: async (veiculoId: string): Promise<{ diagnostico: string; veiculo: { placa: string; modelo: string } }> => {
      const { data } = await api.get(`/ia/analise-veiculo/${veiculoId}`);
      return data;
    },
  });
}

// --- Hook: Relatório Narrativo de RH ---
export function useRelatorioRH() {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data } = await api.post('/ia/relatorio-rh', {});
      return data.relatorio;
    },
  });
}
