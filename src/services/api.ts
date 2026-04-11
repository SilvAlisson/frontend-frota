import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { toast } from 'sonner';

// Cria a instância do Axios com configurações otimizadas
export const api = axios.create({
  baseURL: RENDER_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// --- Interceptor de Requisição ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('authToken');

    // Lista de rotas que NÃO devem enviar o Authorization header
    const isAuthRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/login-token') ||
      config.url?.includes('/auth/register');

    // Anexar o token APENAS se ele existir E NÃO for uma rota de autenticação
    if (token && !isAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {

    // 1. Tratamento de Sessão Expirada (401)
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');

      if (!isLoginPage) {
        window.dispatchEvent(new Event('auth:unauthorized'));
        toast.error("Sua sessão expirou por segurança. Por favor, acesse novamente.");
      }
      return Promise.reject(error);
    }

    // 2. Erros de Autorização (403)
    if (error.response?.status === 403) {
      toast.error("Seu perfil atual não tem permissão para acessar este recurso.");
      return Promise.reject(error);
    }

    // 3. Rate Limiting (429)
    if (error.response?.status === 429) {
      toast.warning("Muitas tentativas em pouco tempo. Respire fundo e tente novamente em alguns segundos.");
      return Promise.reject(error);
    }

    // 4. Tratamento de Erro de Rede (Offline / Sem Sinal)
    if (error.code === "ERR_NETWORK" || !window.navigator.onLine) {
      toast.error("Parece que você está sem sinal. Verifique sua conexão e tente novamente.");
      return Promise.reject(error);
    }

    // 5. Erros de Servidor (500+)
    if (error.response?.status && error.response.status >= 500) {
      toast.error("Nossos servidores estão superaquecidos. Já estamos trabalhando nisso, tente novamente em breve.");
      return Promise.reject(error);
    }

    // 6. Erros 400 (Bad Request - Validações genéricas)
    if (error.response?.status === 400) {
      const responseData = error.response.data as { message?: string };
      const msgAtrelada = responseData?.message;
      if (msgAtrelada && typeof msgAtrelada === 'string') {
        toast.error(msgAtrelada);
      } else {
        toast.error("Não foi possível concluir a ação. Revise os dados informados.");
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);


