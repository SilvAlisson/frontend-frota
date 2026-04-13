import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { handleApiError } from '../services/errorHandler';

interface Params {
    ano?: number;
    mes?: number;
    veiculoId?: string;
}

export function useSumarioKPIs(params: Params) {
    return useQuery({
        queryKey: ['relatorio', 'sumario', params.ano, params.mes, params.veiculoId],
        queryFn: async () => {
            const { data } = await api.get('/relatorios/sumario', { params });
            return data.kpis;
        },
        staleTime: 1000 * 60 * 2, // 2 minutos de cache
    });
}

export function useEvolucaoKm(veiculoId?: string, dias: number = 7) {
    return useQuery({
        queryKey: ['relatorio', 'evolucao-km', veiculoId, dias],
        queryFn: async () => {
            if (!veiculoId) return [];
            const { data } = await api.get(`/relatorios/evolucao-km`, {
                params: { veiculoId, dias }
            });
            return data;
        },
        enabled: !!veiculoId,
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
    });
}

export function useEvolucaoCpk(veiculoId?: string) {
    return useQuery({
        // A evolução do CPK engloba os últimos 6 meses, então não depende de mês/ano selecionado para o layout geral
        queryKey: ['relatorio', 'evolucao-cpk', veiculoId],
        queryFn: async () => {
            const { data } = await api.get('/relatorios/evolucao-cpk', {
                params: veiculoId ? { veiculoId } : {}
            });
            return data;
        },
        staleTime: 1000 * 60 * 10, // 10 minutos de cache (dados consolidados antigos raramente mudam)
    });
}

export function usePerformanceFrota(params: { ano?: number; mes?: number }) {
    return useQuery({
        queryKey: ['relatorio', 'performance-frota', params.ano, params.mes],
        queryFn: async () => {
            const { data } = await api.get('/relatorios/performance-frota', { params });
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}
