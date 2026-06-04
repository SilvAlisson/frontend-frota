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

    // Pode usar biometria = tem passkeys cadastradas no servidor E browser suporta
    const canUseBiometry = hasPasskeys && isWebAuthnSupported;

    // Deve mostrar a LockScreen = tem passkeys no servidor, browser suporta, e não está carregando
    const shouldShowLockScreen = canUseBiometry && !isLoadingPasskeys;

    return {
        canUseBiometry,
        shouldShowLockScreen,
        isWebAuthnSupported,
        isLoadingPasskeys,
        hasPasskeys,
    };
}
