import { api } from '../../services/api';
import type { TreinamentoRealizado } from '../../types';

export interface CreateTreinamentoPayload {
    userId: string;
    nome: string;
    dataRealizacao: string;
    dataVencimento: string | null;
    descricao: string | null;
    comprovanteUrl: string | null;
    diasAntecedenciaAlerta: number;
}

export interface Requisito {
    id: string;
    nome: string;
    diasAntecedenciaAlerta: number;
}

export interface CargoResponse {
    id: string;
    requisitos?: Requisito[];
}

export const treinamentosService = {
    async getByUserId(userId: string): Promise<TreinamentoRealizado[]> {
        try {
            const { data } = await api.get<TreinamentoRealizado[]>(`/treinamentos/usuario/${userId}`);
            return data;
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) return [];
            throw err;
        }
    },

    async getCargos(): Promise<CargoResponse[]> {
        const { data } = await api.get<CargoResponse[]>('/cargos');
        return data;
    },

    async create(payload: CreateTreinamentoPayload): Promise<TreinamentoRealizado> {
        const { data } = await api.post<TreinamentoRealizado>('/treinamentos', payload);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/treinamentos/${id}`);
    },

    async importar(userId: string, treinamentos: Record<string, unknown>[]): Promise<void> {
        await api.post('/treinamentos/importar', { userId, treinamentos });
    }
};
