import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export interface AbastecimentoItem {
    produtoId: string;
    quantidade: number; 
    valorPorUnidade: number; 
}

export interface CreateAbastecimentoDTO {
    veiculoId: string;
    operadorId: string;
    fornecedorId: string;
    kmOdometro: number;
    dataHora: string;
    placaCartaoUsado?: string;
    observacoes?: string;
    fotoNotaFiscalUrl?: string;
    itens: AbastecimentoItem[];
}

interface FiltrosHistorico {
    veiculoId?: string;
    dataInicio?: string;
    dataFim?: string;
    limit?: number | 'all';
}

// --- LISTAR RECENTES (GET) ---
export function useAbastecimentos(filtros?: FiltrosHistorico) {
    const { user } = useAuth();

    return useQuery({
        // Adiciona user.role para segregar cache de Admin vs Operador
        queryKey: ['abastecimentos', filtros, user?.role], 
        
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros?.veiculoId) params.append('veiculoId', filtros.veiculoId);
            if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
            if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
            if (filtros?.limit) params.append('limit', String(filtros.limit));

            const { data } = await api.get(`/abastecimentos/recentes?${params.toString()}`);
            return data;
        },
        enabled: !!user, // Previne erro 403 por token vazio
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
            queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
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