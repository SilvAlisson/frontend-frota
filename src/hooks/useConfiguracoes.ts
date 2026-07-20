import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import axios from 'axios';

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
        } catch (err: unknown) {
            // axios.isAxiosError permite acessar response.data com segurança total
            const msg = axios.isAxiosError(err)
                ? (err.response?.data as { error?: string })?.error ?? 'Erro ao carregar configurações globais.'
                : 'Erro ao carregar configurações globais.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateConfig = async (payload: Partial<ConfiguracaoSistema>) => {
        try {
            const { data } = await api.put('/configuracoes', payload);
            setConfig(data);
            return data;
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data as { error?: string })?.error ?? 'Erro ao atualizar configurações.'
                : 'Erro ao atualizar configurações.';
            throw new Error(msg);
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
