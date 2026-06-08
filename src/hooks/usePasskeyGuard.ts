import { useWebAuthn } from './useWebAuthn';

/**
 * Hook que determina se o sistema biométrico pode ser usado
 * com base em dados do servidor E suporte do browser atual.
 *
 * Substitui o frágil: localStorage.getItem('hasPasskey') === 'true'
 */
export function usePasskeyGuard() {
    const { hasPasskeys, isLoadingPasskeys } = useWebAuthn();

    // Verifica se o browser atual suporta WebAuthn (FIDO2/Passkeys)
    const isWebAuthnSupported =
        typeof window !== 'undefined' &&
        !!window.PublicKeyCredential &&
        typeof window.PublicKeyCredential === 'function';

    // O hint local permite saber se o usuário já cadastrou passkey neste aparelho antes do login
    const hasLocalPasskeyHint = typeof window !== 'undefined' && localStorage.getItem('klin_has_passkey') === 'true';

    // Pode usar biometria = browser suporta
    const canUseBiometry = isWebAuthnSupported;

    // Deve mostrar a LockScreen = o hint local diz que já registrou neste dispositivo
    const shouldShowLockScreen = isWebAuthnSupported && hasLocalPasskeyHint;

    return {
        canUseBiometry,
        shouldShowLockScreen,
        isWebAuthnSupported,
        isLoadingPasskeys,
        hasPasskeys,
    };
}
