import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { DashboardOperador } from '../DashboardOperador';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '../../types';

// ─── MOCKS DE HOOKS ───
vi.mock('../../hooks/useUsuarios', () => ({
  useUsuarios: vi.fn(),
}));
vi.mock('../../hooks/useVeiculos', () => ({
  useVeiculos: vi.fn(),
}));
vi.mock('../../hooks/useJornadasAtivas', () => ({
  useJornadasAtivas: vi.fn(),
}));
vi.mock('../../hooks/useHaptics', () => ({
  useHaptics: () => ({
    vibrateLight: vi.fn(),
    vibrateMedium: vi.fn(),
    vibrateSuccess: vi.fn(),
  }),
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

// Mocks de Componentes Internos que usam Modais ou Lógicas Complexas
vi.mock('../IniciarJornada', () => ({
  IniciarJornada: () => <div data-testid="mock-iniciar-jornada" />,
}));
vi.mock('../JornadaCard', () => ({
  JornadaCard: () => <div data-testid="mock-jornada-card" />,
}));
vi.mock('../forms/FormRegistrarAbastecimento', () => ({
  FormRegistrarAbastecimento: () => <div data-testid="mock-form-abastecimento" />,
}));
vi.mock('../forms/FormRegistrarDefeito', () => ({
  FormRegistrarDefeito: () => <div data-testid="mock-form-defeito" />,
}));
vi.mock('../HistoricoJornadas', () => ({
  HistoricoJornadas: () => <div data-testid="mock-historico-jornadas" />,
}));
vi.mock('../GestaoDocumentos', () => ({
  GestaoDocumentos: () => <div data-testid="mock-gestao-documentos" />,
}));

// Importações Pós-Mock
import { useUsuarios } from '../../hooks/useUsuarios';
import { useVeiculos } from '../../hooks/useVeiculos';
import { useJornadasAtivas } from '../../hooks/useJornadasAtivas';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const mockUser: User = {
  id: 'operador-1',
  nome: 'Carlos Operador',
  email: 'carlos@frotaklin.com.br',
  role: 'OPERADOR',
  status: 'ATIVO',
  fotoUrl: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('DashboardOperador (TDD Integration)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock do window.matchMedia exigido pelo Modal (Radix/Vaul)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    (useAuth as Mock).mockReturnValue({ user: mockUser, requestLogout: vi.fn() });
    (useTheme as Mock).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
    
    (useUsuarios as Mock).mockReturnValue({ usuarios: [mockUser], isLoading: false });
    (useVeiculos as Mock).mockReturnValue({ data: [], isLoading: false });
    (useJornadasAtivas as Mock).mockReturnValue({ data: [], isLoading: false });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardOperador user={mockUser} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('deve renderizar a tela de Iniciar Turno quando o operador NÃO tem jornada ativa', () => {
    renderComponent();
    
    // Verifica a saudação (O texto está quebrado em nós diferentes, então verificamos as partes)
    expect(screen.getByText(/Olá,/)).toBeDefined();
    expect(screen.getByText(/Carlos/)).toBeDefined();
    expect(screen.getByText('Disponível')).toBeDefined();
    
    // Verifica se renderiza o componente de iniciar jornada
    expect(screen.getByTestId('mock-iniciar-jornada')).toBeDefined();
  });

  it('deve renderizar o Card da Jornada quando o operador TEM uma jornada ativa', () => {
    // Mockando uma jornada ativa para este operador
    (useJornadasAtivas as Mock).mockReturnValue({
      data: [{ id: 'jornada-1', operador: { id: 'operador-1' }, veiculo: { id: 'v1' } }],
      isLoading: false
    });

    renderComponent();
    
    expect(screen.getByText('Em Operação')).toBeDefined();
    expect(screen.getByTestId('mock-jornada-card')).toBeDefined();
    // Iniciar Jornada NÃO deve aparecer
    expect(screen.queryByTestId('mock-iniciar-jornada')).toBeNull();
  });

  it('deve abrir o modal de Abastecimento ao clicar no botão correspondente', () => {
    renderComponent();
    
    // Encontra o botão de Abastecimento (desktop/botão principal)
    // O botão tem o label 'Abastecimento'
    const btnAbastecer = screen.getByText('Abastecimento').closest('button');
    expect(btnAbastecer).not.toBeNull();
    
    fireEvent.click(btnAbastecer!);
    
    // O Modal de Abastecimento (nosso mock) deve aparecer na tela
    expect(screen.getByTestId('mock-form-abastecimento')).toBeDefined();
  });

  it('deve abrir o modal de Reportar Defeito ao clicar no botão correspondente', () => {
    renderComponent();
    
    const btnDefeito = screen.getByText('Reportar Defeito').closest('button');
    expect(btnDefeito).not.toBeNull();
    
    fireEvent.click(btnDefeito!);
    
    expect(screen.getByTestId('mock-form-defeito')).toBeDefined();
  });
});
