import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User, Veiculo, Produto, Fornecedor, Jornada } from '../types';

// Interface que define exatamente o formato dos dados que o Dashboard espera
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
        // A chave inclui o role para garantir que o cache muda se o perfil mudar
        queryKey: ['dashboard-data', user?.role],

        queryFn: async () => {
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Definir as requisições estáticas (sem await, para iniciar em paralelo)
            const usersReq = api.get<User[]>('/user');
            const veiculosReq = api.get<Veiculo[]>('/veiculos');
            const produtosReq = api.get<Produto[]>('/produto');
            const fornecedoresReq = api.get<Fornecedor[]>('/fornecedor');

            // 2. Definir a requisição condicional de Jornadas
            let jornadasReq;
            if (user.role === 'OPERADOR') {
                jornadasReq = api.get<Jornada[]>('/jornada/minhas-abertas-operador');
            } else {
                // ADMIN, ENCARREGADO, RH veem todas as abertas
                jornadasReq = api.get<Jornada[]>('/jornada/abertas');
            }

            // 3. Executar todas em paralelo
            // O TypeScript agora entende que o resultado é uma tupla fixa [User[], Veiculo[], ...]
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

            // 4. Retornar o objeto montado correspondendo à interface DashboardData
            return {
                usuarios: usersRes.data,
                veiculos: veiculosRes.data,
                produtos: produtosRes.data,
                fornecedores: fornecedoresRes.data,
                jornadasAtivas: jornadasRes.data,
            };
        },

        // Só executa se houver usuário logado
        enabled: !!user,

        // Configurações de Cache e Performance
        staleTime: 1000 * 60 * 2, // Dados considerados frescos por 2 minutos
        refetchInterval: 1000 * 60, // Recarrega suavemente a cada 1 minuto
        refetchOnWindowFocus: true, // Garante dados frescos ao voltar para a aba
        retry: 1, // Tenta novamente 1 vez em caso de falha de rede
    });
}