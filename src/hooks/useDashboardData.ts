import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useDashboardData() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['dashboard-data', user?.role],

        queryFn: async () => {
            if (!user) return null;

            // --- NOVO BLOCO: GATILHO DE LIMPEZA ---
            try {
                // Pede ao backend para verificar e fechar jornadas > 17h
                await api.post('/jornada/verificar-timeouts').catch(err => 
                    console.warn("Falha silenciosa ao verificar timeouts:", err)
                );
            } catch (e) {
                // Ignora erros para não travar o dashboard
            }
            // --------------------------------------

            const requests = [
                api.get('/users'),         // 0
                api.get('/veiculos'),      // 1
                api.get('/produtos'),      // 2
                api.get('/fornecedores'),  // 3
            ];

            if (user.role === 'OPERADOR') {
                requests.push(api.get('/jornadas/minhas-abertas-operador')); // 4
            } else if (user.role === 'ENCARREGADO' || user.role === 'ADMIN') {
                requests.push(api.get('/jornadas/abertas')); // 4
            }

            const responses = await Promise.all(requests);

            return {
                usuarios: responses[0].data,
                veiculos: responses[1].data,
                produtos: responses[2].data,
                fornecedores: responses[3].data,
                jornadasEspecificas: responses[4] ? responses[4].data : [],
            };
        },

        enabled: !!user,
        // Atualiza a cada 1 minuto para manter os dados frescos
        refetchInterval: 1000 * 60, 
    });
}