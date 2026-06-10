import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { OrdemServico } from '../types';

export interface FiltrosManutencao {
  veiculoId: string;
  dataInicio: string;
  dataFim: string;
  fornecedorId: string;
}

export function useHistoricoManutencoes(filtros: FiltrosManutencao) {
  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string, nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/fornecedores', { signal: controller.signal })
      .then(res => setFornecedores(res.data))
      .catch(err => { if (import.meta.env.DEV && err.name !== 'CanceledError') console.error("Erro ao carregar fornecedores", err); });
      
    return () => controller.abort();
  }, []);

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<OrdemServico[]>('/manutencoes/recentes', { params: { limit: 'all' } });
      setHistorico(response.data);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      const e = err instanceof Error ? err : new Error('Erro ao carregar o histórico financeiro da oficina.');
      setError(e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/manutencoes/${id}`);
      setHistorico(prev => prev.filter(os => os.id !== id));
      toast.success('Registro financeiro removido.');
    } catch (error: unknown) {
      toast.error('Ocorreu um erro ao remover o Registro.');
    }
  };

  const historicoFiltrado = useMemo(() => {
    return historico.filter(os => {
      if (filtros.fornecedorId && os.fornecedorId !== filtros.fornecedorId) return false;
      if (filtros.veiculoId && os.veiculoId !== filtros.veiculoId) return false;
      if (filtros.dataInicio && new Date(os.data) < new Date(`${filtros.dataInicio}T00:00:00`)) return false;
      if (filtros.dataFim && new Date(os.data) > new Date(`${filtros.dataFim}T23:59:59`)) return false;
      return true;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [historico, filtros]);

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
    refetch: fetchHistorico,
    handleDelete
  };
}
