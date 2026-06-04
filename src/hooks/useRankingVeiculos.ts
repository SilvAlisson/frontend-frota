import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface VeiculoRanking {
  id: string;
  placa: string;
  modelo: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
}

export function useRankingVeiculos(ano: number, mes: number) {
  return useQuery({
    queryKey: ['ranking-veiculos', ano, mes],
    queryFn: async () => {
      try {
        const { data } = await api.get<VeiculoRanking[]>('/relatorios/ranking-veiculos', { 
          params: { ano, mes } 
        });
        return data;
      } catch (error) {
        if (import.meta.env.DEV) console.error(error);
        // toast.error('Erro ao carregar ranking da frota.');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutos de cache
  });
}
