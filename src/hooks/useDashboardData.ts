import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useDashboardData() {
    const { user } = useAuth();

    return useQuery({
        // A chave única do cache. Se o user.role mudar, ele refaz a busca.
        queryKey: ['dashboard-data', user?.role],

        // A função que busca os dados
        queryFn: async () => {
            if (!user) return null;

            // 1. Requisições Comuns (Todo mundo precisa)
            const requests = [
                api.get('/users'),         // 0
                api.get('/veiculos'),      // 1
                api.get('/produtos'),      // 2
                api.get('/fornecedores'),  // 3
            ];

            // 2. Requisições Específicas por Perfil
            if (user.role === 'OPERADOR') {
                requests.push(api.get('/jornadas/minhas-abertas-operador')); // 4
            } else if (user.role === 'ENCARREGADO') {
                requests.push(api.get('/jornadas/abertas')); // 4
            }

            // 3. Executa tudo em paralelo
            const responses = await Promise.all(requests);

            // 4. Retorna o objeto estruturado
            return {
                usuarios: responses[0].data,
                veiculos: responses[1].data,
                produtos: responses[2].data,
                fornecedores: responses[3].data,
                // Se tiver índice 4, pega o data, senão array vazio
                jornadasEspecificas: responses[4] ? responses[4].data : [],
            };
        },

        // Só executa se tiver usuário logado
        enabled: !!user,
    });
}