import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

import type { Fornecedor } from '../types';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export function useFornecedores() {
  const queryClient = useQueryClient();

  const fornecedoresQuery = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Fornecedor[]>('/fornecedores');
        return data;
      } catch (err: unknown) {
        if (env.isDev) logger.debug('Erro ao carregar fornecedores:', err);
        // toast.error('Não foi possível carregar a lista de parceiros.');
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const excluirFornecedorMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/fornecedores/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['fornecedores'] });
      const previousFornecedores = queryClient.getQueryData<Fornecedor[]>(['fornecedores']);
      queryClient.setQueryData<Fornecedor[]>(['fornecedores'], (old) => {
        return old ? old.filter(f => f.id !== id) : [];
      });
      return { previousFornecedores };
    },
    onSuccess: () => {
      toast.success('Parceiro removido com sucesso.');
    },
    onError: (_err: unknown, _id, context) => {
      if (context?.previousFornecedores) {
        queryClient.setQueryData(['fornecedores'], context.previousFornecedores);
      }
      toast.error('Erro ao remover. Pode estar vinculado a históricos.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    }
  });

  return {
    fornecedores: fornecedoresQuery.data || [],
    isLoading: fornecedoresQuery.isLoading,
    refetch: fornecedoresQuery.refetch,
    excluirFornecedor: excluirFornecedorMutation.mutateAsync,
    isExcluindo: excluirFornecedorMutation.isPending,
    excluindoId: excluirFornecedorMutation.variables
  };
}
