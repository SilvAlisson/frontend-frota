import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Produto } from '../types';

export function useProdutos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['produtos', user?.role],
    queryFn: async () => {
      const endpoint = user?.role === 'OPERADOR' ? '/produtos/operacao' : '/produtos';
      const { data } = await api.get<Produto[]>(endpoint);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}