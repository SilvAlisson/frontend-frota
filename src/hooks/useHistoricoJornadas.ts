import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Jornada } from '../types';

export interface JornadaHistorico extends Jornada {
  kmPercorrido?: number;
  [key: string]: unknown;
}

export interface FiltrosJornada {
  dataInicio: string;
  dataFim: string;
  veiculoId: string;
  buscaMotorista: string;
  buscaPlaca: string;
}

export function useHistoricoJornadas(filtros: FiltrosJornada) {
  const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.buscaMotorista) params.motorista = filtros.buscaMotorista; 
      if (filtros.buscaPlaca) params.placa = filtros.buscaPlaca;     

      const response = await api.get('/jornadas/historico', { params });
      setHistorico(response.data);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('Erro no fetch de histórico:', err);
      const e = err instanceof Error ? err : new Error('Não foi possível carregar o histórico.');
      setError(e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.veiculoId, filtros.buscaMotorista, filtros.buscaPlaca]);

  useEffect(() => { 
    fetchHistorico(); 
  }, [fetchHistorico]);

  const executeDelete = async (id: string) => {
    try {
      await api.delete(`/jornadas/${id}`);
      setHistorico(prev => prev.filter(item => item.id !== id));
      toast.success('Registro excluído com sucesso.');
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Erro ao excluir:", err);
      toast.error('Erro ao excluir jornada.');
    }
  };

  const kmTotalGeral = useMemo(() => {
    return historico.reduce((acc, j) => {
      const km = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
      return acc + km;
    }, 0);
  }, [historico]);

  return {
    historico,
    loading,
    error,
    refetch: fetchHistorico,
    executeDelete,
    kmTotalGeral
  };
}
