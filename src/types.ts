export type UserRole = 'ADMIN' | 'ENCARREGADO' | 'OPERADOR' | 'RH' | 'COORDENADOR';

// [OPCIONAL] Tipagem forte para CNH evita erros de digitação ("B" vs "b")
export type CategoriaCNH = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE';

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
  cnhCategoria?: CategoriaCNH | string | null; // Aceita string para compatibilidade, mas prefira o tipo
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

  // NOVO: Relacionamento para filtragem inteligente
  // Permite saber quais produtos este fornecedor oferece
  produtosOferecidos?: {
    id: string;
    nome: string;
    tipo?: TipoProduto;
  }[];
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

  // [CORREÇÃO] Relacionamentos opcionais (?)
  // Evita crash se a query não incluir o join
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

  // Relacionamentos opcionais
  veiculo?: {
    id: string;
    placa: string;
    modelo: string;
  };
  operador?: {
    nome: string;
  };
  fornecedor?: {
    nome: string;
  };
  itens?: ItemAbastecimento[];
}

// --- MANUTENÇÃO (Ordem de Serviço) ---
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
    tipo?: TipoProduto; // [CORREÇÃO] Uso do Enum aqui
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
  // E opcional (?) caso não venha no join
  veiculo?: {
    id: string;
    placa: string;
    modelo: string;
  } | null;

  encarregado?: {
    nome: string;
  };
  fornecedor?: {
    nome: string;
  };
  itens?: ItemManutencao[];
}

// =========================================
// GESTÃO E RELATÓRIOS
// =========================================

export interface DocumentoLegal {
  id: string;
  titulo: string;
  descricao?: string | null;
  arquivoUrl: string;
  categoria: string;
  tipoVeiculo?: string | null;
  veiculoId?: string | null; // <--- NOVO: ID para documentos específicos de placa
  dataValidade?: string | null;
  createdAt?: string;
  updatedAt: string;
}

// DTO para Criação (Usado nos Hooks)
export interface CreateDocumentoDTO {
  titulo: string;
  descricao?: string;
  arquivoUrl: string;
  categoria: string;
  dataValidade?: Date;
  tipoVeiculo?: string;
  veiculoId?: string; // <--- NOVO: ID para envio no cadastro
}

export type TipoIntervaloManutencao = 'KM' | 'TEMPO';

export interface PlanoManutencao {
  id: string;
  descricao: string;
  tipoIntervalo: TipoIntervaloManutencao;
  valorIntervalo: number;

  kmProximaManutencao?: number | null;
  dataProximaManutencao?: string | null;

  veiculoId: string;

  veiculo?: {
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