import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface SystemLog {
  id: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FRAUD_ATTEMPT';
  acao: string;
  detalhes?: string;
  contexto?: Record<string, unknown>; // Type Safety!
  usuario?: { nome: string; role: string };
  veiculo?: string;
  resolvido: boolean;
  dataCriacao: string;
}

export function useAuditoria() {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const { data } = await api.get<SystemLog[]>('/logs');
      return data;
    },
    refetchInterval: 15000 
  });

  const resolverLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/logs/${id}/resolver`);
    },
    onSuccess: () => {
      toast.success('Registro arquivado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
    },
    onError: () => {
      // toast.error('Erro ao arquivar o log.');
    }
  });

  const resolverTodosMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/logs/resolver-todos`);
    },
    onSuccess: () => {
      toast.success('Todos os registros pendentes foram arquivados.');
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
    }
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    isError: logsQuery.isError,
    refetch: logsQuery.refetch,
    arquivarLog: resolverLogMutation.mutateAsync,
    isArquivando: resolverLogMutation.isPending,
    arquivandoId: resolverLogMutation.variables,
    arquivarTodos: resolverTodosMutation.mutateAsync,
    isArquivandoTodos: resolverTodosMutation.isPending
  };
}
