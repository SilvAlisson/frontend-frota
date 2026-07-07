import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface RadarCard {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  cargo: string;
  tipo: 'CNH' | 'ASO' | 'TREINAMENTO';
  nomeExigencia: string;
  validade: string | null;
  diasParaVencer: number;
  coluna: 'CRITICO' | 'ALERTA' | 'ATENCAO' | 'AGENDADO';
  agendamentoId?: string;
  dataAgendada?: string;
}

export function useRadarSST() {
  const queryClient = useQueryClient();

  const query = useQuery<RadarCard[]>({
    queryKey: ['radarSST'],
    queryFn: async () => {
      const response = await api.get('/api/rh/radar');
      return response.data;
    },
  });

  const agendarMutate = useMutation({
    mutationFn: async (payload: { userId: string, tipo: string, nomeExigencia: string, status: string }) => {
      const response = await api.post('/api/rh/radar/agendar', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radarSST'] });
      toast.success('Radar atualizado com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar agendamento do Radar.');
    }
  });

  return {
    cards: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    agendarItem: agendarMutate.mutateAsync
  };
}
