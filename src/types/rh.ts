export interface TreinamentoObrigatorio {
  id: string;
  nome: string;
  validadeMeses: number;
  diasAntecedenciaAlerta: number;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao?: string | null;
  requisitos: TreinamentoObrigatorio[];
  _count?: {
    colaboradores: number;
  };
}

export interface TreinamentoRealizado {
  id: string;
  nome: string;
  descricao?: string | null;
  dataRealizacao: string;
  dataVencimento?: string | null;
  comprovanteUrl?: string | null;
  userId: string;
  status?: 'CONCLUIDO' | 'PENDENTE';
  isObrigatorio?: boolean;
}
