import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Jornada } from '../types';

export function useJornadasAtivas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jornadas', 'ativas', user?.role],
    queryFn: async () => {
      const endpoint = user?.role === 'OPERADOR'
        ? '/jornadas/minhas-abertas-operador'
        : '/jornadas/abertas';
      const { data } = await api.get<Jornada[]>(endpoint);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 segundos (Jornadas mudam mais rápido, cache menor)
  });
}