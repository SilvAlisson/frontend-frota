export type UserRole = 'ADMIN' | 'ENCARREGADO' | 'OPERADOR' | 'RH' | 'COORDENADOR';

export interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  role: UserRole;
  cargo: UserRole;
  fotoUrl?: string | null;
  loginToken?: string | null;

  // RH Fields
  cnhNumero?: string | null;
  cnhCategoria?: string | null;
  cnhValidade?: string | null;
  dataAdmissao?: string | null;
}

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

  veiculoId: string;

  placaCartaoUsado?: string | null;
  justificativa?: string | null;
  observacoes?: string | null;
  fotoNotaFiscalUrl: string | null;

  veiculo: {
    id: string;
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
export type StatusOS = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'; // NOVO: Workflow de OS

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

  // Aceita null para equipamentos/caixas (manutenção externa)
  kmAtual: number | null;

  // ID raiz para edição
  veiculoId: string | null;

  tipo: TipoManutencao;
  status: StatusOS;

  custoTotal: number;
  observacoes?: string | null;
  fotoComprovanteUrl?: string | null;

  // Veículo pode ser null (ex: conserto de peça avulsa)
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
  } | null;

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
  tipo: 'MANUTENCAO' | 'DOCUMENTO';
  nivel: 'VENCIDO' | 'ATENCAO' | 'PROJETADO';
  mensagem: string;
}

export interface DadosEvolucaoKm {
  data: string;
  km: number;
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
// RH & CARGOS
// =========================================

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