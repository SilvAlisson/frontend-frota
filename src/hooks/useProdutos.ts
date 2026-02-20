import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
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
    retry: (failureCount, error: unknown) => {
        if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
        return failureCount < 3;
    }
  });
}