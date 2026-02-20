import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { DocumentoLegal, CreateDocumentoDTO } from '../types';

interface FiltrosDocumentos {
    categoria?: string;
    veiculoId?: string;
}

const handleApiError = (error: unknown, mensagemPadrao: string) => {
    console.error(`[API Error] ${mensagemPadrao}:`, error);
    if (isAxiosError(error)) {
        const msg = error.response?.data?.error || error.response?.data?.message;
        if (msg) return toast.error(msg);
        if (error.code === 'ERR_NETWORK') return toast.error("Erro de conexão com o servidor.");
    }
    toast.error(mensagemPadrao);
};

// --- LISTAR ---
export function useDocumentosLegais(filtros?: FiltrosDocumentos) {
    return useQuery({
        queryKey: ['documentos-legais', filtros],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros?.categoria && filtros.categoria !== 'TODOS') {
                params.append('categoria', filtros.categoria);
            }
            if (filtros?.veiculoId) {
                params.append('veiculoId', filtros.veiculoId);
            }

            const { data } = await api.get<DocumentoLegal[]>(`/documentos-legais?${params.toString()}`);
            return data;
        },
        staleTime: 1000 * 60 * 5,
        retry: (failureCount, error: unknown) => {
            if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
            return failureCount < 3;
        }
    });
}

// --- CRIAR ---
export function useCreateDocumento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (novoDoc: CreateDocumentoDTO) => {
            const { data } = await api.post('/documentos-legais', novoDoc);
            return data;
        },
        onSuccess: () => {
            toast.success('Documento arquivado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['documentos-legais'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao salvar documento');
        }
    });
}

// --- DELETAR ---
export function useDeleteDocumento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/documentos-legais/${id}`);
        },
        onSuccess: () => {
            toast.success('Documento removido!');
            queryClient.invalidateQueries({ queryKey: ['documentos-legais'] });
        },
        onError: (error: unknown) => {
            handleApiError(error, 'Erro ao remover documento');
        }
    });
}