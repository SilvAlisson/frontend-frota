import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { OrdemServico } from '../types';
import { useFornecedores } from './useFornecedores';

export interface FiltrosManutencao {
  veiculoId: string;
  dataInicio: string;
  dataFim: string;
  fornecedorId: string;
}

export function useHistoricoManutencoes(filtros: FiltrosManutencao) {
  const queryClient = useQueryClient();
  const { data: fornecedores = [] } = useFornecedores();

  const queryKey = [
    'manutencoes', 'recentes',
    filtros.dataInicio, filtros.dataFim,
    filtros.veiculoId, filtros.fornecedorId
  ];

  const { data: historicoFiltrado = [], isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.fornecedorId) params.fornecedorId = filtros.fornecedorId;

      const response = await api.get<OrdemServico[]>('/manutencoes/recentes', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/manutencoes/${id}`);
      queryClient.setQueryData(queryKey, (old: OrdemServico[] | undefined) => 
        old ? old.filter(os => os.id !== id) : []
      );
      toast.success('Registro financeiro removido.');
    } catch (error: unknown) {
      toast.error('Ocorreu um erro ao remover o Registro.');
    }
  };

  const estatisticas = useMemo(() => {
    const totalGasto = historicoFiltrado.reduce((acc, os) => acc + (Number(os.custoTotal) || 0), 0);
    const osAbertas = historicoFiltrado.filter(m => m.status === 'PENDENTE' || m.status === 'EM_ANDAMENTO').length;
    return { totalGasto, osAbertas };
  }, [historicoFiltrado]);

  return {
    historicoFiltrado,
    fornecedores,
    estatisticas,
    loading,
    error,
    refetch,
    handleDelete
  };
}
