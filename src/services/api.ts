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
    const token = localStorage.getItem('authToken');

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
      // Verifica se contém '/login' para cobrir casos como '/login?redirect=...'
      const isLoginPage = window.location.pathname.includes('/login');

      if (!isLoginPage) {
        // Dispara um evento global para o React lidar com o logout suavemente (sem F5 forçado)
        window.dispatchEvent(new Event('auth:unauthorized'));
        
        // Avisa o usuário
        toast.error("Sessão expirada. Por favor, faça login novamente.");
      }
    }

    // 2. Tratamento de Erro de Rede
    if (error.code === "ERR_NETWORK") {
      toast.error("Sem conexão com o servidor. Verifique sua internet.");
    }

    // 3. Erros de Servidor (500+)
    if (error.response?.status && error.response.status >= 500) {
      toast.error("Erro interno do servidor. Tente novamente mais tarde.");
    }

    return Promise.reject(error);
  }
);