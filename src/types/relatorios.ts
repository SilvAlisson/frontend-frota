export interface DocumentoLegal {
  id: string;
  titulo: string;
  descricao?: string | null;
  arquivoUrl: string;
  categoria: string;
  status: 'VIGENTE' | 'ARQUIVADO';
  tipoVeiculo?: string | null;
  veiculoId?: string | null;
  dataValidade?: string | null;
  
  documentoOrigemId?: string | null;
  documentoOrigem?: DocumentoLegal | null;
  renovacoes?: DocumentoLegal[];

  createdAt?: string;
  updatedAt: string;
}

export interface CreateDocumentoDTO {
  titulo: string;
  descricao?: string;
  arquivoUrl: string;
  categoria: string;
  dataValidade?: Date;
  tipoVeiculo?: string;
  veiculoId?: string;
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
  tipo: 'MANUTENCAO' | 'DOCUMENTO' | 'VEICULO_OCIOSO' | 'OPERADOR_OCIOSO' | 'TENTATIVA_FRAUDE' | 'ERRO_SISTEMA' | 'SST';
  nivel: 'VENCIDO' | 'ATENCAO' | 'PROJETADO';
  mensagem: string;
  veiculoId?: string;
  usuarioId?: string;
  logId?: string;
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

export interface SelectOption {
  label: string;
  value: string;
}
