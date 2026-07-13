import axios from 'axios';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { UserRole } from '../types';
import { signIn } from '../lib/auth-client';

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, logout, isAuthenticated, user, loading: authLoading } = useAuth();
  
  const getErrorMessage = (err: unknown) => 
    axios.isAxiosError(err) ? err.response?.data?.error : (err instanceof Error ? err.message : 'Erro desconhecido');
  
  const magicToken = searchParams.get('magicToken');
  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState(!!magicToken);
  const loginTokenProcessed = useRef(false);

  const handleRedirect = useCallback((role: UserRole) => {
    const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
    navigate(target, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!magicToken || loginTokenProcessed.current) {

        return;
    }


    loginTokenProcessed.current = true;
    setIsMagicLoggingIn(true);

    // 🔒 007 — Remove o token da URL IMEDIATAMENTE antes de qualquer await.
    window.history.replaceState({}, document.title, window.location.pathname);

    const processMagicLogin = async () => {
      try {
        if (isAuthenticated && user) {
          setIsMagicLoggingIn(false);
          handleRedirect(user.role);
          setTimeout(() => {
            toast.error(`Acesso Bloqueado: Você já está logado como ${user.nome}. Saia da conta atual antes de acessar outro crachá.`);
          }, 100);
          return;
        }

        // ─── 🆕 Better Auth Nativo: QR Code via Plugin Customizado ───
        const { data: userLookup } = await api.post('/auth/qr-login', { loginToken: magicToken });



        if (userLookup.user?.email) {
            localStorage.setItem('klin_passkey_email', userLookup.user.email);
        }
        
        // Invoca login() — invalida query → useSession() recarrega → encontra cookie → authenticated ✅
        await login();


        toast.success(`Bem-vindo, ${userLookup.user.nome.split(' ')[0]}!`);

        const role = userLookup.user.role;
        const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
        navigate(target, { replace: true });

      } catch (err: unknown) {

        api.post('/logs', {
          level: 'FRAUD_ATTEMPT',
          source: 'FRONTEND',
          message: `Falha de Autenticação via QR/Link Mágico`,
          context: {
            erro: getErrorMessage(err),
            _navigator: { userAgent: navigator.userAgent }
          }
        }).catch(() => null);

        if (!(err as { _toastHandled?: boolean })._toastHandled) {
          toast.error(getErrorMessage(err) || 'Crachá inválido.', { id: 'auth-error' });
          (err as { _toastHandled?: boolean })._toastHandled = true;
        }
        setIsMagicLoggingIn(false);
        navigate('/login', { replace: true });
      }
    };

    processMagicLogin();
  }, [magicToken, navigate, isAuthenticated, login, logout, setSearchParams]);

  useEffect(() => {

    if (!authLoading && isAuthenticated && user?.role && !isMagicLoggingIn) {

      handleRedirect(user.role);
    }
  }, [isAuthenticated, user, authLoading, isMagicLoggingIn, handleRedirect]);

  const loginWithCredentials = async (data: { email?: string; senha?: string; password?: string; [key:string]: unknown }) => {
    try {
      const email = data.email || '';
      const password = data.password || data.senha || '';
      
      const { data: resData, error } = await signIn.email({
        email,
        password
      });

      if (error) {
        throw new Error(error.message || 'Credenciais inválidas.');
      }

      if (resData) {
        if (resData.user?.email) {
            localStorage.setItem('klin_passkey_email', resData.user.email);
        }

        login();
        toast.success('Acesso Autorizado. Bem-vindo de volta!');
      }
    } catch (err: unknown) {
      api.post('/logs', {
        level: 'WARNING',
        source: 'FRONTEND',
        message: `Falha de Autenticação de Credenciais`,
        context: {
          emailTentado: data.email,
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);
      if (!(err as { _toastHandled?: boolean })._toastHandled) {
          toast.error((err instanceof Error ? err.message : 'Erro desconhecido') || 'E-mail ou senha incorretos.', { id: 'auth-error' });
          (err as { _toastHandled?: boolean })._toastHandled = true;
      }
      throw err;
    }
  };

  const loginWithManualQr = async (qrManualToken: string) => {
    if (!qrManualToken.trim()) throw new Error('Digite o token.');

    const toastId = toast.loading('A validar credenciais seguras...');

    try {
      // 1. 🆕 Better Auth Nativo: Chama o Plugin Customizado via API
      const { data: userLookup } = await api.post('/auth/qr-login', { loginToken: qrManualToken });

      // 2. Magic link sucesso!
      if (userLookup.user?.email) {
        localStorage.setItem('klin_passkey_email', userLookup.user.email);
      }
      
      login();
      toast.dismiss(toastId);
      toast.success('Acesso Autorizado!');

    } catch (err: unknown) {
      api.post('/logs', {
        level: 'FRAUD_ATTEMPT',
        source: 'FRONTEND',
        message: `Falha de Autenticação via QR Manual`,
        context: {
          tentativaToken: qrManualToken,
          erro: getErrorMessage(err),
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);

      toast.dismiss(toastId);
      if (!(err as { _toastHandled?: boolean })._toastHandled) {
          toast.error(getErrorMessage(err) || 'Token inválido ou expirado.', { id: 'auth-error' });
          (err as { _toastHandled?: boolean })._toastHandled = true;
      }
      throw new Error(getErrorMessage(err) || 'Token inválido ou expirado.');
    }
  };

  return {
    isMagicLoggingIn,
    authLoading,
    loginWithCredentials,
    loginWithManualQr
  };
}
