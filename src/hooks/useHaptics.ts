import { useCallback } from 'react';

/**
 * Hook para adicionar micro-interações táteis (Vibração) em dispositivos mobile.
 * Isso melhora a percepção do usuário sobre o sucesso ou erro de uma ação, reduzindo a carga cognitiva.
 * Falha silenciosamente em dispositivos que não suportam a Vibration API (ex: iOS em alguns contextos ou Desktops).
 */
export function useHaptics() {
  
  const isSupported = typeof window !== 'undefined';
  
  const canVibrate = useCallback(() => {
    if (!isSupported) return false;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
    return true;
  }, [isSupported]);

  // Vibração leve para cliques normais ou interações sutis (10ms)
  const vibrateLight = useCallback(() => {
    if (!canVibrate()) return;
    try {
      // @ts-expect-error - feature experimental no iOS
      if (window.ReactNativeWebView?.postMessage) {
        // @ts-expect-error - bridge mobile
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HAPTIC_LIGHT' }));
      } else if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignorar erros
    }
  }, [canVibrate]);

  const vibrateMedium = useCallback(() => {
    if (!canVibrate()) return;
    try {
      if (navigator.vibrate) navigator.vibrate(20);
    } catch {
      //
    }
  }, [canVibrate]);

  const vibrateHeavy = useCallback(() => {
    if (!canVibrate()) return;
    try {
      if (navigator.vibrate) navigator.vibrate(30);
    } catch {
      //
    }
  }, [canVibrate]);

  const vibrateSuccess = useCallback(() => {
    if (!canVibrate()) return;
    try {
      if (navigator.vibrate) navigator.vibrate([15, 100, 20]);
    } catch {
      //
    }
  }, [canVibrate]);

  const vibrateError = useCallback(() => {
    if (!canVibrate()) return;
    try {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);
    } catch {
      //
    }
  }, [canVibrate]);

  return {
    vibrateLight,
    vibrateMedium,
    vibrateHeavy,
    vibrateSuccess,
    vibrateError,
    isSupported
  };
}
