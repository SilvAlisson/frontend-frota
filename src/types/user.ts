export type UserRole = 'ADMIN' | 'ENCARREGADO' | 'OPERADOR' | 'RH' | 'COORDENADOR' | 'AUXILIAR_OPERACIONAL';
export type StatusOperador = 'ATIVO' | 'FERIAS' | 'ATESTADO' | 'AFASTADO';

export type CategoriaCNH = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE';

export interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  role: UserRole;
  cargo: string | null;
  cargoId?: string | null;
  fotoUrl?: string | null;
  image?: string | null;
  loginToken?: string | null;
  status?: StatusOperador;

  cnhNumero?: string | null;
  cnhCategoria?: CategoriaCNH | string | null;
  cnhValidade?: string | null;
  dataAdmissao?: string | null;
}

export interface UsuarioSimplificado {
  id: string;
  nome: string;
  role: string;
}
