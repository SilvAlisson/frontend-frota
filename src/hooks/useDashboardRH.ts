import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface RHKpis {
  totalIntegrantes: number;
  treinamentosCriticos: number;
  cnhsCriticas: number;
  sstPendentes: number;
}

export interface RHGraficos {
  distribuicaoCargos: { name: string; value: number }[];
  panoramaSST: { name: string; value: number }[];
}

export interface RHDashboardData {
  kpis: RHKpis;
  graficos: RHGraficos;
}

export function useDashboardRH(dias: number = 30) {
  return useQuery<RHDashboardData>({
    queryKey: ['rh-kpis', dias],
    queryFn: async () => {
      const response = await api.get(`/rh/kpis?dias=${dias}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}
