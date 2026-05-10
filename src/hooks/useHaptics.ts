import { useCallback } from 'react';

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
      // Ignorar erros se bloqueado pelo navegador
    }
  }, [isSupported]);

  // Vibração média para confirmações de pequenas ações (ex: abrir modal)
  const vibrateMedium = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(40);
    } catch (e) {
      // Ignorar
    }
  }, [isSupported]);

  // Vibração de sucesso: Duas vibrações curtas e agradáveis (50ms - pausa - 50ms)
  const vibrateSuccess = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate([30, 60, 40]);
    } catch (e) {
      // Ignorar
    }
  }, [isSupported]);

  // Vibração de erro ou alerta crítico: Três vibrações rápidas (agressivo)
  const vibrateError = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate([50, 50, 50, 50, 50]);
    } catch (e) {
      // Ignorar
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
