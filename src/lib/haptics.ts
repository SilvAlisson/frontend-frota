/**
 * Utilitário global para Feedback Tátil (Vibração Físico do Aparelho).
 * O foco é dar "certeza sensorial" ao operador do Frota KLIN.
 */

// Checa suporte de forma segura (previne quebras no lado do servidor/SSR, se houver)
const canVibrate = typeof window !== 'undefined' && 'vibrate' in navigator;

/**
 * Vibração rápida para interações simples de UI (cliques em botões, abas, etc.)
 * Padrão: 10ms
 */
export const hapticLight = () => {
  if (canVibrate) {
    try { navigator.vibrate(10); } catch (e) { logger.debug("Haptics API error:", e); }
  }
};

/**
 * Vibração de dupla batida para operações confirmadas (Salvar, Enviar, Concluir)
 * Muito similar ao padrão Apple Pay.
 * Padrão: [30ms on, 50ms off, 30ms on]
 */
export const hapticSuccess = () => {
  if (canVibrate) {
    try { navigator.vibrate([30, 50, 30]); } catch (e) { logger.debug("Haptics API error:", e); }
  }
};

/**
 * Vibração pesada em sequencia para Erros.
 * Padrão: [50, 50, 50, 50, 50]
 */
export const hapticError = () => {
  if (canVibrate) {
    try { navigator.vibrate([50, 50, 50, 50, 50]); } catch (e) { logger.debug("Haptics API error:", e); }
  }
};
