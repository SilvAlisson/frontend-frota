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

            const usersReq = api.get<User[]>('/user');
            const veiculosReq = api.get<Veiculo[]>('/veiculos');
            const produtosReq = api.get<Produto[]>('/produto');
            const fornecedoresReq = api.get<Fornecedor[]>('/fornecedor');

            const jornadasReq = api.get<Jornada[]>('/jornada/abertas');

            const [
                usersRes,
                veiculosRes,
                produtosRes,
                fornecedoresRes,
                jornadasRes
            ] = await Promise.all([
                usersReq,
                veiculosReq,
                produtosReq,
                fornecedoresReq,
                jornadasReq
            ]);

            return {
                usuarios: usersRes.data,
                veiculos: veiculosRes.data,
                produtos: produtosRes.data,
                fornecedores: fornecedoresRes.data,
                jornadasAtivas: jornadasRes.data,
            };
        },

        enabled: !!user,

        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60,
        refetchOnWindowFocus: true,
    });
}