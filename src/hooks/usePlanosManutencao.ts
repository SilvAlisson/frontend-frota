import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import axios from 'axios';
import { FILTRO_TODOS } from '../config/constants';
import { logger } from '../lib/logger';

// Tipos extraídos para garantir Strict Typing
export interface PlanoManutencao {
  id: string;
  veiculoId: string;
  categoria: string;
  descricao: string;
  tipoIntervalo: 'KM' | 'MESES';
  valorIntervalo: number;
  kmProximaManutencao?: number;
  dataProximaManutencao?: string;
  ativo: boolean;
  veiculo: {
    placa: string;
    modelo: string;
    ultimoKm: number;
  };
  historicoExecucoes?: Array<{
    id: string;
    dataExecucao: string;
    kmDaBaixa?: number;
    observacao?: string;
    registradoPor?: {
      nome: string;
    };
  }>;
}

interface RegisterExecucaoDTO {
  planoId: string;
  kmDaBaixa?: number;
  observacao?: string;
}

export function usePlanosManutencao(veiculoId?: string, filtroCategoria?: string, fetchAll: boolean = false) {
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams();
  if (veiculoId) queryParams.append('veiculoId', veiculoId);
  if (filtroCategoria && filtroCategoria !== FILTRO_TODOS) queryParams.append('categoria', filtroCategoria);

  const url = `/planos-manutencao${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const query = useQuery({
    queryKey: ['planos', veiculoId, filtroCategoria],
    queryFn: async () => {
      // Se não for modo global (fetchAll) e não tiver veiculoId, não faz fetch
      if (!fetchAll && !veiculoId) return [];
      
      try {
        const res = await api.get<PlanoManutencao[]>(url);
        return res.data;
      } catch (err) {
        logger.debug('Falha ao carregar planos de manutenção:', err);
        return [];
      }
    },
    // Habilita a query se for fetchAll, ou se tiver veiculoId (com a checagem de filtro)
    enabled: fetchAll || (!!veiculoId && (filtroCategoria === undefined || filtroCategoria === FILTRO_TODOS || !!filtroCategoria))
  });

  const registrarExecucaoMutation = useMutation({
    mutationFn: async (data: RegisterExecucaoDTO) => {
      await api.post(`/planos-manutencao/${data.planoId}/executar`, data);
    },
    onSuccess: () => {
      toast.success('Manutenção registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['planos'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Erro ao registrar manutenção.');
      }
    }
  });

  const excluirPlanoMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/planos-manutencao/${id}`);
    },
    onSuccess: () => {
      toast.success("Plano desativado e removido.");
      queryClient.invalidateQueries({ queryKey: ['planos'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Falha ao tentar remover o plano.");
      }
    }
  });

  return {
    planos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    // Devolvemos a data crua para manter compatibilidade com GestaoDocumentos
    data: query.data,
    registrarExecucao: registrarExecucaoMutation,
    excluirPlano: excluirPlanoMutation
  };
}
