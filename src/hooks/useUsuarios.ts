import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

export function useUsuarios() {
  const { user } = useAuth();
  const isOperador = user?.role === 'OPERADOR';

  return useQuery({
    queryKey: ['usuarios', user?.role],
    queryFn: async () => {
      // Operador só precisa ver encarregados para abrir jornada. Gestores veem todos.
      const endpoint = isOperador ? '/users/encarregados' : '/users';
      const { data } = await api.get<User[]>(endpoint);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    retry: (failureCount, error: unknown) => {
        if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
        return failureCount < 3;
    }
  });
}