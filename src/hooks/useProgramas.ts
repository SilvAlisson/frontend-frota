import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface UsuarioConvocacao {
  id: string;
  userId: string;
  convocacaoId: string;
  status: 'PENDENTE' | 'AGENDADO' | 'REALIZADO' | 'VENCIDO';
  user: {
    id: string;
    nome: string;
    email: string;
    status: string;
  };
}

export interface Convocacao {
  id: string;
  titulo: string;
  programaId: string;
  dataLimite: string;
  usuarios: UsuarioConvocacao[];
}

export interface ProgramaMacro {
  id: string;
  nome: string;
  tipo: 'PCMSO' | 'PGR' | 'TREINAMENTO' | 'OUTRO';
  descricao?: string;
  vigenciaFim?: string;
  createdAt: string;
  convocacoes: Convocacao[];
}

export function useProgramas() {
  return useQuery<ProgramaMacro[]>({
    queryKey: ['programas-macro'],
    queryFn: async () => {
      const response = await api.get('/rh/programas');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
