import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext'; // Importe o Auth

// --- Tipagem (Baseada no seu Prisma Schema) ---
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

// --- HOOKS ---

// 1. Listar Jornadas Abertas (GET)
export function useJornadasAbertas() {
    const { user } = useAuth(); // Pegamos o usuário

    return useQuery({
        // Adicionamos o role na chave para forçar atualização se o usuário mudar
        queryKey: ['jornadas-abertas', user?.role],

        queryFn: async () => {
            // ✅ SELEÇÃO DE ROTA INTELIGENTE
            // Operador vê apenas as suas. Admin/Gestor vê todas.
            const endpoint = user?.role === 'OPERADOR'
                ? '/jornadas/minhas-abertas-operador'
                : '/jornadas/abertas';

            const response = await api.get<Jornada[]>(endpoint);
            return response.data;
        },
        enabled: !!user, // Só busca se estiver logado
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
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] }); // Atualiza o painel principal
        },
        onError: (error: any) => {
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
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || 'Erro ao finalizar jornada';
            toast.error(msg);
        },
    });
}