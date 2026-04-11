import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { handleApiError } from '../services/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import type { Veiculo } from '../types';

export type CreateVeiculoDTO = Omit<Veiculo, 'id' | 'ultimoKm' | 'status'> & {
    kmAtual: number;
    status?: Veiculo['status'];
};

export type UpdateVeiculoDTO = Partial<Omit<Veiculo, 'id'>> & { id: string };

// --- LISTAR (GET) ---
export function useVeiculos() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['veiculos', user?.id, user?.role],
        queryFn: async () => {
            const endpoint = user?.role === 'OPERADOR'
                ? '/veiculos/operacao'
                : '/veiculos';

            const { data } = await api.get<Veiculo[]>(endpoint);
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
        enabled: !!user,
    });
}

// --- CRIAR (POST) ---
export function useCreateVeiculo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (novoVeiculo: CreateVeiculoDTO) => {
            const { data } = await api.post<Veiculo>('/veiculos', novoVeiculo);
            return data;
        },
        onSuccess: () => {
            toast.success('Veículo cadastrado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao cadastrar veículo');
        },
    });
}

// --- EDITAR (PUT) ---
export function useUpdateVeiculo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dados }: UpdateVeiculoDTO) => {
            const { data } = await api.put<Veiculo>(`/veiculos/${id}`, dados);
            return data;
        },
        onSuccess: () => {
            toast.success('Veículo atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao atualizar veículo');
        },
    });
}

// --- EXCLUIR (DELETE) ---
export function useDeleteVeiculo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/veiculos/${id}`);
        },
        onSuccess: () => {
            toast.success('Veículo removido com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao remover veículo');
        },
    });
}


