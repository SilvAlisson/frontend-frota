import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { handleApiError } from '../utils/errorHandler';

export interface Aso {
  id: string;
  tipo: 'ADMISSIONAL' | 'PERIODICO' | 'MUDANCA_RISCO' | 'RETORNO_TRABALHO' | 'DEMISSIONAL';
  dataRealizacao: string;
  dataVencimento?: string | null;
  resultado: 'APTO' | 'INAPTO';
  medico?: string | null;
  crm?: string | null;
  comprovanteUrl?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type AsoForm = Omit<Aso, 'id' | 'createdAt' | 'updatedAt'>;

export function useAso(userId: string) {
  const queryClient = useQueryClient();

  const listarQuery = useQuery({
    queryKey: ['asos', userId],
    queryFn: async () => {
      const res = await api.get<Aso[]>(`/aso?userId=${userId}`);
      return res.data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (data: AsoForm) => {
      const res = await api.post<Aso>('/aso', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asos', userId] });
      queryClient.invalidateQueries({ queryKey: ['matriz'] });
      toast.success('ASO registrado com sucesso!');
    },
    onError: (err) => {
      handleApiError(err);
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/aso/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asos', userId] });
      queryClient.invalidateQueries({ queryKey: ['matriz'] });
      toast.success('ASO excluído com sucesso.');
    },
    onError: (err) => {
      handleApiError(err);
    },
  });

  return {
    listarQuery,
    criarMutation,
    deletarMutation,
  };
}
