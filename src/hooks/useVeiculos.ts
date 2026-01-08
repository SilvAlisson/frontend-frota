import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext'; // 1. Importar o AuthContext
import type { Veiculo } from '../types';

export type CreateVeiculoDTO = Omit<Veiculo, 'id' | 'ultimoKm' | 'status'> & {
    kmAtual: number;
    status?: Veiculo['status'];
};

export type UpdateVeiculoDTO = Partial<Omit<Veiculo, 'id'>> & { id: string };

// --- LISTAR (GET) ---
export function useVeiculos() {
    const { user } = useAuth(); // 2. Pegar o usuário logado

    return useQuery({
        // 3. Adicionar o role na chave para recarregar se o usuário mudar
        queryKey: ['veiculos', user?.role], 
        
        queryFn: async () => {
            // 4. Lógica de Seleção de Rota
            // Se for Operador, usa a rota específica de operação. Caso contrário, usa a geral.
            const endpoint = user?.role === 'OPERADOR' 
                ? '/veiculos/operacao' 
                : '/veiculos';
            
            const { data } = await api.get<Veiculo[]>(endpoint);
            return data;
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!user, // 5. Só faz a busca se o usuário estiver carregado
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
            queryClient.invalidateQueries({ queryKey: ['veiculos'] });
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