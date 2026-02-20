import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Fornecedor } from '../types';

export function useFornecedores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data } = await api.get<Fornecedor[]>('/fornecedores');
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