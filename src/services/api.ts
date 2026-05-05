import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { toast } from 'sonner';
import { z } from 'zod';
import { getDeviceContext } from '../utils/errorHandler';

export interface CustomAxiosError extends AxiosError {
  _toastHandled?: boolean;
}

const OFFLINE_QUEUE_KEY = 'frota_offline_queue';

const filaOfflineSchema = z.array(z.object({
  method: z.string(),
  url: z.string(),
  data: z.unknown().optional(),
  headers: z.unknown().optional()
}));

export const sanitizePayload = (payload: any): any => {
  if (!payload) return payload;
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return sanitizePayload(parsed);
    } catch {
      return payload;
    }
  }
  if (typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }

  const sanitized = { ...payload };
  const sensitiveKeys = ['password', 'senha', 'token', 'secret', 'magictoken'];
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }
  return sanitized;
};

export async function syncOfflineQueue() {
  const rawData = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!rawData) return;
  
  let parsedQueue;
  try {
    parsedQueue = JSON.parse(rawData);
  } catch (err) {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return;
  }

  const validacao = filaOfflineSchema.safeParse(parsedQueue);
  if (!validacao.success) {
    if (import.meta.env.DEV) console.error('Fila offline corrompida. Limpando...');
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return;
  }

  const queue = validacao.data;
  if (queue.length === 0) return;

  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  toast.info(`Sincronizando ${queue.length} ações salvas offline...`);

  for (const item of queue) {
    try {
      await api.request({
        method: item.method,
        url: item.url,
        data: item.data,
        headers: item.headers as Record<string, string>
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
  timeout: 30000, // Timeout de 30s
});

// --- Interceptor de Requisição ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('authToken');

    const isAuthRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/login-token') ||
      config.url?.includes('/auth/register');

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
    const method = error.config?.method?.toUpperCase() || 'HTTP';
    const urlChamada = error.config?.url || 'Desconhecida';

    // 1. Tratamento de Sessão Expirada (401)
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage) {
        window.dispatchEvent(new Event('auth:unauthorized'));
        toast.error("Sua sessão expirou por segurança. Por favor, acesse novamente.");
      }
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    // 2. Erros de Autorização (403)
    if (error.response?.status === 403) {
      toast.error("Seu perfil atual não tem permissão para acessar este recurso.");
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    // 3. Rate Limiting (429)
    if (error.response?.status === 429) {
      toast.warning("O servidor está sobrecarregado no momento. Tente de novo em alguns segundos.");
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    // 4. Tratamento de Erro de Rede (Offline / Sem Sinal / Timeout)
    if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED" || (typeof window !== 'undefined' && !window.navigator.onLine)) {
      
      // 🚀 Log silencioso de queda de rede para o auditoria (se não for a própria rota de log)
      if (!erroDeLog) {
         api.post('/logs', {
           level: 'WARNING',
           source: 'FRONTEND',
           message: `[API NETWORK/TIMEOUT] Falha de conexão: ${method} ${urlChamada}`,
           stackTrace: error.stack || error.message,
           context: {
             ...getDeviceContext(),
             _tipoErro: 'NETWORK_ERROR',
             _payloadTentado: error.config?.data ? sanitizePayload(error.config.data) : 'Nenhum'
           }
         }).catch(() => null);
      }

      if (error.config?.method && error.config.method.toLowerCase() !== 'get') {
        // Peão-Mode
        const headers = { ...error.config.headers };
        if (!headers['X-Idempotency-Key']) {
          headers['X-Idempotency-Key'] = crypto.randomUUID();
        }
        
        let queue = [];
        try { queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch (e) { queue = []; }
        
        queue.push({
          method: error.config.method,
          url: error.config.url,
          data: error.config.data,
          headers: headers
        });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        toast.warning("Offline Mode 👷: Você perdeu sinal. Ação salva offline e será enviada automaticamente quando voltar a internet.");
      } else {
        toast.error("Parece que você está sem sinal. Verifique a internet e tente novamente.");
      }
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    // 5. Erros de Servidor (500+)
    if (error.response?.status && error.response.status >= 500) {
      toast.error("O sistema está momentaneamente instável. Já estamos atuando, tente novamente em alguns instantes.");
      (error as CustomAxiosError)._toastHandled = true;
      // Não damos return aqui para que caia no BIG BROTHER abaixo e grave o log!
    }

    // 6. Erros 400 (Bad Request - Validações genéricas)
    else if (error.response?.status === 400) {
      const responseData = error.response.data as { message?: string, error?: string };
      const msgAtrelada = responseData?.message || responseData?.error;
      if (msgAtrelada && typeof msgAtrelada === 'string') {
        toast.error(msgAtrelada);
      } else {
        toast.error("Não foi possível concluir a ação. Revise os dados informados.");
      }
      (error as CustomAxiosError)._toastHandled = true;
      // Não damos return aqui para que caia no BIG BROTHER abaixo e grave o log!
    }

    // 7. BIG BROTHER DEFINITIVO (ENVIA OS ERROS PARA A AUDITORIA)
    if (!erroDeLog && error.response?.status && error.response.status >= 400) {
       let level = 'ERROR';
       if (error.response.status >= 400 && error.response.status < 500) {
         level = 'WARNING'; // 4xx são problemas de regra de negócio, não queda do servidor
       }
       if (error.response.status >= 500) {
         level = 'CRITICAL'; // 5xx o servidor explodiu
       }
       
       let parsedConfigData = {};
       try {
         parsedConfigData = error.config?.data ? JSON.parse(error.config.data) : {};
       } catch (e) {
         parsedConfigData = { raw: error.config?.data };
       }

       // ✨ AQUI: Usamos nosso rastreador avançado que extrai tudo do ambiente
       const context = {
         ...sanitizePayload(parsedConfigData),
         ...getDeviceContext(),
         _url: urlChamada,
         _method: method,
         _status: error.response.status,
         _respostaServidor: JSON.stringify(error.response.data)
       };

       api.post('/logs', {
          level: level,
          source: 'FRONTEND',
          message: `[API ${error.response.status}] ${method} ${urlChamada}`,
          stackTrace: JSON.stringify(error.response?.data) || null,
          context: context
       }).catch(() => null); 
    }

    return Promise.reject(error);
  }
);