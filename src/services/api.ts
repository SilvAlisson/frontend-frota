import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { toast } from 'sonner';

const OFFLINE_QUEUE_KEY = 'frota_offline_queue';

export async function syncOfflineQueue() {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  if (queue.length === 0) return;

  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  toast.info(`Sincronizando ${queue.length} ações salvas offline...`);

  for (const item of queue) {
    try {
      await api.request({
        method: item.method,
        url: item.url,
        data: item.data,
        headers: item.headers
      });
    } catch (e) {
      console.error('Falha ao sincronizar item offline', e);
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineQueue);
}

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

    const erroDeLog = !!error.config?.url?.includes('/logs');

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
      toast.warning("O servidor está sobrecarregado no momento. Tente de novo em alguns segundos.");
      return Promise.reject(error);
    }

    // 4. Tratamento de Erro de Rede (Offline / Sem Sinal)
    if (error.code === "ERR_NETWORK" || (typeof window !== 'undefined' && !window.navigator.onLine)) {
      if (error.config?.method && error.config.method.toLowerCase() !== 'get') {
        // Frente 2: Peão-Mode (Salva operação localmente para tentar mais tarde)
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        queue.push({
          method: error.config.method,
          url: error.config.url,
          data: error.config.data,
          headers: error.config.headers
        });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        toast.warning("Peão Mode 👷: Você perdeu sinal. Ação salva offline e será enviada automaticamente quando voltar a internet.");
      } else {
        toast.error("Parece que você está sem sinal. Verifique a internet e tente novamente.");
      }
      return Promise.reject(error);
    }

    // 5. Erros de Servidor (500+)
    if (error.response?.status && error.response.status >= 500) {
      toast.error("O sistema está momentaneamente instável. Já estamos atuando, tente novamente em alguns instantes.");
      return Promise.reject(error);
    }

    // 6. Erros 400 (Bad Request - Validações genéricas)
    if (error.response?.status === 400) {
      const responseData = error.response.data as { message?: string, error?: string };
      const msgAtrelada = responseData?.message || responseData?.error;
      if (msgAtrelada && typeof msgAtrelada === 'string') {
        toast.error(msgAtrelada);
      } else {
        toast.error("Não foi possível concluir a ação. Revise os dados informados.");
      }
      return Promise.reject(error);
    }

    // 7. BIG BROTHER (ENVIA OS ERROS 500+ SILENCIOSAMENTE PARA A AUDITORIA)
    // Impede loop infinito
    if (!erroDeLog && (error.response?.status && error.response.status >= 500)) {
       // O uso da instância global sem await previne travamento do runtime do front.
       api.post('/logs', {
          level: 'ERROR',
          source: 'FRONTEND',
          message: error.message,
          stackTrace: JSON.stringify(error.response?.data) || null,
          context: JSON.parse(error.config?.data || '{}')
       }).catch(() => null); 
    }

    return Promise.reject(error);
  }
);


