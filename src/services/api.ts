import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { toast } from 'sonner';

// Cria a instância do Axios com configurações otimizadas
export const api = axios.create({
  baseURL: RENDER_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 segundos de timeout para evitar hangs
});

// --- Interceptor de Requisição ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');

    if (token) {
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
      const isLoginPage = window.location.pathname === '/login';

      // Só limpa e redireciona se já não estivermos no login (evita loops)
      if (!isLoginPage) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');

        // O toast pode não aparecer tempo suficiente antes do reload, 
        // mas é boa prática tentar notificar.
        // toast.error("Sessão expirada. Faça login novamente.");

        window.location.href = '/login';
      }
    }

    // 2. Tratamento de Erro de Rede (Servidor offline ou sem internet)
    if (error.code === "ERR_NETWORK") {
      toast.error("Sem conexão com o servidor. Verifique sua internet.");
    }

    // 3. Erros de Servidor (500)
    if (error.response?.status && error.response.status >= 500) {
      toast.error("Erro interno do servidor. Tente novamente mais tarde.");
    }

    return Promise.reject(error);
  }
);