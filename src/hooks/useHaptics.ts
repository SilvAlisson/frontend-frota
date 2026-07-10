import { useCallback } from 'react';
import { logger } from '../lib/logger';

/**
 * Hook para adicionar micro-interações táteis (Vibração) em dispositivos mobile.
 * Isso melhora a percepção do usuário sobre o sucesso ou erro de uma ação, reduzindo a carga cognitiva.
 * Falha silenciosamente em dispositivos que não suportam a Vibration API (ex: iOS em alguns contextos ou Desktops).
 */
export function useHaptics() {
  
  const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;

  // Vibração leve para cliques normais ou interações sutis (10ms)
  const vibrateLight = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(10);
    } catch (e) {
      logger.error("[useHaptics] Haptics API error (light):", e);
    }
  }, [isSupported]);

  // Vibração média para confirmações de pequenas ações (ex: abrir modal)
  const vibrateMedium = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(40);
    } catch (e) {
      logger.error("[useHaptics] Haptics API error (medium):", e);
    }
  }, [isSupported]);

  // Vibração de sucesso: Duas vibrações curtas e agradáveis (50ms - pausa - 50ms)
  const vibrateSuccess = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate([30, 60, 40]);
    } catch (e) {
      logger.error("[useHaptics] Haptics API error (success):", e);
    }
  }, [isSupported]);

  // Vibração de erro ou alerta crítico: Três vibrações rápidas (agressivo)
  const vibrateError = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate([50, 50, 50, 50, 50]);
    } catch (e) {
      logger.error("[useHaptics] Haptics API error (error):", e);
    }
  }, [isSupported]);

  return {
    vibrateLight,
    vibrateMedium,
    vibrateSuccess,
    vibrateError,
    isSupported
  };
}
