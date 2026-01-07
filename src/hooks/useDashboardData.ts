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
        // A query key inclui o role, forçando recarregamento se o nível de acesso mudar
        queryKey: ['dashboard-data', user?.role],

        queryFn: async () => {
            if (!user) throw new Error("Usuário não autenticado");

            // ✅ LÓGICA DE ROTA INTELIGENTE:
            // Operador -> Rota leve e permitida (/users/encarregados)
            // Admin/Outros -> Rota completa (/users)
            const endpointUsuarios = user.role === 'OPERADOR' 
                ? '/users/encarregados' 
                : '/users';

            const results = await Promise.allSettled([
                api.get<User[]>(endpointUsuarios), // Rota dinâmica aqui
                api.get<Veiculo[]>('/veiculos'),
                api.get<Produto[]>('/produtos'),
                api.get<Fornecedor[]>('/fornecedores'),
                api.get<Jornada[]>('/jornadas/abertas')
            ]);

            // Função auxiliar para extrair dados com segurança e logar erros específicos
            const unwrap = <T>(result: PromiseSettledResult<{ data: T }>, context: string): T => {
                if (result.status === 'fulfilled') {
                    return result.value.data;
                } else {
                    console.warn(`[Dashboard] Falha ao carregar ${context}:`, result.reason);
                    // Retorna array vazio para evitar que a tela quebre
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