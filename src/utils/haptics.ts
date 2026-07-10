/**
 * Utilitários para Haptic Feedback (Vibração Nativa)
 * Usado para dar resposta tátil ao usuário em ações de sucesso, erro ou cliques.
 */

export const haptics = {
  // Vibração leve para cliques normais em botões de ação
  light: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(10); } catch (e) { logger.debug("[haptics] light error:", e); }
    }
  },

  // Padrão de sucesso: duas vibrações rápidas e suaves
  success: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([50, 50, 100]); } catch (e) { logger.debug("[haptics] success error:", e); }
    }
  },

  // Padrão de erro: três vibrações mais longas
  error: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100, 50, 100]); } catch (e) { logger.debug("[haptics] error:", e); }
    }
  },

  // Vibração pesada, como apagar um item (swipe-to-delete)
  heavy: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(50); } catch (e) { logger.debug("[haptics] heavy error:", e); }
    }
  }
};
