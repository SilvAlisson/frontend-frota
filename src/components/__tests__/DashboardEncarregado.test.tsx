import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, Mock } from 'vitest';
import { DashboardEncarregado } from '../DashboardEncarregado';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '../../types';

// Mocks dos Contextos
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() })
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

// Mocks dos Data Hooks
vi.mock('../../hooks/useUsuarios', () => ({
  useUsuarios: vi.fn()
}));
vi.mock('../../hooks/useVeiculos', () => ({
  useVeiculos: vi.fn()
}));
vi.mock('../../hooks/useJornadasAtivas', () => ({
  useJornadasAtivas: vi.fn()
}));
vi.mock('../../hooks/useDefeitos', () => ({
  useDefeitos: vi.fn()
}));
vi.mock('../../hooks/useFornecedores', () => ({
  useFornecedores: () => ({ data: [], isError: false, isLoading: false })
}));

// Importação das funções mockadas para injetar retorno
import { useUsuarios } from '../../hooks/useUsuarios';
import { useVeiculos } from '../../hooks/useVeiculos';
import { useJornadasAtivas } from '../../hooks/useJornadasAtivas';
import { useDefeitos } from '../../hooks/useDefeitos';

const mockUser: User = {
  id: 'user-123',
  nome: 'Alisson Encarregado',
  role: 'ENCARREGADO',
  fotoUrl: '',
  email: 'alisson@klin.com',
  cargoId: 'cargo-1',
  empresaId: 'emp-1',
  cnhNumero: '',
  cnhValidade: '',
  cnhCategoria: '',
  status: 'ATIVO',
  permissoes: [],
  treinamentos: [],
  anotacoes: [],
  alertas: [],
  integracoes: {},
  documentos: []
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('DashboardEncarregado Integration', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sync error state when data fails to load', () => {
    // Simulamos falha na API
    (useUsuarios as Mock).mockReturnValue({ isError: true });
    (useVeiculos as Mock).mockReturnValue({ isError: true });
    (useJornadasAtivas as Mock).mockReturnValue({ isError: true });
    (useDefeitos as Mock).mockReturnValue({ isError: true });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/encarregado']}>
          <Routes>
            <Route path="/encarregado/*" element={<DashboardEncarregado user={mockUser} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // GREEN: should be in the document
    expect(screen.getByText('Falha de Sincronização')).toBeInTheDocument();
  });

  it('renders dashboard successfully with metrics', () => {
    // Simulamos sucesso na API
    (useUsuarios as Mock).mockReturnValue({ usuarios: [{ id: '1', nome: 'Op 1', role: 'OPERADOR' }], isError: false });
    (useVeiculos as Mock).mockReturnValue({ data: [{ id: 'v1', status: 'DISPONIVEL', tipoVeiculo: 'LEVE' }], isError: false });
    (useJornadasAtivas as Mock).mockReturnValue({ data: [], isError: false, refetch: vi.fn() });
    (useDefeitos as Mock).mockReturnValue({ contagemAtiva: 0, isError: false, refetch: vi.fn() });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/encarregado']}>
          <Routes>
            <Route path="/encarregado/*" element={<DashboardEncarregado user={mockUser} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // GREEN: should render dashboard successfully
    expect(screen.getByText(/Alisson/i)).toBeInTheDocument();
    expect(screen.getByText('Veículos Disponíveis')).toBeInTheDocument();
  });

  it('navigates to Histórico view when Histórico button is clicked', async () => {
    // Simulamos sucesso na API
    (useUsuarios as Mock).mockReturnValue({ usuarios: [], isError: false });
    (useVeiculos as Mock).mockReturnValue({ data: [], isError: false });
    (useJornadasAtivas as Mock).mockReturnValue({ data: [], isError: false, refetch: vi.fn() });
    (useDefeitos as Mock).mockReturnValue({ contagemAtiva: 0, isError: false, refetch: vi.fn() });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/encarregado']}>
          <Routes>
            <Route path="/encarregado/*" element={<DashboardEncarregado user={mockUser} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // O botão da Sidebar
    const historicoBtn = screen.getByRole('button', { name: /Histórico de Abastecimentos/i });
    fireEvent.click(historicoBtn);

    // GREEN: A tela de Histórico deve renderizar (tem um H2 com o título ou H1 com Boletim)
    await waitFor(() => {
      expect(screen.getByText('Boletim de Abastecimentos')).toBeInTheDocument();
    });
  });
});
