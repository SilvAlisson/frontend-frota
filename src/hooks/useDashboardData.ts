import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User, Veiculo, Produto, Fornecedor, Jornada } from '../types';

interface DashboardData {
    usuarios: User[];
    veiculos: Veiculo[];
    produtos: Produto[];
    fornecedores: Fornecedor[];
    jornadasAtivas: Jornada[];
}

export function useDashboardData() {
    const { user } = useAuth();

    return useQuery<DashboardData>({
        queryKey: ['dashboard-data', user?.role],

        queryFn: async () => {
            if (!user) throw new Error("Usuário não autenticado");

            // BLINDAGEM: Usamos allSettled para que o erro de uma única requisição
            // (ex: falha ao carregar fornecedores) não derrube todo o painel.
            const results = await Promise.allSettled([
                api.get<User[]>('/user'),
                api.get<Veiculo[]>('/veiculos'),
                api.get<Produto[]>('/produto'),
                api.get<Fornecedor[]>('/fornecedor'),
                api.get<Jornada[]>('/jornada/abertas')
            ]);

            // Função auxiliar para extrair dados com segurança
            const unwrap = <T>(result: PromiseSettledResult<{ data: T }>, context: string): T => {
                if (result.status === 'fulfilled') {
                    return result.value.data;
                } else {
                    console.warn(`[Dashboard] Falha parcial ao carregar ${context}:`, result.reason);
                    // Retorna array vazio para a interface não quebrar com undefined
                    return [] as any;
                }
            };

            return {
                usuarios: unwrap(results[0], 'usuários'),
                veiculos: unwrap(results[1], 'veículos'),
                produtos: unwrap(results[2], 'produtos'),
                fornecedores: unwrap(results[3], 'fornecedores'),
                jornadasAtivas: unwrap(results[4], 'jornadas'),
            };
        },

        enabled: !!user,

        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60,
        refetchOnWindowFocus: true,
    });
}