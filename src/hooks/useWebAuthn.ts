import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { signIn, passkey } from '../lib/auth-client';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export interface PasskeyDevice {
    id: string;
    name: string | null;
    deviceType: string;
    createdAt: string | null;
    credentialID: string;
}

export function useWebAuthn() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // ─── Busca server-side das passkeys (substitui localStorage) ───────────
    const {
        data: passkeys = [],
        isLoading: isLoadingPasskeys,
        refetch: refetchPasskeys,
    } = useQuery<PasskeyDevice[]>({
        queryKey: ['passkeys', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/users/me/passkeys');
            return data;
        },
        // Só busca se o usuário estiver logado
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2, // 2 min cache
    });

    const hasPasskeys = passkeys.length > 0;

    // ─── Revogar passkey ────────────────────────────────────────────────────
    const revokeMutation = useMutation({
        mutationFn: async (passkeyId: string) => {
            await api.delete(`/users/me/passkeys/${passkeyId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passkeys'] });
            toast.success('Dispositivo biométrico removido com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao remover dispositivo. Tente novamente.');
        }
    });

    const revokePasskey = (passkeyId: string) => revokeMutation.mutate(passkeyId);

    // ─── Cadastrar biometria no dispositivo atual ───────────────────────────
    const registerDevice = async () => {
        setIsRegistering(true);
        try {
            if (!user) {
                toast.error('Você precisa estar logado para cadastrar a biometria.');
                return false;
            }

            const res = await passkey.addPasskey({
                name: `${navigator.platform || 'Dispositivo'} — ${new Date().toLocaleDateString('pt-BR')}`
            });

            if (res?.error) {
                console.error('[useWebAuthn] registerDevice error from server:', res.error);
                toast.error(`Falha ao registrar biometria: ${res.error.message || res.error.statusText || 'Erro no servidor'}`);
                return false;
            }

            await refetchPasskeys();
            localStorage.setItem('klin_has_passkey', 'true');
            
            // 🔥 SOLUÇÃO: Salva o e-mail do dono da biometria como âncora
            if (user.email) {
                localStorage.setItem('klin_passkey_email', user.email);
            }
            
            toast.success('Biometria cadastrada com sucesso neste aparelho! ✅');
            return true;

        } catch (error: any) {
            if (error?.name === 'NotAllowedError') {
                toast.error('O cadastro biométrico foi cancelado.');
            } else if (error?.name === 'InvalidStateError') {
                toast.error('Este dispositivo já tem biometria cadastrada.');
            } else {
                toast.error(`Erro no sensor: ${error?.message || error?.name || 'Desconhecido'}`);
            }
            if (import.meta.env.DEV) console.error('[useWebAuthn] registerDevice:', error);
            return false;
        } finally {
            setIsRegistering(false);
        }
    };

    // ─── Login com biometria ────────────────────────────────────────────────
    const loginWithDevice = async (
        onSuccess: (token: string, user: { nome: string; [key: string]: unknown }) => void,
        emailFromForm?: string // 🔥 Adicionamos o e-mail como parâmetro
    ) => {
        setIsAuthenticating(true);
        try {
            // 🔥 SOLUÇÃO: Puxa o e-mail do formulário, ou o que está salvo em cache
            let emailToUse = emailFromForm;
            if (!emailToUse || emailToUse.trim() === '') {
                emailToUse = localStorage.getItem('klin_passkey_email') || undefined;
            }

            const passkeyOptions = emailToUse ? { email: emailToUse } : undefined;
            
            // O Better Auth agora enviará o ID exato da sua biometria e o sensor ligará 100% das vezes
            const { data, error } = await signIn.passkey(passkeyOptions);

            if (error) {
                toast.error(error.message || 'Assinatura biométrica inválida.');
                return false;
            }

            if (data) {
                await refetchPasskeys();
                // Atualiza o cache caso tenha dado certo com um e-mail novo
                if (data.user.email) {
                    localStorage.setItem('klin_passkey_email', data.user.email);
                }
                toast.success(`Bem-vindo(a) de volta, ${data.user.name}! 👋`);
                onSuccess('', data.user as any);
                return true;
            }

        } catch (error: any) {
            if (error?.name === 'NotAllowedError') {
                toast.error('Ação cancelada pelo usuário.');
            } else if (error?.name === 'NotFoundError') {
                toast.error('Nenhuma biometria encontrada. Digite seu E-mail antes de clicar no botão, ou faça login com senha e cadastre a biometria novamente.');
            } else {
                toast.error('Falha ao ler biometria. Tente novamente.');
            }
            if (import.meta.env.DEV) console.error('[useWebAuthn] loginWithDevice:', error);
            return false;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const isWebAuthnSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
    const canUseBiometry = isWebAuthnSupported;
    const hasLocalPasskeyHint = localStorage.getItem('klin_has_passkey') === 'true';

    return {
        passkeys,
        isLoadingPasskeys,
        hasPasskeys,
        hasLocalPasskeyHint,
        canUseBiometry,
        isWebAuthnSupported,
        isRegistering,
        isAuthenticating,
        isRevoking: revokeMutation.isPending,
        registerDevice,
        loginWithDevice,
        revokePasskey,
        refetchPasskeys,
    };
}
