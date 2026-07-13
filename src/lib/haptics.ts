/**
 * Utilitário global para Feedback Tátil (Vibração Físico do Aparelho).
 * O foco é dar "certeza sensorial" ao operador do Frota KLIN.
 */

import { logger } from './logger';

// Checa suporte de forma segura e se o usuário já interagiu com a tela (previne erro de console no magic link)
const canVibrate = () => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return false;
  // @ts-ignore - API recente do Chrome
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
  return true;
};

/**
 * Vibração rápida para interações simples de UI (cliques em botões, abas, etc.)
 * Padrão: 10ms
 */
export const hapticLight = () => {
  if (canVibrate()) {
    try { navigator.vibrate(10); } catch (e) { logger.debug("Haptics API error:", e); }
  }
};

/**
 * Vibração de dupla batida para operações confirmadas (Salvar, Enviar, Concluir)
 * Muito similar ao padrão Apple Pay.
 * Padrão: [30ms on, 50ms off, 30ms on]
 */
export const hapticSuccess = () => {
  if (canVibrate()) {
    try { navigator.vibrate([30, 50, 30]); } catch (e) { logger.debug("Haptics API error:", e); }
  }
};

/**
 * Vibração pesada em sequencia para Erros.
 * Padrão: [50, 50, 50, 50, 50]
 */
export const hapticError = () => {
  if (canVibrate()) {
    try { navigator.vibrate([50, 50, 50, 50, 50]); } catch (e) { logger.debug("Haptics API error:", e); }
  }
};
