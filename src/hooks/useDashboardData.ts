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
        // A query key inclui o role para forçar recarregamento se o nível de acesso mudar
        queryKey: ['dashboard-data', user?.role],

        queryFn: async () => {
            if (!user) throw new Error("Usuário não autenticado");

            const isOperador = user.role === 'OPERADOR';

            // ✅ SELEÇÃO DE ROTAS PADRONIZADA
            // Usamos as rotas "/operacao" para TODOS os perfis.
            // Elas são otimizadas para dropdowns, trazem o 'ultimoKm' e evitam erros 403.
            
            const endpointUsuarios = isOperador 
                ? '/users/encarregados' 
                : '/users';

            const results = await Promise.allSettled([
                api.get<User[]>(endpointUsuarios),
                
                // ALTERADO: Agora todos usam a rota leve/operacional
                api.get<Veiculo[]>('/veiculos/operacao'),       
                api.get<Produto[]>('/produtos/operacao'),       
                api.get<Fornecedor[]>('/fornecedores/operacao'), 
                
                api.get<Jornada[]>('/jornadas/abertas')
            ]);

            // Função auxiliar para extrair dados com segurança e logar erros
            const unwrap = <T>(result: PromiseSettledResult<{ data: T }>, context: string): T => {
                if (result.status === 'fulfilled') {
                    return result.value.data;
                } else {
                    console.warn(`[Dashboard] Falha ao carregar ${context}:`, result.reason);
                    // Retorna array vazio para evitar que a tela quebre (Tela branca)
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
        staleTime: 1000 * 60 * 2, // Cache de 2 minutos
        refetchInterval: 1000 * 60, // Atualiza a cada 1 minuto
        refetchOnWindowFocus: true,
    });
}