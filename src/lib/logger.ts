/**
 * @file logger.ts
 * @description Logger centralizado do Frota KLIN.
 *
 * 4 Níveis de Logging:
 * - apiError:  Erro de API → toast visual + log no SystemLog via interceptor do axios
 * - debug:     Diagnóstico em DEV → eliminado em produção pelo tree-shaking do Vite
 * - business:  Evento de negócio → post no SystemLog (com debounce p/ evitar flood/429)
 * - critical:  Erro crítico → Sentry (somente produção) + toast amigável
 */

import * as Sentry from '@sentry/react';
import { env } from '../config/env';
import { api } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FRAUD_ATTEMPT';

// --- Debounce interno para evitar flood de logs de negócio (ex: loop de re-render) ---
const _businessDebounceMap = new Map<string, ReturnType<typeof setTimeout>>();
const BUSINESS_DEBOUNCE_MS = 500;

const logger = {
  /**
   * Nível 1: Erro de API
   * Usa o handleApiError que já: mapeia status HTTP → mensagem amigável + dispara toast.
   * @param error - O erro capturado no catch.
   * @param context - Mensagem contextualizada para o usuário (ex: 'Erro ao carregar ASOs').
   */
  apiError(error: unknown, context?: string): string {
    return handleApiError(error, context);
  },

  /**
   * Nível 2: Debug (somente em desenvolvimento)
   * Usando env.isDev de forma agnóstica de bundler
   */
  debug(...args: unknown[]): void {
    if (env.isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Nível 3: Evento de Negócio → SystemLog
   * Fire-and-forget seguro com debounce para evitar flood de requisições.
   * @param level - Nível do log.
   * @param message - Mensagem descritiva do evento.
   * @param context - Dados extras de contexto (ids, valores, etc).
   */
  business(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const debounceKey = `${level}:${message}`;

    // Cancela o disparo anterior se houver (debounce)
    if (_businessDebounceMap.has(debounceKey)) {
      clearTimeout(_businessDebounceMap.get(debounceKey)!);
    }

    const timer = setTimeout(() => {
      _businessDebounceMap.delete(debounceKey);

      api
        .post('/logs', {
          level,
          source: 'FRONTEND',
          message,
          context: {
            ...context,
            _url: window.location.href,
            _timestamp: new Date().toISOString(),
          },
        })
        .catch(() => null); // Fire-and-forget: nunca lançar exceção aqui
    }, BUSINESS_DEBOUNCE_MS);

    _businessDebounceMap.set(debounceKey, timer);
  },

  /**
   * Nível 4: Erro Crítico → Sentry (prod) + toast amigável
   * Sentry só é acionado fora do ambiente de desenvolvimento para não poluir o projeto.
   * @param error - O erro capturado.
   * @param context - Mensagem amigável para o usuário.
   */
  critical(error: unknown, context?: string): void {
    if (!env.isDev) {
      Sentry.captureException(error);
    } else {
      // Em dev, mostra o erro completo no console para facilitar o debug
      console.error('[CRITICAL]', context || 'Erro crítico:', error);
    }

    handleApiError(error, context || 'Erro crítico. A equipe técnica foi notificada.');
  },
};

export { logger };
