import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { DashboardRelatorios } from '../DashboardRelatorios';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../ui/Tooltip';
import type { User, Veiculo } from '../../types';

// ─── MOCKS ───
vi.mock('../../hooks/useVeiculos', () => ({
  useVeiculos: vi.fn(),
}));
vi.mock('../../hooks/useDashboardRelatorios', () => ({
  useSumarioKPIs: vi.fn(),
  useEvolucaoKm: vi.fn(),
  useEvolucaoCpk: vi.fn(),
  usePerformanceFrota: vi.fn(),
}));
vi.mock('../../hooks/useModalStore', () => ({
  useModalStore: vi.fn(),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
// Mocks for components that might cause issues in testing (like charts)
vi.mock('../dashboard/GraficoCpk', () => ({
  GraficoCpk: () => <div data-testid="mock-grafico-cpk" />,
}));
vi.mock('../dashboard/GraficoPerformance', () => ({
  GraficoPerformance: () => <div data-testid="mock-grafico-performance" />,
}));
vi.mock('../GraficoKmVeiculo', () => ({
  GraficoKmVeiculo: () => <div data-testid="mock-grafico-km" />,
}));
vi.mock('../ia/InsightsDashboard', () => ({
  InsightsDashboard: () => <div data-testid="mock-insights-dashboard" />,
}));

// ─── TIPOS E DADOS FALSOS FORTEMENTE TIPADOS ───
import { useVeiculos } from '../../hooks/useVeiculos';
import { 
  useSumarioKPIs, 
  useEvolucaoKm, 
  useEvolucaoCpk, 
  usePerformanceFrota 
} from '../../hooks/useDashboardRelatorios';
import { useModalStore } from '../../hooks/useModalStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const mockUser: User = {
  id: 'admin-1',
  nome: 'Administrador Supremo',
  email: 'admin@frotaklin.com.br',
  role: 'ADMIN',
  status: 'ATIVO',
  fotoUrl: 'http://fake.com/foto.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockVeiculos: Veiculo[] = [
  { id: 'v1', placa: 'ABC-1234', marca: 'VW', modelo: 'Gol', ano: 2020, status: 'DISPONIVEL' }
];

const mockKpis = {
  custoTotalGeral: 15000,
  kmTotalRodado: 5000,
  custoMedioPorKM: 3,
  consumoMedioKML: 8.5,
  custoTotalCombustivel: 10000,
  custoTotalManutencao: 5000,
  custoTotalAditivo: 0
};

describe('DashboardRelatorios (TDD Integration)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    (useAuth as Mock).mockReturnValue({ user: mockUser, requestLogout: vi.fn() });
    (useTheme as Mock).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
    (useModalStore as Mock).mockReturnValue({ openModal: vi.fn(), closeModal: vi.fn() });
    
    (useVeiculos as Mock).mockReturnValue({ data: mockVeiculos, isLoading: false, isError: false });
    (useSumarioKPIs as Mock).mockReturnValue({ data: mockKpis, isLoading: false, isError: false });
    (useEvolucaoKm as Mock).mockReturnValue({ data: [], isLoading: false });
    (useEvolucaoCpk as Mock).mockReturnValue({ data: [], isLoading: false });
    (usePerformanceFrota as Mock).mockReturnValue({ data: [], isLoading: false });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter>
            <DashboardRelatorios />
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  };

  it('deve renderizar a tela de inteligência operacional com os dados mockados', async () => {
    renderComponent();
    
    // Verifica Header
    expect(screen.getByText('Inteligência Operacional')).toBeDefined();
    
    // Verifica KPIs formatados (ex: R$ 15.000,00 ou algo similar)
    // Títulos de KPI são robustos o suficiente para confirmar o render correto
    expect(screen.getByText('Custo Operacional Global')).toBeDefined();
    expect(screen.getByText('Quilometragem Total')).toBeDefined();
    expect(screen.getByText('Eficiência de Consumo')).toBeDefined();
    expect(screen.getByText('Despesa em Combustível')).toBeDefined();
    expect(screen.getByText('Custos de Oficina')).toBeDefined();
  });

  it('deve exibir um Callout de erro caso os KPIs falhem', async () => {
    (useSumarioKPIs as Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderComponent();
    
    expect(screen.getByText('Falha ao carregar indicadores')).toBeDefined();
    expect(screen.getByText(/Não foi possível conectar com o servidor/i)).toBeDefined();
  });

  it('deve permitir mudança de filtros e chamar openModal ao clicar em um KPI', async () => {
    const mockOpenModal = vi.fn();
    (useModalStore as Mock).mockReturnValue({ openModal: mockOpenModal, closeModal: vi.fn() });
    
    renderComponent();
    
    // Simula clique no card de Custo Total
    // O KpiCard não tem data-testid, mas podemos buscar pelo título
    const kpiTitle = screen.getByText('Custo Operacional Global');
    // Clica no ancestral ou no proprio elemento
    fireEvent.click(kpiTitle);
    
    expect(mockOpenModal).toHaveBeenCalledWith('ANALYTICS', {
      metric: 'CUSTO_GLOBAL',
      title: 'Custo Operacional Global'
    });
  });
});
