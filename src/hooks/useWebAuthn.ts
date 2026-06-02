import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { api } from '../services/api';
import { toast } from 'sonner';

export function useWebAuthn() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 1. Cadastra o dispositivo atual como Biometria (exige usuário já logado via QR ou Senha)
  const registerDevice = async () => {
    setIsRegistering(true);
    try {
      // 1.1 Pega o desafio do servidor
      const { data: options } = await api.get('/auth/webauthn/register-options');

      // 1.2 Pede ao navegador/SO para ler a face/dedo
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          toast.error("O cadastro biométrico foi cancelado.");
        } else {
          toast.error("Erro no sensor biométrico do aparelho.");
        }
        throw error;
      }

      // 1.3 Manda de volta a chave pública para o servidor
      const { data: verification } = await api.post('/auth/webauthn/register-verify', attResp);

      if (verification && verification.verified) {
        toast.success("Biometria registrada com sucesso neste aparelho!");
        localStorage.setItem('hasPasskey', 'true');
        return true;
      } else {
        toast.error("Falha ao validar biometria no servidor.");
        return false;
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Erro ao registrar biometria. HTTPS é obrigatório.");
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // 2. Faz o login usando a biometria cadastrada
  const loginWithDevice = async (onSuccess: (token: string, user: any) => void) => {
    setIsAuthenticating(true);
    try {
      // 2.1 Pega as opções de autenticação (desafio)
      const { data: resp } = await api.post('/auth/webauthn/login-options');
      const { options } = resp;

      // 2.2 Pede ao SO para validar a face/dedo
      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: options });
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          toast.error("Ação cancelada pelo usuário.");
        } else {
          toast.error("Falha ao ler biometria ou aparelho não cadastrado.");
        }
        throw error;
      }

      // 2.3 Manda o desafio resolvido pro servidor
      const { data: verification } = await api.post('/auth/webauthn/login-verify', {
        response: asseResp,
        expectedChallenge: options.challenge
      });

      if (verification && verification.verified) {
        localStorage.setItem('hasPasskey', 'true');
        toast.success(`Bem-vindo(a) de volta, ${verification.user.nome}!`);
        onSuccess(verification.token, verification.user);
        return true;
      } else {
        toast.error("Assinatura biométrica inválida.");
        return false;
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Falha ao autenticar por biometria.");
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    registerDevice,
    loginWithDevice,
    isRegistering,
    isAuthenticating
  };
}
