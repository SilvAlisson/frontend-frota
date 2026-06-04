import type { TipoProduto } from './veiculo';

export interface Jornada {
  id: string;
  dataInicio: string;
  dataFim?: string | null;
  kmInicio: number;
  kmFim?: number | null;
  fotoInicioUrl?: string | null;
  fotoFimUrl?: string | null;
  observacoes?: string | null;

  veiculo?: {
    id: string;
    placa: string;
    modelo: string;
  };
  operador?: {
    id: string;
    nome: string;
  };
  encarregado?: {
    id: string;
    nome: string;
  };
}

export interface ItemAbastecimento {
  id?: string;
  quantidade: number;
  valorPorUnidade: number;
  valorTotal?: number;
  produto: {
    id: string;
    nome: string;
    tipo: TipoProduto;
  };
}

export interface Abastecimento {
  id: string;
  dataHora: string;
  kmOdometro: number;
  custoTotal: number;

  veiculoId: string;
  fornecedorId?: string | null;

  placaCartaoUsado?: string | null;
  justificativa?: string | null;
  observacoes?: string | null;
  fotoNotaFiscalUrl: string | null;

  quantidade?: number | string;

  veiculo?: {
    id: string;
    placa: string;
    modelo: string;
  };
  operador?: {
    id: string;
    nome: string;
  };
  fornecedor?: {
    id: string;
    nome: string;
  };
  itens?: ItemAbastecimento[];
}

export type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA' | 'LAVAGEM';
export type StatusOS = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface ItemManutencao {
  id?: string;
  quantidade: number;
  valorPorUnidade: number;
  valorTotal?: number;
  produto: {
    id: string;
    nome: string;
    tipo?: TipoProduto;
  };
}

export interface OrdemServico {
  id: string;
  data: string;
  kmAtual: number | null;
  veiculoId: string | null;
  fornecedorId?: string | null;
  tipo: TipoManutencao;
  status: StatusOS;
  custoTotal: number;
  observacoes?: string | null;
  fotoComprovanteUrl?: string | null;

  veiculo?: {
    id: string;
    placa: string;
    modelo: string;
  } | null;

  encarregado?: {
    id: string;
    nome: string;
  };
  fornecedor?: {
    id: string;
    nome: string;
  };
  itens?: ItemManutencao[];
}
