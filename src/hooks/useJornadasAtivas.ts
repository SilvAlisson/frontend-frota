import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Jornada } from '../types';

export function useJornadasAtivas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jornadas', 'ativas', user?.role],
    
    queryFn: async () => {
      const isGestor = !!user && (user.role === 'ADMIN' || user.role === 'ENCARREGADO');
      const endpoint = isGestor
        ? '/jornadas/ativas'
        : '/jornadas/minhas-abertas-operador';
        
      const { data } = await api.get<Jornada[]>(endpoint);
      return data;
    },
    
    enabled: !!user,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    
    retry: (failureCount, error: unknown) => {
      if (isAxiosError(error)) {
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    }
  });
}
