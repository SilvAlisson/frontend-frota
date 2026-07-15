import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

export interface ConfiguracaoSistema {
    id: string;
    diasAntecedenciaAlerta: number;
    kmAntecedenciaAlerta: number;
    bloqueioOperacionalAtivo: boolean;
    updatedAt: string;
}

export function useConfiguracoes() {
    const [config, setConfig] = useState<ConfiguracaoSistema | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const { data } = await api.get('/configuracoes');
            setConfig(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar configurações globais.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateConfig = async (payload: Partial<ConfiguracaoSistema>) => {
        try {
            const { data } = await api.put('/configuracoes', payload);
            setConfig(data);
            return data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Erro ao atualizar configurações.');
        }
    };

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    return {
        config,
        isLoading,
        error,
        updateConfig,
        refetch: fetchConfig
    };
}
