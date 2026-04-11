import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface HistoricoExecucao {
  id: string;
  dataExecucao: string;
  kmNaExecucao: number | null;
  observacao: string | null;
  registradoPorId: string;
  registradoPor?: { nome: string };
}

export interface PlanoManutencao {
  id: string;
  descricao: string;
  tipoIntervalo: 'KM' | 'TEMPO';
  valorIntervalo: number;
  kmProximaManutencao: number | null;
  dataProximaManutencao: string | null;
  veiculoId: string;
  veiculo: { placa: string; modelo: string; ultimoKm: number | null };
  historicoExecucoes?: HistoricoExecucao[];
}

export function usePlanosManutencao(veiculoId?: string) {
  const queryClient = useQueryClient();

  // 1. Busca todos os planos (com histórico e ultimoKm já embutidos no veiculo)
  const planosQuery = useQuery<PlanoManutencao[]>({
    queryKey: ['planos-manutencao', veiculoId],
    queryFn: async () => {
      const { data } = await api.get('/planos-manutencao', { params: { veiculoId } });
      return data;
    },
    refetchInterval: 120000 // A cada 2 mins mantém a previsão atualizada
  });

  // 2. Transforma Alertas Passivos em Ação "Dar Baixa"
  const registrarExecucaoMutation = useMutation({
    mutationFn: async ({ planoId, kmDaBaixa, observacao }: { planoId: string; kmDaBaixa?: number; observacao?: string }) => {
      const { data } = await api.patch(`/planos-manutencao/${planoId}/registrar-execucao`, {
        kmDaBaixa,
        observacao
      });
      return data;
    },
    onSuccess: () => {
      // Invalida pra recarregar os Gauges do Termostato do Painel
      queryClient.invalidateQueries({ queryKey: ['planos-manutencao'] });
      queryClient.invalidateQueries({ queryKey: ['veiculos'] }); // Pode ter afetado previsao no carro
    }
  });

  return {
    planos: planosQuery.data || [],
    isLoading: planosQuery.isLoading,
    refetch: planosQuery.refetch,
    registrarExecucao: registrarExecucaoMutation
  };
}
