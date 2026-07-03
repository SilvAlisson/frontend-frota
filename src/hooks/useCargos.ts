import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface Cargo {
  id: string;
  nome: string;
  descricao?: string;
}

export function useCargos() {
  return useQuery<Cargo[]>({
    queryKey: ['cargos'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/cargos');
        return data;
      } catch (err: any) {
        toast.error('Erro ao carregar os cargos');
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}
