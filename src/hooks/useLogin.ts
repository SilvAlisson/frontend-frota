import axios from 'axios';
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

    // 🔒 007 — Remove o token da URL IMEDIATAMENTE antes de qualquer await.
    // Antes ficava exposto durante toda a duração da API call (~200-500ms).
    // window.history.replaceState não causa re-render, apenas limpa a URL visível e o histórico.
    window.history.replaceState({}, document.title, window.location.pathname);

    const processMagicLogin = async () => {
      try {
        if (isAuthenticated) {
          logout();
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const { data } = await api.post('/auth-custom/login-token', { loginToken: magicToken });

        // 🔥 ADICIONE ISTO: Salva a âncora do operador silenciosamente
        if (data.user?.email) {
            localStorage.setItem('klin_passkey_email', data.user.email);
        }

        login(data);
        toast.success(`Bem-vindo, ${data.user.nome.split(' ')[0]}!`);

        setIsMagicLoggingIn(false);
        const role = data.user.role;
        const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
        navigate(target, { replace: true });

      } catch (err: unknown) {
        api.post('/logs', {
          level: 'FRAUD_ATTEMPT',
          source: 'FRONTEND',
          message: `Falha de Autenticação via QR/Link Mágico`,
          context: {
            // 🔒 007 — Não logamos o token em si, apenas o tipo de erro.
            // O token já foi removido da URL no início do processamento.
            erro: (axios.isAxiosError(err) ? (axios.isAxiosError(err) ? err.response?.data?.error : undefined) : (err instanceof Error ? err.message : 'Erro desconhecido')),
            _navigator: { userAgent: navigator.userAgent }
          }
        }).catch(() => null);

        toast.error((axios.isAxiosError(err) ? (axios.isAxiosError(err) ? err.response?.data?.error : undefined) : (err instanceof Error ? err.message : 'Erro desconhecido')) || 'Crachá inválido.');
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
      
      const { signIn } = await import('../lib/auth-client');
      const { data: resData, error } = await signIn.email({
        email,
        password
      });

      if (error) {
        throw new Error(error.message || 'Credenciais inválidas.');
      }

      if (resData) {
        // Fallback robusto contra bloqueio de Third-Party Cookies (Ex: Chrome Incognito, Edge)
        // O Better Auth retorna a sessão completa. Extraímos o token para usar como Bearer Header
        const sessionObj = (resData as any).session;
        const tokenStr = sessionObj?.token || (resData as any).token;
        if (tokenStr) {
          sessionStorage.setItem('authToken', tokenStr);
        }

        // 🔥 SOLUÇÃO: Salva o email logado como âncora para a próxima tentativa de biometria
        if (resData.user?.email) {
            localStorage.setItem('klin_passkey_email', resData.user.email);
        }

        // Better Auth não retorna JWT, o cookie é gerido automaticamente (quando permitido).
        // O `AuthContext` irá reagir ao recarregar a sessão ou se inscrever, mas 
        // para dar o feedback imediato, chamamos `login` simbolicamente com o user.
        login({ user: resData.user as User });
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
      toast.error((err instanceof Error ? err.message : 'Erro desconhecido') || 'E-mail ou senha incorretos.');
      throw err;
    }
  };

  const loginWithManualQr = async (qrManualToken: string) => {
    if (!qrManualToken.trim()) throw new Error('Digite o token.');

    const toastId = toast.loading('A validar credenciais seguras...');

    try {
      const { data } = await api.post('/auth-custom/login-token', { loginToken: qrManualToken });
      
      // 🔥 ADICIONE ISTO: Salva a âncora do operador silenciosamente
      if (data.user?.email) {
          localStorage.setItem('klin_passkey_email', data.user.email);
      }
      
      login(data);
      toast.dismiss(toastId);
      toast.success('Acesso Autorizado!');
    } catch (err: unknown) {
      api.post('/logs', {
        level: 'FRAUD_ATTEMPT',
        source: 'FRONTEND',
        message: `Falha de Autenticação via QR Manual`,
        context: {
          tentativaToken: qrManualToken,
          erro: (axios.isAxiosError(err) ? (axios.isAxiosError(err) ? err.response?.data?.error : undefined) : (err instanceof Error ? err.message : 'Erro desconhecido')),
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);

      toast.dismiss(toastId);
      toast.error((axios.isAxiosError(err) ? (axios.isAxiosError(err) ? err.response?.data?.error : undefined) : (err instanceof Error ? err.message : 'Erro desconhecido')) || 'Token inválido ou expirado.');
      throw new Error((axios.isAxiosError(err) ? (axios.isAxiosError(err) ? err.response?.data?.error : undefined) : (err instanceof Error ? err.message : 'Erro desconhecido')) || 'Token inválido ou expirado.');
    }
  };

  return {
    isMagicLoggingIn,
    authLoading,
    loginWithCredentials,
    loginWithManualQr
  };
}
