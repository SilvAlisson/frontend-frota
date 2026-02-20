import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export interface Jornada {
    id: string;
    dataInicio: string;
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
    id: string;
    kmFim: number;
    observacoes?: string;
    fotoFimUrl?: string;
}

const handleApiError = (error: unknown, mensagemPadrao: string) => {
    console.error(`[API Error] ${mensagemPadrao}:`, error);
    if (isAxiosError(error)) {
        const msg = error.response?.data?.error || error.response?.data?.message;
        if (msg) return toast.error(msg);
        if (error.code === 'ERR_NETWORK') return toast.error("Sem conexão. Verifique sua rede.");
    }
    toast.error(mensagemPadrao);
};

// 1. Listar Jornadas Abertas (GET)
export function useJornadasAbertas() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['jornadas-abertas', user?.role],
        queryFn: async () => {
            const endpoint = user?.role === 'OPERADOR'
                ? '/jornadas/minhas-abertas-operador'
                : '/jornadas/abertas';

            const response = await api.get<Jornada[]>(endpoint);
            return response.data;
        },
        enabled: !!user,
        staleTime: 1000 * 30, // 30s
        retry: (failureCount, error: unknown) => {
            if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
            return failureCount < 3;
        }
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
            queryClient.invalidateQueries({ queryKey: ['jornadas-abertas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao iniciar jornada');
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
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao finalizar jornada');
        },
    });
}