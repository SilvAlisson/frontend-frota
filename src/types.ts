// =========================================
// ENTIDADES PRINCIPAIS (Dados Mestre)
// =========================================

export type UserRole = 'ADMIN' | 'ENCARREGADO' | 'OPERADOR' | 'RH' | 'COORDENADOR';

export interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  role: UserRole;
  // RH Fields
  cnhNumero?: string | null;
  cnhCategoria?: string | null;
  cnhValidade?: string | null; // ISO Date string
  dataAdmissao?: string | null; // ISO Date string
}

export type TipoCombustivel = 'DIESEL_S10' | 'GASOLINA_COMUM' | 'ETANOL' | 'GNV';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  tipoVeiculo: string | null;
  tipoCombustivel: TipoCombustivel;
  capacidadeTanque: number | null;
  vencimentoCiv?: string | null;
  vencimentoCipp?: string | null;
  ultimoKm?: number; // Campo calculado que vem do backend em getById
}

export type TipoProduto = 'COMBUSTIVEL' | 'ADITIVO' | 'SERVICO' | 'OUTRO';

export interface Produto {
  id: string;
  nome: string;
  tipo: TipoProduto;
  unidadeMedida: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
}

// =========================================
// OPERAÇÕES (Jornadas, Abastecimentos, Manutenções)
// =========================================

// --- JORNADA ---
export interface Jornada {
  id: string;
  dataInicio: string; // ISO Date string
  dataFim?: string | null;
  kmInicio: number;
  kmFim?: number | null;
  fotoInicioUrl?: string | null;
  fotoFimUrl?: string | null;
  observacoes?: string | null;

  // Relacionamentos
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
  };
  operador: {
    id: string;
    nome: string;
  };
  encarregado?: {
    id: string;
    nome: string;
  };
}

// --- ABASTECIMENTO ---
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
  placaCartaoUsado?: string | null;
  justificativa?: string | null;
  observacoes?: string | null;
  fotoNotaFiscalUrl: string | null;

  veiculo: {
    placa: string;
    modelo: string;
  };
  operador: {
    nome: string;
  };
  fornecedor: {
    nome: string;
  };
  itens: ItemAbastecimento[];
}

// --- MANUTENÇÃO (Ordem de Serviço) ---
export type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA' | 'LAVAGEM';

export interface ItemManutencao {
  id?: string;
  quantidade: number;
  valorPorUnidade: number;
  valorTotal?: number;
  produto: {
    id: string;
    nome: string;
    tipo?: string;
  };
}

export interface OrdemServico {
  id: string;
  data: string;
  kmAtual: number;
  tipo: TipoManutencao;
  custoTotal: number;
  observacoes?: string | null;
  fotoComprovanteUrl?: string | null;

  veiculo: {
    placa: string;
    modelo: string;
  };
  encarregado: {
    nome: string;
  };
  fornecedor: {
    nome: string;
  };
  itens: ItemManutencao[];
}

// =========================================
// GESTÃO E RELATÓRIOS
// =========================================

export type TipoIntervaloManutencao = 'KM' | 'TEMPO';

export interface PlanoManutencao {
  id: string;
  descricao: string;
  tipoIntervalo: TipoIntervaloManutencao;
  valorIntervalo: number;
  kmProximaManutencao?: number | null;
  dataProximaManutencao?: string | null;
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
  };
}

export interface Alerta {
  tipo: 'DOCUMENTO' | 'MANUTENCAO';
  nivel: 'VENCIDO' | 'ATENCAO';
  mensagem: string;
}

export interface OperadorRanking {
  id: string;
  nome: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
}

export interface KpiData {
  custoTotalGeral: number;
  custoTotalCombustivel: number;
  custoTotalAditivo: number;
  custoTotalManutencao: number;
  kmTotalRodado: number;
  litrosTotaisConsumidos: number;
  consumoMedioKML: number;
  custoMedioPorKM: number;
}

// =========================================
// HELPERS & UI TYPES (Auxiliares)
// =========================================

export interface SelectOption {
  label: string;
  value: string;
}

export interface VeiculoSimplificado {
  id: string;
  placa: string;
  modelo: string;
}

export interface UsuarioSimplificado {
  id: string;
  nome: string;
  role: string;
}