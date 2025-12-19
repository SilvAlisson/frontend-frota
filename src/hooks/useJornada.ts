import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

// --- Tipagem (Baseada no seu Prisma Schema) ---
export interface Jornada {
    id: string;
    dataInicio: string; // Vem como string ISO do backend
    kmInicio: number;
    veiculo: {
        id: string;
        placa: string;
        modelo: string;
    };
    operador: {
        nome: string;
    };
}

interface IniciarJornadaParams {
    veiculoId: string;
    kmInicio: number;
    encarregadoId?: string;
    observacoes?: string;
    fotoInicioUrl?: string;
}

interface FinalizarJornadaParams {
    id: string; // ID da jornada
    kmFim: number;
    observacoes?: string;
    fotoFimUrl?: string;
}

// --- HOOKS ---

// 1. Listar Jornadas Abertas (GET)
export function useJornadasAbertas() {
    return useQuery({
        queryKey: ['jornadas-abertas'],
        queryFn: async () => {
            const response = await api.get<Jornada[]>('/jornadas/abertas');
            return response.data;
        },
    });
}

// 2. Iniciar Jornada (POST)
export function useIniciarJornada() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dados: IniciarJornadaParams) => {
            const response = await api.post('/jornadas/iniciar', dados);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Jornada iniciada com sucesso!');
            // Mágica: Marca a lista como "velha" para recarregar automaticamente
            queryClient.invalidateQueries({ queryKey: ['jornadas-abertas'] });
            // Se tiver um hook de 'historico', invalida também
            queryClient.invalidateQueries({ queryKey: ['historico-jornadas'] });
        },
        onError: (error: any) => {
            // Pega a mensagem de erro tratada do backend (ex: "Jornada Dupla")
            const msg = error.response?.data?.error || 'Erro ao iniciar jornada';
            toast.error(msg);
        },
    });
}

// 3. Finalizar Jornada (PUT)
export function useFinalizarJornada() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dados }: FinalizarJornadaParams) => {
            const response = await api.put(`/jornadas/finalizar/${id}`, dados);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Jornada finalizada!');
            queryClient.invalidateQueries({ queryKey: ['jornadas-abertas'] });
            queryClient.invalidateQueries({ queryKey: ['historico-jornadas'] });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || 'Erro ao finalizar jornada';
            toast.error(msg);
        },
    });
}