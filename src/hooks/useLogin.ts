import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { UserRole } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, logout, isAuthenticated, user, loading: authLoading } = useAuth();
  
  const magicToken = searchParams.get('magicToken');
  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState(!!magicToken);
  const loginTokenProcessed = useRef(false);

  const handleRedirect = useCallback((role: UserRole) => {
    const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
    navigate(target, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!magicToken || loginTokenProcessed.current) return;

    loginTokenProcessed.current = true;
    setIsMagicLoggingIn(true);

    const processMagicLogin = async () => {
      try {
        if (isAuthenticated) {
          logout();
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const { data } = await api.post('/auth/login-token', { loginToken: magicToken });

        login(data);
        toast.success(`Bem-vindo, ${data.user.nome.split(' ')[0]}!`);

        setIsMagicLoggingIn(false);
        const role = data.user.role;
        const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
        navigate(target, { replace: true });
        window.history.replaceState({}, document.title, target);

      } catch (err: any) {
        api.post('/logs', {
          level: 'FRAUD_ATTEMPT',
          source: 'FRONTEND',
          message: `Falha de Autenticação via QR/Link Mágico`,
          context: {
            tentativaToken: magicToken,
            erro: err.response?.data?.error || err.message,
            _navigator: { userAgent: navigator.userAgent }
          }
        }).catch(() => null);

        toast.error(err.response?.data?.error || err.message || 'Crachá inválido.');
        setIsMagicLoggingIn(false);
        setSearchParams({});
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

  const loginWithCredentials = async (data: any) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data);
      toast.success('Acesso Autorizado. Bem-vindo de volta!');
    } catch (err: any) {
      api.post('/logs', {
        level: 'WARNING',
        source: 'FRONTEND',
        message: `Falha de Autenticação de Credenciais`,
        context: {
          emailTentado: data.email,
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);
      throw new Error('Credenciais inválidas.');
    }
  };

  const loginWithManualQr = async (qrManualToken: string) => {
    if (!qrManualToken.trim()) throw new Error('Digite o token.');

    const toastId = toast.loading('A validar credenciais seguras...');

    try {
      const { data } = await api.post('/auth/login-token', { loginToken: qrManualToken });
      login(data);
      toast.dismiss(toastId);
      toast.success('Acesso Autorizado!');
    } catch (err: any) {
      api.post('/logs', {
        level: 'FRAUD_ATTEMPT',
        source: 'FRONTEND',
        message: `Falha de Autenticação via QR Manual`,
        context: {
          tentativaToken: qrManualToken,
          erro: err.response?.data?.error || err.message,
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);

      toast.dismiss(toastId);
      throw new Error(err.response?.data?.error || err.message || 'Token inválido ou expirado.');
    }
  };

  return {
    isMagicLoggingIn,
    authLoading,
    loginWithCredentials,
    loginWithManualQr
  };
}
