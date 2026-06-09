import { api } from '../services/api';
import type { DrilldownDataPoint, MetricType } from '../types/analytics';

/**
 * Strategy pattern to eliminate large if-else chains based on metric type.
 * Each metric defines its own endpoints and parameters for each drill-down level.
 */

type FetchFn = (veiculoId?: string | null, categoria?: string | null, mes?: string | null) => Promise<DrilldownDataPoint[]>;

interface DrilldownStrategy {
  fetchMacro: () => Promise<DrilldownDataPoint[]>;
  fetchLevel2: FetchFn;
  fetchLevel3: FetchFn;
  fetchLevel4: FetchFn;
  fetchLevel5?: (veiculoId?: string | null, categoria?: string | null, mes?: string | null, fornecedorNome?: string | null) => Promise<import('../types/analytics').TicketDrilldown[]>;
  getNextLevelFrom1: () => 2 | 3;
}

const defaultFallback = (value: number, message: string) => [{ name: message, value }];

export const ANALYTICS_STRATEGIES: Record<NonNullable<MetricType>, DrilldownStrategy> = {
  CUSTO_GLOBAL: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/macro')).data,
    fetchLevel2: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/veiculo', { params: { veiculoId } });
      return data.length > 0 ? data : defaultFallback(100, 'Sem dados no veículo');
    },
    fetchLevel3: async (veiculoId, categoria) => {
      const catReq = categoria === 'Abastecimento' ? 'ABASTECIMENTO' : 'MANUTENCAO';
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/temporal', { params: { veiculoId, categoria: catReq } });
      return data.length > 0 ? data : defaultFallback(100, 'Sem evolução temporal');
    },
    fetchLevel4: async (veiculoId, categoria, mes) => {
      const catReq = categoria === 'Abastecimento' ? 'ABASTECIMENTO' : 'MANUTENCAO';
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/fornecedores', { params: { veiculoId, categoria: catReq, mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum fornecedor encontrado');
    },
    fetchLevel5: async (veiculoId, categoria, mes, fornecedorNome) => {
      const catReq = categoria === 'Abastecimento' ? 'ABASTECIMENTO' : 'MANUTENCAO';
      const { data } = await api.get<import('../types/analytics').TicketDrilldown[]>('/drilldown/fornecedores/tickets', { params: { veiculoId, categoria: catReq, mes, fornecedorNome } });
      return data;
    },
    getNextLevelFrom1: () => 2,
  },
  COMBUSTIVEL: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/macro', { params: { categoria: 'ABASTECIMENTO' } })).data,
    fetchLevel2: async () => [], // Skips level 2
    fetchLevel3: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/temporal', { params: { veiculoId, categoria: 'ABASTECIMENTO' } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum dado');
    },
    fetchLevel4: async (veiculoId, _cat, mes) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/fornecedores', { params: { veiculoId, categoria: 'ABASTECIMENTO', mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum fornecedor encontrado');
    },
    fetchLevel5: async (veiculoId, _cat, mes, fornecedorNome) => {
      const { data } = await api.get<import('../types/analytics').TicketDrilldown[]>('/drilldown/fornecedores/tickets', { params: { veiculoId, categoria: 'ABASTECIMENTO', mes, fornecedorNome } });
      return data;
    },
    getNextLevelFrom1: () => 3,
  },
  ADITIVOS: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/macro', { params: { categoria: 'ADITIVO' } })).data,
    fetchLevel2: async () => [],
    fetchLevel3: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/temporal', { params: { veiculoId, categoria: 'ADITIVO' } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum dado');
    },
    fetchLevel4: async (veiculoId, _cat, mes) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/fornecedores', { params: { veiculoId, categoria: 'ADITIVO', mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum fornecedor encontrado');
    },
    fetchLevel5: async (veiculoId, _cat, mes, fornecedorNome) => {
      const { data } = await api.get<import('../types/analytics').TicketDrilldown[]>('/drilldown/fornecedores/tickets', { params: { veiculoId, categoria: 'ADITIVO', mes, fornecedorNome } });
      return data;
    },
    getNextLevelFrom1: () => 3,
  },
  OFICINA: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/macro', { params: { categoria: 'MANUTENCAO' } })).data,
    fetchLevel2: async () => [],
    fetchLevel3: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/temporal', { params: { veiculoId, categoria: 'MANUTENCAO' } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum dado');
    },
    fetchLevel4: async (veiculoId, _cat, mes) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/fornecedores', { params: { veiculoId, categoria: 'MANUTENCAO', mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum fornecedor encontrado');
    },
    fetchLevel5: async (veiculoId, _cat, mes, fornecedorNome) => {
      const { data } = await api.get<import('../types/analytics').TicketDrilldown[]>('/drilldown/fornecedores/tickets', { params: { veiculoId, categoria: 'MANUTENCAO', mes, fornecedorNome } });
      return data;
    },
    getNextLevelFrom1: () => 3,
  },
  KM_TOTAL: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/km/macro')).data,
    fetchLevel2: async () => [],
    fetchLevel3: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/km/temporal', { params: { veiculoId } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum dado');
    },
    fetchLevel4: async (veiculoId, _cat, mes) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/km/operadores', { params: { veiculoId, mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum operador encontrado');
    },
    getNextLevelFrom1: () => 3,
  },
  EFICIENCIA: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/eficiencia/macro')).data,
    fetchLevel2: async () => [],
    fetchLevel3: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/eficiencia/temporal', { params: { veiculoId } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum dado');
    },
    fetchLevel4: async (veiculoId, _cat, mes) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/km/operadores', { params: { veiculoId, mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum operador encontrado');
    },
    getNextLevelFrom1: () => 3,
  },
  CUSTO_KM: {
    fetchMacro: async () => (await api.get<DrilldownDataPoint[]>('/drilldown/custokm/macro')).data,
    fetchLevel2: async () => [],
    fetchLevel3: async (veiculoId) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/custokm/temporal', { params: { veiculoId } });
      return data.length > 0 ? data : defaultFallback(100, 'Nenhum dado');
    },
    fetchLevel4: async (veiculoId, _cat, mes) => {
      const { data } = await api.get<DrilldownDataPoint[]>('/drilldown/custokm/categorias', { params: { veiculoId, mes } });
      return data.length > 0 ? data : defaultFallback(100, 'Sem custos registrados');
    },
    getNextLevelFrom1: () => 3,
  }
};
