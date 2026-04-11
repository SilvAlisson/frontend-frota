import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface DefeitoVeiculo {
  id: string;
  descricao: string;
  categoria: 'PNEU' | 'FREIO' | 'MOTOR' | 'ILUMINACAO' | 'CARROCERIA' | 'OLEO' | 'OUTRO';
  fotoUrl: string;
  status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO';
  resolucao?: string;
  resolvidoEm?: string;
  veiculoId: string;
  veiculo: { placa: string; modelo: string };
  operadorId: string;
  operador: { nome: string };
  resolvidoPorId?: string;
  resolvidoPor?: { nome: string };
  createdAt: string;
}

export function useDefeitos(status?: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO') {
  const queryClient = useQueryClient();

  // Lista todos os defeitos (Operador = só os dele / Encarregado = todos)
  const query = useQuery<DefeitoVeiculo[]>({
    queryKey: ['defeitos', status],
    queryFn: async () => {
      const response = await api.get('/defeitos', { params: { status } });
      return response.data;
    },
    refetchInterval: 60000, // ✨ Polling: atualiza a cada 60s automaticamente
  });

  // Contador de alertas para encarregados
  const countAtivosQuery = useQuery({
    queryKey: ['defeitos-count'],
    queryFn: async () => {
      const response = await api.get('/defeitos/count');
      return response.data.count as number;
    },
    refetchInterval: 60000,
    retry: false // Se não for encarregado dará 403 silencioso
  });

  // MUTAÇÕES
  const registrarMutation = useMutation({
    mutationFn: async (dados: { veiculoId: string; descricao: string; categoria: string; fotoUrl: string }) => {
      const response = await api.post('/defeitos', dados);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defeitos'] });
      queryClient.invalidateQueries({ queryKey: ['defeitos-count'] });
    },
  });

  const resolverMutation = useMutation({
    mutationFn: async ({ id, resolucao }: { id: string; resolucao?: string }) => {
      const response = await api.patch(`/defeitos/${id}/resolver`, { resolucao });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defeitos'] });
      queryClient.invalidateQueries({ queryKey: ['defeitos-count'] });
    },
  });

  return {
    defeitos: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    contagemAtiva: countAtivosQuery.data || 0,
    registrarDefeito: registrarMutation,
    resolverDefeito: resolverMutation,
  };
}
