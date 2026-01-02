import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Veiculo } from '../types'; // Importando a tipagem oficial

// DTO para criação: Baseado na interface oficial, mas ajustando campos específicos
// Omitimos 'id' e 'ultimoKm' (gerados/gerenciados pelo back) e adicionamos 'kmCadastro'
export type CreateVeiculoDTO = Omit<Veiculo, 'id' | 'ultimoKm' | 'status'> & {
    kmAtual: number;
    status?: Veiculo['status'];
};

// DTO para atualização
export type UpdateVeiculoDTO = Partial<Omit<Veiculo, 'id'>> & { id: string };

// --- LISTAR (GET) ---
export function useVeiculos() {
    return useQuery({
        queryKey: ['veiculos'],
        queryFn: async () => {
            // O TypeScript agora sabe que o retorno segue a interface completa do types.ts
            const { data } = await api.get<Veiculo[]>('/veiculos');
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
    });
}

// --- CRIAR (POST) ---
export function useCreateVeiculo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (novoVeiculo: CreateVeiculoDTO) => {
            const { data } = await api.post('/veiculos', novoVeiculo);
            return data;
        },
        onSuccess: () => {
            toast.success('Veículo cadastrado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['veiculos'] }); // Atualiza a lista
        },
        onError: (error: any) => {
            console.error("Erro ao cadastrar:", error);
            toast.error(error.response?.data?.error || 'Erro ao cadastrar veículo');
        },
    });
}

// --- EDITAR (PUT) ---
export function useUpdateVeiculo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dados }: UpdateVeiculoDTO) => {
            const { data } = await api.put(`/veiculos/${id}`, dados);
            return data;
        },
        onSuccess: () => {
            toast.success('Veículo atualizado!');
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        },
        onError: (error: any) => {
            console.error("Erro ao atualizar:", error);
            toast.error(error.response?.data?.error || 'Erro ao atualizar veículo');
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
            toast.success('Veículo removido!');
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        },
        onError: (error: any) => {
            console.error("Erro ao remover:", error);
            toast.error(error.response?.data?.error || 'Erro ao remover veículo');
        },
    });
}