import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

import type { User } from '../types';
import { logger } from '../lib/logger';

export function useUsuarios(options?: { includeTestUsers?: boolean }) {
  const queryClient = useQueryClient();

  const usuariosQuery = useQuery({
    queryKey: ['users', !!options?.includeTestUsers],
    queryFn: async () => {
      try {
        const { data } = await api.get<User[]>('/users');
        
        if (options?.includeTestUsers) {
          return data;
        }

        // Filtra para esconder usuários de teste da lista geral
        return data.filter(u => !u.nome.toLowerCase().includes('testando') && !u.nome.toLowerCase().includes('teste'));
      } catch (err: unknown) {
        logger.debug('Erro ao carregar usuários:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onMutate: async (id: string) => {
      // 1. Cancela queries pendentes para não sobrescrever o optimistic update
      await queryClient.cancelQueries({ queryKey: ['users'] });
      // 2. Salva o estado anterior para rollback
      const previousUsers = queryClient.getQueryData<User[]>(['users', !!options?.includeTestUsers]);
      // 3. Atualiza o cache de forma otimista
      queryClient.setQueryData<User[]>(['users', !!options?.includeTestUsers], (old) => {
        return old ? old.filter(u => u.id !== id) : [];
      });
      return { previousUsers };
    },
    onSuccess: () => {
      toast.success('Colaborador removido com sucesso.');
    },
    onError: (_err: unknown, _id, context) => {
      // 4. Se der erro, reverte para o estado anterior
      if (context?.previousUsers) {
        queryClient.setQueryData(['users', !!options?.includeTestUsers], context.previousUsers);
      }
      toast.error('Erro ao remover colaborador. Ação desfeita.');
    },
    onSettled: () => {
      // 5. Sempre invalida no final para garantir sincronia com o servidor
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  return {
    usuarios: usuariosQuery.data || [],
    isLoading: usuariosQuery.isLoading,
    isError: usuariosQuery.isError,
    refetch: usuariosQuery.refetch,
    excluirUsuario: excluirUsuarioMutation.mutateAsync,
    isExcluindo: excluirUsuarioMutation.isPending,
    excluindoId: excluirUsuarioMutation.variables
  };
}
