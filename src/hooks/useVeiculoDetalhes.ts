import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import type { DadosEvolucaoKm, Veiculo, OrdemServico, Abastecimento } from '../types';
import { logger } from '../lib/logger';

export type VeiculoCompleto = Veiculo & {
  resumoFinanceiro?: unknown;
  ordensServico?: OrdemServico[];
  abastecimentos?: Abastecimento[];
};

export function useVeiculoDetalhes(id?: string) {
  const navigate = useNavigate();

  const veiculoQuery = useQuery({
    queryKey: ['veiculo', id, 'detalhes'],
    queryFn: async () => {
      if (!id) return null;
      try {
        const res = await api.get<VeiculoCompleto>(`/veiculos/${id}/detalhes`);
        return res.data;
      } catch (err) {
        logger.apiError(err, 'Erro crítico ao buscar dados do veículo.');
        navigate('/admin/veiculos');
        throw err;
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

  const graficoQuery = useQuery({
    queryKey: ['veiculo', id, 'grafico-km'],
    queryFn: async () => {
      if (!id) return [];
      try {
        const res = await api.get<DadosEvolucaoKm[]>(`/relatorios/evolucao-km?veiculoId=${id}&dias=7`);
        return res.data || [];
      } catch (err) {
        logger.debug('Falha ao buscar gráfico de KM:', err);
        return [];
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

  return {
    veiculo: veiculoQuery.data || null,
    dadosKm: graficoQuery.data || [],
    loading: veiculoQuery.isLoading || graficoQuery.isLoading
  };
}


