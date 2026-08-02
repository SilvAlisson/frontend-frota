import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { DashboardRH } from '../DashboardRH';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../ui/Tooltip';
import type { User } from '../../types';

// ─── MOCKS ───
vi.mock('../../hooks/useDashboardRH', () => ({
  useDashboardRH: vi.fn(),
}));

// Mocks for components that might cause issues in testing (like charts and external AI)
vi.mock('../ia/RelatorioNarrativoRH', () => ({
  RelatorioNarrativoRH: () => <div data-testid="mock-relatorio-ia" />,
}));
vi.mock('../rh/GraficoSST', () => ({
  GraficoSST: () => <div data-testid="mock-grafico-sst" />,
}));
vi.mock('../rh/GraficoCargos', () => ({
  GraficoCargos: () => <div data-testid="mock-grafico-cargos" />,
}));
vi.mock('../rh/DashboardCompliance', () => ({
  DashboardCompliance: () => <div data-testid="mock-dashboard-compliance" />,
}));
vi.mock('../rh/RadarSSMA', () => ({
  RadarSSMA: () => <div data-testid="mock-radar-ssma" />,
}));
vi.mock('../rh/WidgetAniversariantes', () => ({
  WidgetAniversariantes: () => <div data-testid="mock-widget-aniversariantes" />,
}));

// ─── TIPOS E DADOS FALSOS FORTEMENTE TIPADOS ───
import { useDashboardRH } from '../../hooks/useDashboardRH';

const mockUser: User = {
  id: 'rh-1',
  nome: 'Ana Recursos Humanos',
  email: 'ana.rh@frotaklin.com.br',
  role: 'RH',
  status: 'ATIVO',
  fotoUrl: 'http://fake.com/foto.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockDashboardData = {
  kpis: {
    totalIntegrantes: 150,
    treinamentosCriticos: 5,
    cnhsCriticas: 2,
    sstPendentes: 0
  },
  graficos: {
    panoramaSST: [],
    distribuicaoCargos: []
  }
};

describe('DashboardRH (TDD Integration)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    (useDashboardRH as Mock).mockReturnValue({ data: mockDashboardData, isLoading: false, isError: false });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter>
            <DashboardRH user={mockUser} />
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  };

  it('deve renderizar a tela do RH com a saudação e as abas', async () => {
    renderComponent();
    
    // Verifica Saudação
    expect(screen.getByText('Olá, Ana!')).toBeDefined();
    
    // Verifica KPIs (Pelo título ao invés de valor para evitar flakiness)
    expect(screen.getByText('Integrantes Ativos')).toBeDefined();
    expect(screen.getByText('Treinamentos Críticos')).toBeDefined();
    expect(screen.getByText('CNHs a Vencer')).toBeDefined();
    expect(screen.getByText('Ações SST Pendentes')).toBeDefined();
  });

  it('deve exibir um Callout de erro caso os dados falhem', async () => {
    (useDashboardRH as Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderComponent();
    
    expect(screen.getByText('Erro ao carregar dados')).toBeDefined();
    expect(screen.getByText(/Não foi possível conectar com o servidor/i)).toBeDefined();
  });

  it('deve alternar para a aba Radar SSMA', async () => {
    renderComponent();
    
    // Clica na aba Radar SSMA
    const radarTab = screen.getByText('Radar SSMA');
    fireEvent.click(radarTab);
    
    // Após clicar, o DashboardCompliance (aba KPIs) deve desaparecer
    // e o RadarSSMA deve aparecer.
    expect(screen.getByTestId('mock-radar-ssma')).toBeDefined();
    expect(screen.queryByTestId('mock-dashboard-compliance')).toBeNull();
  });
});
