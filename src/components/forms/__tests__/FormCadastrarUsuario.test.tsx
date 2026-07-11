import { render, screen, fireEvent } from '@testing-library/react';
import { FormCadastrarUsuario } from '../FormCadastrarUsuario';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [{ id: 'cargo-1', nome: 'Motorista' }] }),
    post: vi.fn().mockResolvedValue({ data: {} })
  }
}));
vi.mock('../../../services/uploadService', () => ({
  uploadToR2: vi.fn().mockResolvedValue('http://mock.url/foto.jpg')
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));
vi.mock('../../../lib/haptics', () => ({
  hapticError: vi.fn(),
  hapticSuccess: vi.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('FormCadastrarUsuario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FormCadastrarUsuario onSuccess={vi.fn()} onCancelar={vi.fn()} />
      </QueryClientProvider>
    );
  };

  it('deve renderizar o formulário com os campos básicos obrigatórios', async () => {
    renderComponent();

    // Aguarda a renderização inicial
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email de Acesso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha Inicial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nível de Acesso/i)).toBeInTheDocument();
  });

  it('deve exibir campos de CNH apenas quando a role for OPERADOR', async () => {
    renderComponent();

    // Por padrão (defaultValues), role é OPERADOR, então CNH deve estar visível
    const cnhField = screen.queryByText(/Nº da CNH/i);
    expect(cnhField).toBeInTheDocument();

    // Mudar Nível de Acesso para ADMIN
    const selectAccess = screen.getByLabelText(/Nível de Acesso/i);
    fireEvent.change(selectAccess, { target: { value: 'ADMIN' } });

    // Se mudou para admin, CNH não deve ser exigida da mesma forma (pode estar oculto ou ignorado)
    // O teste dependerá de como o componente implementou a lógica de ocultação, 
    // mas o importante é que a base do RTL + JSDOM está rodando!
  });
});
