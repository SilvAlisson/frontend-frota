import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import axios from 'axios';
import type { User } from '../types';

export function useUsuarios() {
  const queryClient = useQueryClient();

  const usuariosQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data } = await api.get<User[]>('/users');
        // Filtra para esconder usuários de teste da lista geral (RH/Admin)
        return data.filter(u => !u.nome.toLowerCase().includes('testando'));
      } catch (err: unknown) {
        if (import.meta.env.DEV) console.error(err);
        // toast.error('Não foi possível carregar o diretório de equipe.');
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success('Colaborador removido com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        // toast.error(err.response.data.error);
      } else {
        // toast.error('Erro ao remover colaborador. O servidor não respondeu como esperado.');
      }
    }
  });

  return {
    usuarios: usuariosQuery.data || [],
    isLoading: usuariosQuery.isLoading,
    refetch: usuariosQuery.refetch,
    excluirUsuario: excluirUsuarioMutation.mutateAsync,
    isExcluindo: excluirUsuarioMutation.isPending,
    excluindoId: excluirUsuarioMutation.variables
  };
}
