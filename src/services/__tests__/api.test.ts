import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizePayload, api } from '../api';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  }
}));

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizePayload', () => {
    it('redacts sensitive keys from flat objects', () => {
      const payload = { email: 'test@test.com', password: 'secret123', name: 'Alisson' };
      const result = sanitizePayload(payload) as Record<string, any>;
      
      // GREEN: should be redacted
      expect(result.password).toBe('[REDACTED]');
    });

    it('redacts sensitive keys from nested objects', () => {
      const payload = { 
        user: { name: 'João' }, 
        auth: { token: 'jwt.ey123' } 
      };
      const result = sanitizePayload(payload) as Record<string, any>;
      
      // GREEN: should be redacted
      expect(result.auth.token).toBe('[REDACTED]');
    });

    it('redacts sensitive keys from JSON strings', () => {
      const payload = JSON.stringify({ token: '12345' });
      const result = sanitizePayload(payload) as Record<string, any>;
      
      // GREEN: should be redacted
      expect(result.token).toBe('[REDACTED]');
    });
  });

  describe('response interceptor', () => {
    it('dispatches auth:unauthorized and shows toast on 401', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      // We simulate an interceptor rejection by calling the error handler directly
      // since testing the axios instance requires moxios or nock
      const interceptorErrorHandler = (api.interceptors.response as any).handlers[0].rejected;
      
      const errorMock = {
        config: { url: '/api/data' },
        response: { status: 401 }
      };

      try {
        await interceptorErrorHandler(errorMock);
      } catch (e) {
        // Expected to throw
      }

      // GREEN: should have been called
      expect(dispatchEventSpy).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Sua sessão expirou por segurança. Por favor, acesse novamente.', expect.any(Object));
    });

    it('shows warning toast on 429', async () => {
      const interceptorErrorHandler = (api.interceptors.response as any).handlers[0].rejected;
      
      const errorMock = {
        config: { url: '/api/data' },
        response: { status: 429 }
      };

      try {
        await interceptorErrorHandler(errorMock);
      } catch (e) {
        // Expected to throw
      }

      // GREEN: should show warning
      expect(toast.warning).toHaveBeenCalledWith('O servidor está sobrecarregado no momento. Tente de novo em alguns segundos.');
    });
  });
});
