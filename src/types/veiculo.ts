import type { OrdemServico, Abastecimento } from './operacoes';

export type TipoCombustivel = 'DIESEL_S10' | 'GASOLINA_COMUM' | 'ETANOL' | 'GNV';
export type StatusVeiculo = 'ATIVO' | 'EM_MANUTENCAO' | 'INATIVO';

export interface Veiculo {
  id: string;
  placa: string;
  marca: string | null;
  modelo: string;
  ano: number;
  tipoVeiculo: string | null;
  tipoCombustivel: TipoCombustivel;
  capacidadeTanque: number | null;

  status: StatusVeiculo;

  vencimentoCiv?: string | null;
  vencimentoCipp?: string | null;
  ultimoKm?: number;

  ordensServico?: OrdemServico[];
  abastecimentos?: Abastecimento[];

  // FIX: any removido
  resumoFinanceiro?: Record<string, unknown>;
}

export type TipoProduto = 'COMBUSTIVEL' | 'ADITIVO' | 'LAVAGEM' | 'PECA' | 'SERVICO' | 'OUTRO';

export interface Produto {
  id: string;
  nome: string;
  tipo: TipoProduto;
  unidadeMedida: string;
}

export type TipoFornecedor = 'POSTO' | 'OFICINA' | 'LAVA_JATO' | 'SEGURADORA' | 'OUTROS';

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  tipo: TipoFornecedor;

  produtosOferecidos?: {
    id: string;
    nome: string;
    tipo?: TipoProduto;
  }[];
}

export interface VeiculoSimplificado {
  id: string;
  placa: string;
  modelo: string;
}
