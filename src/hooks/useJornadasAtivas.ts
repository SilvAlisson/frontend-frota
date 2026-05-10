import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import type { Jornada } from '../types';

export function useJornadasAtivas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jornadas', 'ativas', user?.role],
    
    queryFn: async () => {
      const isGestor = !!user && (user.role === 'ADMIN' || user.role === 'ENCARREGADO');
      const endpoint = isGestor
        ? '/jornadas/abertas'
        : '/jornadas/minhas-abertas-operador';
        
      let serverData: Jornada[] = [];
      const cacheKey = 'jornadas_ativas_' + (user?.role || 'OPERADOR');

      try {
        const { data } = await api.get<Jornada[]>(endpoint);
        serverData = data;
        // Salva cache local para offline
        db.masterData.put({ key: cacheKey, data, updatedAt: Date.now() }).catch(() => null);
      } catch (error: any) {
        const isNetworkError = 
          !window.navigator.onLine || 
          error.code === "ERR_NETWORK" || 
          error.code === "ECONNABORTED" || 
          error.code === "ERR_CANCELED" ||
          error.message === "Network Error" ||
          error.message === "USER_IS_OFFLINE";

        if (isNetworkError) {
          const cached = await db.masterData.get(cacheKey);
          if (cached && cached.data) {
            serverData = cached.data as Jornada[];
          }
        } else {
          throw error;
        }
      }

      // UI Otimista: Aplicar ações não sincronizadas (syncQueue)
      try {
        const queueItems = await db.syncQueue.toArray();
        const pendingStarts = queueItems.filter(item => item.method === 'POST' && item.url.includes('/jornadas/iniciar'));
        const pendingEnds = queueItems.filter(item => item.method === 'PUT' && item.url.includes('/jornadas/finalizar'));

        // Removemos as jornadas que estão pendentes de finalização
        const endsSet = new Set(pendingEnds.map(item => {
          const parts = item.url.split('/');
          return parts[parts.length - 1]; // id da jornada
        }));
        
        let optimisticData = serverData.filter(j => !endsSet.has(j.id));

        // Adicionamos as jornadas pendentes de início
        for (const item of pendingStarts) {
          const payload = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          
          // Buscar info do veiculo no cache para enriquecer UI
          let veiculoInfo = { id: payload.veiculoId, placa: 'Sincronizando...', modelo: '...' };
          const veiculosCache = await db.masterData.get('veiculos_' + (isGestor ? '/veiculos' : '/veiculos/operacao'));
          if (veiculosCache && veiculosCache.data) {
            const v = veiculosCache.data.find((vx: any) => vx.id === payload.veiculoId);
            if (v) veiculoInfo = v;
          }

          optimisticData.push({
            id: `temp-${item.id || Date.now()}`,
            dataInicio: item.createdAt,
            kmInicio: payload.kmInicio,
            veiculo: veiculoInfo,
            operador: { nome: user?.nome || 'Você' },
            kmFim: null,
            dataFim: null,
          } as any);
        }

        return optimisticData;
      } catch (err) {
        console.warn('Erro ao aplicar UI otimista das jornadas', err);
        return serverData;
      }
    },
    
    enabled: !!user,
    staleTime: 1000 * 30, // Os dados são considerados novos por 30 segundos
    
    // Recarrega silenciosamente em background a cada 1 minuto
    // Perfeito para Gestores verem os carros iniciando jornadas na TV da operação
    refetchInterval: 1000 * 60, 
    
    // 🛡️ Blindagem de Retentativas (Retry Inteligente)
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


