export interface DrilldownDataPoint {
  name: string;
  value: number;
  veiculoId?: string;
  formattedValue?: string; // Valor pré-formatado opcional para exibição no tooltip
  customData?: Record<string, unknown>; // Permite passar o objeto original via eventos do Highcharts Point
}

export type MetricType = 
  | 'CUSTO_GLOBAL' 
  | 'KM_TOTAL' 
  | 'EFICIENCIA' 
  | 'COMBUSTIVEL' 
  | 'OFICINA' 
  | 'ADITIVOS' 
  | 'CUSTO_KM' 
  | null;

export interface TicketDrilldown {
  id: string;
  data: string;
  placa?: string;
  servicoProduto: string;
  valor: number;
  // Campos opcionais retornados dependendo da categoria (MANUTENCAO inclui os)
  os?: string;
  quantidade?: number;
}
