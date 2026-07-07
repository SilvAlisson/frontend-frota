import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Abastecimento } from '../types';
import { useFornecedores } from './useFornecedores';

interface FiltrosAbastecimento {
  dataInicio: string;
  dataFim: string;
  veiculoId: string;
  fornecedorId: string;
  tipoProduto: string;
  status?: string;
}

export function useHistoricoAbastecimentos(filtros: FiltrosAbastecimento) {
  const queryClient = useQueryClient();
  
  // Use o hook cacheado
  const { fornecedores = [] } = useFornecedores();

  const queryKey = [
    'abastecimentos', 'recentes', 
    filtros.dataInicio, filtros.dataFim, 
    filtros.veiculoId, filtros.tipoProduto, filtros.status
  ];

  const { data: historico = [], isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.tipoProduto) params.tipoProduto = filtros.tipoProduto;
      if (filtros.status) params.status = filtros.status;

      const response = await api.get('/abastecimentos/recentes', { params });
      return response.data as Abastecimento[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/abastecimentos/${id}`);
      queryClient.setQueryData(queryKey, (old: Abastecimento[] | undefined) => 
        old ? old.filter(ab => ab.id !== id) : []
      );
      toast.success('Abastecimento removido.');
    } catch (err: unknown) {
      toast.error('Erro ao remover abastecimento.');
    }
  };

  const aprovarAbastecimento = async (id: string) => {
    try {
      await api.put(`/abastecimentos/${id}`, { status: 'APROVADO' });
      queryClient.setQueryData(queryKey, (old: Abastecimento[] | undefined) => 
        old ? old.filter(ab => ab.id !== id) : []
      );
      toast.success('Abastecimento aprovado e KM registrado com sucesso!');
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Falha ao aprovar.');
      toast.error(e.message);
    }
  };

  const historicoFiltrado = useMemo(() => {
    return historico.filter((ab: Abastecimento) => {
      if (!filtros.fornecedorId) return true;
      return ab.fornecedor?.id === filtros.fornecedorId || ab.fornecedorId === filtros.fornecedorId;
    });
  }, [historico, filtros.fornecedorId]);

  const estatisticas = useMemo(() => {
    const totalGasto = historicoFiltrado.reduce((acc, ab) => acc + (Number(ab.custoTotal) || 0), 0);
    const totalLitros = historicoFiltrado.reduce((acc, ab) => {
      const litrosDoAbastecimento = ab.itens?.reduce((sum, item) => {
        if (item.produto.tipo === 'COMBUSTIVEL') {
          return sum + Number(item.quantidade);
        }
        return sum;
      }, 0) || 0;
      return acc + litrosDoAbastecimento;
    }, 0);

    // Dados Curva (agrupa por mês/ano)
    const mapa: Record<string, { litros: number; custo: number }> = {};
    historicoFiltrado.forEach(ab => {
      const partes = ab.dataHora.split('T')[0].split('-');
      const mesLabel = `${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(partes[1])-1]}/${partes[0].slice(2)}`;
      if (!mapa[mesLabel]) mapa[mesLabel] = { litros: 0, custo: 0 };
      const litrosAb = (ab.itens || []).reduce((s, it) => it.produto.tipo === 'COMBUSTIVEL' ? s + Number(it.quantidade) : s, 0);
      mapa[mesLabel].litros += litrosAb;
      mapa[mesLabel].custo += Number(ab.custoTotal) || 0;
    });
    
    const dadosCurva = Object.entries(mapa)
      .slice(-6)
      .map(([mes, v]) => ({ mes, litros: parseFloat(v.litros.toFixed(1)), custo: parseFloat(v.custo.toFixed(2)) }));

    return { totalGasto, totalLitros, dadosCurva };
  }, [historicoFiltrado]);

  return {
    historicoFiltrado,
    fornecedores,
    estatisticas,
    loading,
    error,
    refetch,
    handleDelete,
    aprovarAbastecimento
  };
}
