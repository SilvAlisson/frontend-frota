import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Abastecimento } from '../types';

interface FiltrosAbastecimento {
  dataInicio: string;
  dataFim: string;
  veiculoId: string;
  fornecedorId: string;
  tipoProduto: string;
}

export function useHistoricoAbastecimentos(filtros: FiltrosAbastecimento) {
  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [fornecedores, setFornecedores] = useState<{id: string, nome: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Busca fornecedores
  useEffect(() => {
    api.get('/fornecedores')
      .then(res => setFornecedores(res.data))
      .catch(err => { 
        if (import.meta.env.DEV) console.error("Erro ao carregar fornecedores", err);
      });
  }, []);

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.tipoProduto) params.tipoProduto = filtros.tipoProduto;

      const response = await api.get('/abastecimentos/recentes', { params });
      setHistorico(response.data);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Falha ao carregar abastecimentos.');
      setError(e);
      // toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.veiculoId, filtros.tipoProduto]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/abastecimentos/${id}`);
      setHistorico(prev => prev.filter(ab => ab.id !== id));
      toast.success('Abastecimento removido.');
    } catch (err: unknown) {
      // toast.error('Erro ao remover abastecimento.');
    }
  };

  const historicoFiltrado = useMemo(() => {
    return historico.filter(ab => {
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
    refetch: fetchHistorico,
    handleDelete
  };
}
