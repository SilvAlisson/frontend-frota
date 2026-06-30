import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Exigencia {
  tipo: 'CNH' | 'ASO' | 'FIT_TEST' | 'TREINAMENTO' | 'OBRIGATORIO';
  nome: string;
  validade: string | null;
  status: 'VÁLIDO' | 'VENCENDO' | 'VENCIDO' | 'FALTANTE';
}

export interface IntegranteMatriz {
  userId: string;
  nome: string;
  cargo: string;
  image?: string | null;
  exigencias: Exigencia[];
}

export function useMatrizQualificacao() {
  return useQuery<IntegranteMatriz[]>({
    queryKey: ['matriz-qualificacao'],
    queryFn: async () => {
      const response = await api.get('/rh/matriz');
      // Filtra usuários de teste
      return response.data.filter((u: IntegranteMatriz) => !u.nome.toLowerCase().includes('testando') && !u.nome.toLowerCase().includes('teste'));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}
