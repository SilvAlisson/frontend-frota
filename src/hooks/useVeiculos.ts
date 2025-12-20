import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface Veiculo {
    id: string;
    placa: string;
    modelo: string;
    marca: string;
    tipoVeiculo: 'MOTO' | 'CARRO_LEVE' | 'CAMINHONETE' | 'CAMINHAO_TOCO' | 'CAMINHAO_TRUCK' | 'CARRETA' | 'VAN' | 'ONIBUS' | 'MAQUINA';
    tipoCombustivel: 'GASOLINA_COMUM' | 'GASOLINA_ADITIVADA' | 'ETANOL' | 'DIESEL_S10' | 'DIESEL_S500' | 'GNV' | 'FLEX' | 'ELETRICO';
    kmAtual: number;
    status: 'ATIVO' | 'MANUTENCAO' | 'INATIVO';
}

// DTOs para envio
type CreateVeiculoDTO = Omit<Veiculo, 'id' | 'kmAtual'> & { kmCadastro: number };
type UpdateVeiculoDTO = Partial<CreateVeiculoDTO> & { id: string };

// --- LISTAR (GET) ---
export function useVeiculos() {
    return useQuery({
        queryKey: ['veiculos'],
        queryFn: async () => {
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
            toast.error(error.response?.data?.error || 'Erro ao remover veículo');
        },
    });
}