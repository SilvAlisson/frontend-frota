import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError, getDeviceContext } from '../errorHandler';
import axios from 'axios';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  }
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('returns default message for generic non-axios errors', () => {
      const message = handleApiError(new Error('Random JS Error'));
      expect(message).toBe('Ocorreu um erro inesperado.');
      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro inesperado.', expect.any(Object));
    });

    it('prioritizes explicit error response from backend', () => {
      const error = new axios.AxiosError('Axios Error');
      error.response = {
        data: { error: 'Mensagem explicita do backend' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };

      const message = handleApiError(error);
      expect(message).toBe('Mensagem explicita do backend');
    });

    it('falls back to default http status messages when no body is provided (401)', () => {
      const error = new axios.AxiosError('Axios Error');
      error.response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any
      };

      const message = handleApiError(error);
      expect(message).toBe('Sessão expirada.');
      expect(toast.error).toHaveBeenCalledWith('Sessão expirada.', {
        description: 'Por favor, faça login novamente.',
        duration: 5000,
      });
    });

    it('handles network errors properly', () => {
      const error = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      
      const message = handleApiError(error);
      expect(message).toBe('Sem conexão com o servidor.');
    });

    it('does not trigger toast if _toastHandled is true', () => {
      const error = new axios.AxiosError('Axios Error');
      (error as any)._toastHandled = true;
      
      handleApiError(error);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('getDeviceContext', () => {
    it('extracts contextual information properly', () => {
      const ctx = getDeviceContext();
      expect(ctx).toHaveProperty('_navegador');
      expect(ctx).toHaveProperty('_resolucao');
      expect(ctx).toHaveProperty('_idioma');
      expect(ctx).toHaveProperty('_plataforma');
      expect(ctx).toHaveProperty('_conexao');
      expect(ctx).toHaveProperty('_horaLocal');
    });
  });
});
