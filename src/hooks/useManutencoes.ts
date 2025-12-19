import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export interface ManutencaoItem {
    produtoId: string; // Peça ou Serviço
    quantidade: number;
    valorPorUnidade: number;
}

export interface CreateManutencaoDTO {
    veiculoId: string;
    fornecedorId: string;
    tipo: 'PREVENTIVA' | 'CORRETIVA';
    kmAtual: number;
    data: string; // ISO Date
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
    return useQuery({
        queryKey: ['manutencoes', filtros],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros?.veiculoId) params.append('veiculoId', filtros.veiculoId);
            if (filtros?.limit) params.append('limit', String(filtros.limit));

            const { data } = await api.get(`/manutencoes/recentes?${params.toString()}`);
            return data;
        },
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
            queryClient.invalidateQueries({ queryKey: ['veiculos'] }); // Atualiza status do veículo
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao registrar manutenção');
        },
    });
}