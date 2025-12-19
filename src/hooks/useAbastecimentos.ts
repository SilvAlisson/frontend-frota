import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export interface AbastecimentoItem {
    produtoId: string;
    quantidade: number; // Litros
    valorPorUnidade: number; // Preço do litro
}

export interface CreateAbastecimentoDTO {
    veiculoId: string;
    operadorId: string;
    fornecedorId: string;
    kmOdometro: number;
    dataHora: string; // ISO Date
    placaCartaoUsado?: string;
    observacoes?: string;
    fotoNotaFiscalUrl?: string;
    itens: AbastecimentoItem[];
}

// Interface para Filtros da Listagem
interface FiltrosHistorico {
    veiculoId?: string;
    dataInicio?: string;
    dataFim?: string;
    limit?: number | 'all';
}

// --- LISTAR RECENTES (GET) ---
export function useAbastecimentos(filtros?: FiltrosHistorico) {
    return useQuery({
        // A chave do cache inclui os filtros. Se o filtro mudar, o React Query busca novos dados automaticamente.
        queryKey: ['abastecimentos', filtros],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros?.veiculoId) params.append('veiculoId', filtros.veiculoId);
            if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
            if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
            if (filtros?.limit) params.append('limit', String(filtros.limit));

            const { data } = await api.get(`/abastecimentos/recentes?${params.toString()}`);
            return data;
        },
    });
}

// --- REGISTRAR (POST) ---
export function useRegistrarAbastecimento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dados: CreateAbastecimentoDTO) => {
            const { data } = await api.post('/abastecimentos', dados);
            return data;
        },
        onSuccess: () => {
            toast.success('Abastecimento registrado!');
            // Invalida listas de abastecimento e também a lista de veículos (pois o KM e Status podem ter mudado)
            queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
            queryClient.invalidateQueries({ queryKey: ['relatorio-dashboard'] });

        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao registrar abastecimento');
        },
    });
}

// --- DELETAR ---
export function useDeleteAbastecimento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/abastecimentos/${id}`);
        },
        onSuccess: () => {
            toast.success('Registro removido.');
            queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao remover registro');
        },
    });
}