import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Alerta } from '../types';
import { toast } from 'sonner';

export function useAlertas() {
  const queryClient = useQueryClient();

  // Buscar todos os alertas
  const alertasQuery = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const { data } = await api.get<Alerta[]>('/relatorios/alertas');
      return data;
    },
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 30
  });

  // Mutação para resolver ociosidade (veículo ou operador)
  const resolverOciosidadeMutation = useMutation({
    mutationFn: async ({ isVeiculo, id, status }: { isVeiculo: boolean; id: string; status: string }) => {
      const endpoint = isVeiculo ? `/veiculos/${id}/status` : `/users/${id}/status`;
      await api.put(endpoint, { status });
    },
    onSuccess: () => {
      toast.success('Status atualizado! O alerta não aparecerá mais até que voltem à ativa.');
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
    onError: () => {
      // toast.error('Ocorreu um erro ao atualizar o status.');
    }
  });

  // Mutação para resolver erro de log/auditoria
  const resolverLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      await api.put(`/logs/${logId}/resolver`);
    },
    onSuccess: () => {
      toast.success('Log Arquivado. Solução registrada na auditoria.');
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
    onError: () => {
      // toast.error('Erro ao arquivar log de sistema.');
    }
  });

  const resolverTodosLogMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/logs/resolver-todos`);
    },
    onSuccess: (data: { data?: { message?: string } }) => {
      toast.success(data?.data?.message || 'Todos os logs foram arquivados com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
    onError: () => {
      toast.error('Erro ao arquivar logs em massa.');
    }
  });

  // Dismiss local (Swipe)
  const dismissLocal = (alertaParaRemover: Alerta) => {
    queryClient.setQueryData<Alerta[]>(['alertas'], (oldData) => {
      if (!oldData) return [];
      return oldData.filter(a => a !== alertaParaRemover);
    });
  };

  return {
    alertas: alertasQuery.data || [],
    isLoading: alertasQuery.isLoading,
    isError: alertasQuery.isError,
    refetch: alertasQuery.refetch,
    resolverOciosidade: resolverOciosidadeMutation.mutateAsync,
    isResolvendoOciosidade: resolverOciosidadeMutation.isPending,
    resolverLog: resolverLogMutation.mutateAsync,
    isResolvendoLog: resolverLogMutation.isPending,
    resolverTodosLogs: resolverTodosLogMutation.mutateAsync,
    isResolvendoTodosLogs: resolverTodosLogMutation.isPending,
    dismissLocal
  };
}
