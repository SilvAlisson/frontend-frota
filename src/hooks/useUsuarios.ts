import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

export function useUsuarios() {
  const { user } = useAuth();
  const isOperador = user?.role === 'OPERADOR';

  return useQuery({
    queryKey: ['usuarios', user?.role],
    queryFn: async () => {
      const endpoint = isOperador ? '/users/encarregados' : '/users';
      try {
        const { data } = await api.get<User[]>(endpoint);
        // Salva na master data para offline (IndexedDB)
        db.masterData.put({ key: 'usuarios_' + endpoint, data, updatedAt: Date.now() }).catch(() => null);
        return data;
      } catch (error: any) {
        if (!window.navigator.onLine || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
           const cached = await db.masterData.get('usuarios_' + endpoint);
           if (cached && cached.data) {
              return cached.data as User[];
           }
        }
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    retry: (failureCount, error: unknown) => {
        if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
        return failureCount < 3;
    }
  });
}


