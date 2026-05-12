/**
 * Constantes globais da aplicação.
 * Centraliza strings mágicas para evitar erros de digitação e facilitar refactoring.
 */

// Valor sentinela para filtros "sem filtro ativo"
export const FILTRO_TODOS = 'TODOS' as const;

// Níveis de log do sistema
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  FRAUD_ATTEMPT: 'FRAUD_ATTEMPT',
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;
