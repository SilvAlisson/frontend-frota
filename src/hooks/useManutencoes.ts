import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export interface ManutencaoItem {
    produtoId: string;
    quantidade: number;
    valorPorUnidade: number;
}

export interface CreateManutencaoDTO {
    veiculoId: string;
    fornecedorId: string;
    tipo: 'PREVENTIVA' | 'CORRETIVA';
    kmAtual: number;
    data: string;
    observacoes?: string;
    fotoComprovanteUrl?: string;
    itens: ManutencaoItem[];
}

interface FiltrosManutencao {
    veiculoId?: string;
    limit?: number | 'all';
}

const handleApiError = (error: unknown, mensagemPadrao: string) => {
    console.error(`[API Error] ${mensagemPadrao}:`, error);
    if (isAxiosError(error)) {
        const msg = error.response?.data?.error || error.response?.data?.message;
        if (msg) return toast.error(msg);
        if (error.code === 'ERR_NETWORK') return toast.error("Sem conexão de rede. Tente novamente.");
    }
    toast.error(mensagemPadrao);
};

// --- LISTAR ---
export function useManutencoes(filtros?: FiltrosManutencao) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['manutencoes', filtros, user?.role],

        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros?.veiculoId) params.append('veiculoId', filtros.veiculoId);
            if (filtros?.limit) params.append('limit', String(filtros.limit));

            const { data } = await api.get(`/manutencoes/recentes?${params.toString()}`);
            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 minutos de cache
        retry: (failureCount, error: unknown) => {
            if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
            return failureCount < 3;
        }
    });
}

// --- CRIAR ---
export function useRegistrarManutencao() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dados: CreateManutencaoDTO) => {
            const { data } = await api.post('/manutencoes', dados);
            return data;
        },
        onSuccess: () => {
            toast.success('OS de Manutenção aberta!');
            queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao registrar manutenção');
        },
    });
}