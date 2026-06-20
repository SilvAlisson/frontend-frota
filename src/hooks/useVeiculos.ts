import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { handleApiError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import type { Veiculo } from '../types';


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
        staleTime: 1000 * 60 * 5,
        enabled: !!user,
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
