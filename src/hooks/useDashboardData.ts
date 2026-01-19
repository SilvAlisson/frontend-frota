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

            const isOperador = user.role === 'OPERADOR';

            // LOG DE AUDITORIA 1: Início
            console.group("🔍 AUDITORIA DASHBOARD (Role: " + user.role + ")");
            console.log("1. Iniciando requisições...");

            const endpoints = {
                usuarios: '/users',
                veiculos: isOperador ? '/veiculos/operacao' : '/veiculos',
                produtos: isOperador ? '/produtos/operacao' : '/produtos',
                fornecedores: '/fornecedores',
                jornadas: isOperador ? '/jornadas/minhas-abertas-operador' : '/jornadas/abertas'
            };

            // Usamos allSettled para garantir que descobrimos QUAL falha
            const results = await Promise.allSettled([
                api.get<User[]>(endpoints.usuarios),
                api.get<Veiculo[]>(endpoints.veiculos),
                api.get<Produto[]>(endpoints.produtos),
                api.get<Fornecedor[]>(endpoints.fornecedores),
                api.get<Jornada[]>(endpoints.jornadas)
            ]);

            // LOG DE AUDITORIA 2: Análise Individual
            const logResult = (nome: string, res: any) => {
                if (res.status === 'fulfilled') {
                    const qtd = Array.isArray(res.value.data) ? res.value.data.length : 'N/A';
                    console.log(`✅ ${nome}: Sucesso (Itens: ${qtd})`);
                    return res.value.data;
                } else {
                    console.error(`❌ ${nome}: FALHOU!`, res.reason);
                    return []; // Retorna vazio para não quebrar a tela, mas avisa no console
                }
            };

            const dataFinal = {
                usuarios: logResult('Usuários', results[0]),
                veiculos: logResult('Veículos', results[1]),
                produtos: logResult('Produtos', results[2]),
                fornecedores: logResult('Fornecedores', results[3]),
                jornadasAtivas: logResult('Jornadas', results[4]),
            };

            console.groupEnd();
            return dataFinal;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });
}