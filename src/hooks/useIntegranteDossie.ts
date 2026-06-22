import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User, Jornada, Treinamento, DefeitoVeiculo } from '../types';

export interface DossieResponse {
  user: User & {
    cargo?: { nome: string } | null;
    profile?: {
      cnhNumero?: string | null;
      cnhCategoria?: string | null;
      cnhValidade?: string | null;
    } | null;
    treinamentos: Treinamento[];
    defeitosRegistrados: (DefeitoVeiculo & { veiculo?: { placa: string } })[];
  };
  jornadas: (Jornada & { veiculo?: { placa: string } })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useIntegranteDossie(userId: string | undefined, page: number = 1) {
  return useQuery({
    queryKey: ['integranteDossie', userId, page],
    queryFn: async (): Promise<DossieResponse> => {
      const { data } = await api.get(`/users/${userId}/dossie?page=${page}`);
      return data;
    },
    enabled: !!userId,
  });
}
