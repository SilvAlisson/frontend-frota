import { useQuery } from '@tanstack/react-query';
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
  });
}