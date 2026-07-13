/**
 * Utilitários para Haptic Feedback (Vibração Nativa)
 * Usado para dar resposta tátil ao usuário em ações de sucesso, erro ou cliques.
 */

import { logger } from '../lib/logger';

export const haptics = {
  // Vibração leve para cliques normais em botões de ação
  light: () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
      try { navigator.vibrate(10); } catch (e) { logger.debug("[haptics] light error:", e); }
    }
  },

  // Padrão de sucesso: duas vibrações rápidas e suaves
  success: () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
      try { navigator.vibrate([50, 50, 100]); } catch (e) { logger.debug("[haptics] success error:", e); }
    }
  },

  // Padrão de erro: três vibrações mais longas
  error: () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
      try { navigator.vibrate([100, 50, 100, 50, 100]); } catch (e) { logger.debug("[haptics] error:", e); }
    }
  },

  // Vibração pesada, como apagar um item (swipe-to-delete)
  heavy: () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
      try { navigator.vibrate(50); } catch (e) { logger.debug("[haptics] heavy error:", e); }
    }
  }
};
