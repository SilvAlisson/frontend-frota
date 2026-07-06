import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { toast } from 'sonner';
import { getDeviceContext } from '../utils/errorHandler';
import { hapticSuccess } from '../lib/haptics';

export interface CustomAxiosError extends AxiosError {
  _toastHandled?: boolean;
}

export const sanitizePayload = (payload: unknown): unknown => {
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

  const sanitized: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
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

// Cria a instância do Axios com configurações otimizadas
export const api = axios.create({
  baseURL: RENDER_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 segundos para suportar as análises complexas da IA
  withCredentials: true,
});

// --- Interceptor de Requisição ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { metadata?: unknown }) => {
    const token = sessionStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ⏱️ Injeta o relógio para medir a latência exata
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Helper Functions para Tratamento de Erros ---
function getUserInfoForLog(): string {
  try {
    const userStorage = sessionStorage.getItem('authUser');
    if (userStorage) {
      const user = JSON.parse(userStorage);
      return `ID: ${user.id} | Nome: ${user.nome} | Cargo: ${user.role}`;
    }
  } catch (e) { console.error("[API] Erro ao ler usuário do sessionStorage:", e); }
  return 'Deslogado / Desconhecido';
}

function logToAuditTracker(error: AxiosError, duration: number, userLogadoInfo: string, method: string, urlChamada: string) {
  const isLogRoute = !!error.config?.url?.includes('logs');
  if (isLogRoute || !error.response?.status || error.response.status < 400) return;

  const level = error.response.status >= 500 ? 'CRITICAL' : 'WARNING';
  
  let parsedConfigData = {};
  try {
    parsedConfigData = error.config?.data ? JSON.parse(error.config.data) : {};
  } catch {
    parsedConfigData = { raw: error.config?.data };
  }

  const context = {
    ...sanitizePayload(parsedConfigData) as Record<string, unknown>,
    ...getDeviceContext(),
    _dataHoraBatida: new Date().toLocaleString('pt-BR'),
    _usuarioLogado: userLogadoInfo,
    _tempoDeRespostaMs: duration,
    _url: urlChamada,
    _method: method,
    _status: error.response.status,
    _respostaServidor: JSON.stringify(error.response.data)
  };

  api.post('/logs', {
    level,
    source: 'FRONTEND',
    message: `[API ${error.response.status}] ${method} ${urlChamada}`,
    stackTrace: JSON.stringify(error.response?.data) || null,
    context
  }).catch(() => null);
}

let isUnauthorizedAlertShown = false;

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response) => {
    // 📳 HAPTICS: Se for uma operação de escrita (Salvar, Editar, Apagar), vibrar em comemoração
    const method = response.config?.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      // Evita vibrar apenas ao enviar logs
      if (!response.config?.url?.includes('logs') && response.status >= 200 && response.status < 300) {
        hapticSuccess();
      }
    }
    return response;
  },
  (error: AxiosError & { config: { metadata?: { startTime: Date } } }) => {
    const method = error.config?.method?.toUpperCase() || 'HTTP';
    const urlChamada = error.config?.url || 'Desconhecida';

    const endTime = new Date();
    const duration = error.config?.metadata?.startTime 
      ? endTime.getTime() - error.config.metadata.startTime.getTime() 
      : 0;

    const userLogadoInfo = getUserInfoForLog();

    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage && !isUnauthorizedAlertShown) {
        isUnauthorizedAlertShown = true;
        window.dispatchEvent(new Event('auth:unauthorized'));
        toast.error('Sua sessão expirou por segurança. Por favor, acesse novamente.', { id: 'unauthorized-toast' });
        
        // Reset after 5 seconds to prevent permanent lock if user doesn't redirect
        setTimeout(() => { isUnauthorizedAlertShown = false; }, 5000);
      }
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      toast.error('Seu perfil atual não tem permissão para acessar este recurso.');
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      toast.warning('O servidor está sobrecarregado no momento. Tente de novo em alguns segundos.');
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status && error.response.status >= 400 && error.response.status < 500 && ![401, 403, 429].includes(error.response.status)) {
      const responseData = error.response.data as { error?: string; message?: string } | undefined;
      const serverMsg = responseData?.error || responseData?.message;
      toast.error(serverMsg || 'Falha na requisição. Verifique os dados e tente novamente.');
      (error as CustomAxiosError)._toastHandled = true;
    }

    if (error.response?.status && error.response.status >= 500) {
      toast.error('O sistema está momentaneamente instável. Já estamos atuando, tente novamente em alguns instantes.');
      (error as CustomAxiosError)._toastHandled = true;
    }

    logToAuditTracker(error, duration, userLogadoInfo, method, urlChamada);
    
    return Promise.reject(error);
  }
);