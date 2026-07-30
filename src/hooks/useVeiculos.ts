import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { handleApiError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import type { Veiculo } from '../types';


// --- LISTAR (GET) ---
export function useVeiculos(options?: { includeTestVehicles?: boolean }) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['veiculos', user?.id, user?.role, !!options?.includeTestVehicles],
        queryFn: async () => {
            const endpoint = user?.role === 'OPERADOR'
                ? '/veiculos/operacao'
                : '/veiculos';
            const { data } = await api.get<Veiculo[]>(endpoint);
            
            if (options?.includeTestVehicles) {
                return data;
            }

            // Filtra veículos de teste para não poluírem a lista
            return data.filter(v => 
                !v.placa.toLowerCase().includes('test') && 
                !v.modelo.toLowerCase().includes('test')
            );
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
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ['veiculos'] });
            
            const snapshots = queryClient.getQueriesData<Veiculo[]>({ queryKey: ['veiculos'] });
            
            snapshots.forEach(([key]) => {
                queryClient.setQueryData<Veiculo[]>(key, (old) => {
                    return old ? old.filter(v => v.id !== id) : [];
                });
            });
            
            return { snapshots };
        },
        onSuccess: () => {
            toast.success('Veículo removido com sucesso!');
        },
        onError: (error: unknown, _id, context) => {
            if (context?.snapshots) {
                context.snapshots.forEach(([key, data]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            handleApiError(error, 'Erro ao remover veículo');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        },
    });
}
