import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
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

// --- HELPER DE ERRO (Reutilizável e Seguro) ---
const handleApiError = (error: unknown, mensagemPadrao: string) => {
    console.error(`[API Error] ${mensagemPadrao}:`, error);
    
    if (isAxiosError(error)) {
        // Se for erro da API (ex: 400 Bad Request por KM inválido)
        const mensagemServidor = error.response?.data?.error || error.response?.data?.message;
        if (mensagemServidor) {
            toast.error(mensagemServidor);
            return;
        }
        // Se for erro de rede (Operador sem sinal no posto de gasolina)
        if (error.code === 'ERR_NETWORK') {
            toast.error("Erro de conexão. Verifique sua internet ou tente novamente.");
            return;
        }
    }
    
    // Fallback genérico
    toast.error(mensagemPadrao);
};

// --- LISTAR RECENTES (GET) ---
export function useAbastecimentos(filtros?: FiltrosHistorico) {
    const { user } = useAuth();

    return useQuery({
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
        
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // Cache de 2 minutos para evitar requisições repetidas ao trocar de aba
        
        // 🛡️ Retry Inteligente (Não tenta novamente se o token expirou)
        retry: (failureCount, error: unknown) => {
            if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
                return false;
            }
            return failureCount < 3;
        }
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
            toast.success('Abastecimento registrado com sucesso!');
            // Invalida múltiplos caches para forçar a atualização dos relatórios financeiros instantaneamente
            queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao registrar abastecimento');
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
            toast.success('Registro de abastecimento removido.');
            queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao remover registro de abastecimento');
        },
    });
}