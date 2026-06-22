export interface DrilldownDataPoint {
  name: string;
  value: number;
  veiculoId?: string;
  formattedValue?: string; // Optional pre-formatted value for tooltip display
  customData?: Record<string, unknown>; // To allow passing the original object via Highcharts Point events, strictly typed
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
  [key: string]: any;
}
