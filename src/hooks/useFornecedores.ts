import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import axios from 'axios';
import type { Fornecedor } from '../types';

export function useFornecedores() {
  const queryClient = useQueryClient();

  const fornecedoresQuery = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Fornecedor[]>('/fornecedores');
        return data;
      } catch (err: unknown) {
        if (import.meta.env.DEV) console.error(err);
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
    onSuccess: () => {
      toast.success('Parceiro removido com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        // toast.error(err.response.data.error);
      } else {
        // toast.error('Erro ao remover. Pode estar vinculado a históricos.');
      }
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
