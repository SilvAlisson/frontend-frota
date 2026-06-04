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
            toast.success('Biometria cadastrada com sucesso neste aparelho! ✅');
            return true;

        } catch (error: any) {
            if (error?.name === 'NotAllowedError') {
                toast.error('O cadastro biométrico foi cancelado.');
            } else if (error?.name === 'InvalidStateError') {
                toast.error('Este dispositivo já tem biometria cadastrada.');
            } else {
                toast.error('Erro no sensor biométrico do aparelho.');
            }
            if (import.meta.env.DEV) console.error('[useWebAuthn] registerDevice:', error);
            return false;
        } finally {
            setIsRegistering(false);
        }
    };

    // ─── Login com biometria ────────────────────────────────────────────────
    const loginWithDevice = async (
        onSuccess: (token: string, user: { nome: string; [key: string]: unknown }) => void
    ) => {
        setIsAuthenticating(true);
        try {
            const { data, error } = await signIn.passkey();

            if (error) {
                toast.error(error.message || 'Assinatura biométrica inválida.');
                return false;
            }

            if (data) {
                await refetchPasskeys();
                toast.success(`Bem-vindo(a) de volta, ${data.user.name}! 👋`);
                onSuccess('', data.user as any);
                return true;
            }

        } catch (error: any) {
            if (error?.name === 'NotAllowedError') {
                toast.error('Ação cancelada pelo usuário.');
            } else if (error?.name === 'NotFoundError') {
                toast.error('Nenhuma biometria cadastrada neste dispositivo. Entre com sua senha e cadastre nas Configurações.');
            } else {
                toast.error('Falha ao ler biometria. Tente novamente.');
            }
            if (import.meta.env.DEV) console.error('[useWebAuthn] loginWithDevice:', error);
            return false;
        } finally {
            setIsAuthenticating(false);
        }
    };

    return {
        // Estado
        passkeys,
        hasPasskeys,
        isLoadingPasskeys,
        isRegistering,
        isAuthenticating,
        isRevoking: revokeMutation.isPending,
        // Ações
        registerDevice,
        loginWithDevice,
        revokePasskey,
        refetchPasskeys,
    };
}
