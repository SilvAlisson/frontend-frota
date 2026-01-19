import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { DocumentoLegal, CreateDocumentoDTO } from '../types';

interface FiltrosDocumentos {
    categoria?: string;
    veiculoId?: string; // Para a busca inteligente do backend
}

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
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
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
        onError: (error: any) => {
            console.error("Erro ao criar documento:", error);
            toast.error(error.response?.data?.message || 'Erro ao salvar documento');
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
        onError: (error: any) => {
            console.error("Erro ao deletar documento:", error);
            toast.error('Erro ao remover documento.');
        }
    });
}