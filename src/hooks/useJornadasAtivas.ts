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
      const endpoint = user?.role === 'OPERADOR'
        ? '/jornadas/minhas-abertas-operador'
        : '/jornadas/abertas';
        
      const { data } = await api.get<Jornada[]>(endpoint);
      return data;
    },
    
    enabled: !!user,
    staleTime: 1000 * 30, // Os dados são considerados novos por 30 segundos
    
    // Recarrega silenciosamente em background a cada 1 minuto
    // Perfeito para Gestores verem os carros iniciando jornadas na TV da operação
    refetchInterval: 1000 * 60, 
    
    // ðŸ›¡ï¸ Blindagem de Retentativas (Retry Inteligente)
    retry: (failureCount, error: unknown) => {
      if (isAxiosError(error)) {
        // Se for erro do cliente (ex: 401 Não Autorizado, 403 Sem Permissão, 400 Bad Request)
        // Não faz sentido tentar de novo. Cancela imediatamente.
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
      }
      
      // Se for erro de rede (Internet caiu) ou erro 500 do servidor, tenta até 3 vezes
      return failureCount < 3;
    }
  });
}


