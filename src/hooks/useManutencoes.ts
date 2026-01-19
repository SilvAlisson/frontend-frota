import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// --- LISTAR ---
export function useManutencoes(filtros?: FiltrosManutencao) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['manutencoes', filtros, user?.role],

        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros?.veiculoId) params.append('veiculoId', filtros.veiculoId);
            if (filtros?.limit) params.append('limit', String(filtros.limit));

            const { data } = await api.get(`/ordens-servico/recentes?${params.toString()}`);
            return data;
        },
        enabled: !!user, // Previne chamadas sem autenticação
    });
}

// --- CRIAR ---
export function useRegistrarManutencao() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dados: CreateManutencaoDTO) => {
            const { data } = await api.post('/ordens-servico', dados);
            return data;
        },
        onSuccess: () => {
            toast.success('OS de Manutenção aberta!');
            queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error: any) => {
            console.error("Erro ao registrar OS:", error);
            toast.error(error.response?.data?.error || 'Erro ao registrar manutenção');
        },
    });
}