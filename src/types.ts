// =========================================
// ENTIDADES PRINCIPAIS (Dados Mestre)
// =========================================

export interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  role: 'ADMIN' | 'ENCARREGADO' | 'OPERADOR';
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  tipoVeiculo: string | null;
  vencimentoCiv?: string | null;
  vencimentoCipp?: string | null;
}

export interface Produto {
  id: string;
  nome: string;
  tipo: string; // "COMBUSTIVEL" | "ADITIVO" | "SERVICO" | "OUTRO"
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
  
  // Relacionamentos (Geralmente vêm expandidos da API)
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
  };
  operador: {
    id: string;
    nome: string;
  };
  encarregado?: { // Pode ser nulo se não expandido ou opcional
    id: string;
    nome: string;
  };
}

// --- ABASTECIMENTO ---
export interface ItemAbastecimento {
  id?: string;
  quantidade: number;
  valorPorUnidade: number;
  produto: {
    nome: string;
    tipo: string;
  };
}

export interface Abastecimento {
  id: string;
  dataHora: string;
  kmOdometro: number;
  custoTotal: number;
  placaCartaoUsado?: string | null;
  justificativa?: string | null;
  fotoNotaFiscalUrl?: string | null;

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
export interface ItemManutencao {
  id?: string;
  quantidade: number;
  valorPorUnidade: number;
  produto: {
    nome: string;
    tipo?: string;
  };
}

export interface OrdemServico {
  id: string;
  data: string;
  kmAtual: number;
  tipo: string; // "PREVENTIVA" | "CORRETIVA" | "LAVAGEM"
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

export interface PlanoManutencao {
  id: string;
  descricao: string;
  tipoIntervalo: 'KM' | 'TEMPO';
  valorIntervalo: number;
  kmProximaManutencao?: number | null;
  dataProximaManutencao?: string | null;
  veiculo: {
    id: string; // Útil para formulários
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