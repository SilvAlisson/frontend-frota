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

  const sanitized: Record<string, unknown> = {};
  if (payload && typeof payload === 'object') {
    Object.assign(sanitized, payload);
  }
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
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 s — a IA usa SSE, portanto não precisamos de timeouts longos
});

// --- Interceptor de Requisição ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { metadata?: unknown }) => {
    // Injeta o relógio para medir a latência exata
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
    return 'Sessão WebAuth (Cookies)';
  } catch {
    return 'Não Identificado';
  }
}

function logToAuditTracker(error: AxiosError, duration: number, userLogadoInfo: string, method: string, urlChamada: string) {
  const excludedRoutes = ['/logs', '/auth/login', '/health', '/metrics'];
  const isExcluded = excludedRoutes.some(route => error.config?.url?.includes(route));
  if (isExcluded) return; // Nunca loga a própria rota de logs para evitar loop infinito

  const status = error.response?.status;
  
  let level = 'WARNING';
  if (!status) level = 'ERROR'; // Falha de rede, CORS, timeout
  else if (status >= 500) level = 'CRITICAL'; // Erros internos do servidor
  else if (status === 401 || status === 403) level = 'SECURITY'; // Falhas de autenticação/permissão
  
  let parsedConfigData = {};
  try {
    parsedConfigData = error.config?.data ? JSON.parse(error.config.data) : {};
  } catch {
    parsedConfigData = { raw: error.config?.data };
  }

  const sanitizedData = sanitizePayload(parsedConfigData);
  const context = {
    ...(typeof sanitizedData === 'object' && sanitizedData !== null ? sanitizedData : { data: sanitizedData }),
    ...getDeviceContext(),
    _dataHoraBatida: new Date().toLocaleString('pt-BR'),
    _usuarioLogado: userLogadoInfo,
    _tempoDeRespostaMs: duration,
    _url: urlChamada,
    _method: method,
    _status: status || 'NETWORK_ERROR',
    _respostaServidor: error.response?.data ? JSON.stringify(error.response.data) : error.message
  };

  api.post('/logs', {
    level,
    source: 'FRONTEND',
    message: `[API ${status || 'NETWORK_ERROR'}] ${method} ${urlChamada}`,
    stackTrace: error.response?.data ? JSON.stringify(error.response.data) : error.stack || null,
    context
  }).catch((logError) => {
    // Falhou ao enviar o log para o backend (ex: sem internet ou backend fora do ar)
    // Console log explícito em vez de engolir o erro
    console.error('[AUDIT_TRACKER] Falha ao sincronizar log com servidor:', logError);
    console.error('[AUDIT_TRACKER] Payload que seria enviado:', context);
    
    // Fallback: Salva no localStorage (em um cenário real seria IndexedDB/ServiceWorker Sync)
    try {
        const MAX_OFFLINE_LOGS = 50;
        let filaAntiga = JSON.parse(localStorage.getItem('klin_offline_logs') || '[]');
        filaAntiga.push({ level, method, urlChamada, context, timestamp: new Date().toISOString() });
        
        if (filaAntiga.length > MAX_OFFLINE_LOGS) {
            filaAntiga = filaAntiga.slice(filaAntiga.length - MAX_OFFLINE_LOGS);
        }
        
        localStorage.setItem('klin_offline_logs', JSON.stringify(filaAntiga));
    } catch (storageError) {
        console.error('[AUDIT_TRACKER] Falha ao salvar log localmente:', storageError);
    }
  });
}

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response) => {
    // HAPTICS: Se for uma operação de escrita (Salvar, Editar, Apagar), vibrar em comemoração
    const method = response.config?.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      // Evita vibrar apenas ao enviar logs
      if (!response.config?.url?.includes('logs') && response.status >= 200 && response.status < 300) {
        hapticSuccess();
      }
    }
    return response;
  },
  (error: CustomAxiosError & { config: { metadata?: { startTime: Date } } }) => {
    const method = error.config?.method?.toUpperCase() || 'HTTP';
    const urlChamada = error.config?.url || 'Desconhecida';

    const endTime = new Date();
    const duration = error.config?.metadata?.startTime 
      ? endTime.getTime() - error.config.metadata.startTime.getTime() 
      : 0;

    const userLogadoInfo = getUserInfoForLog();

    // Registrar na Central de Auditorias antes de qualquer return
    logToAuditTracker(error, duration, userLogadoInfo, method, urlChamada);

    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage) {
        const now = Date.now();
        const lastAlert = parseInt(localStorage.getItem('klin_unauthorized_alert_ts') || '0', 10);
        
        // Bloqueio de 5 segundos compartilhado entre requisições e abas
        if (now - lastAlert > 5000) {
          localStorage.setItem('klin_unauthorized_alert_ts', now.toString());
          window.dispatchEvent(new Event('auth:unauthorized'));
          toast.error('Sua sessão expirou por segurança. Por favor, acesse novamente.', { id: 'unauthorized-toast' });
        }
      }
      error._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      toast.error('Seu perfil atual não tem permissão para acessar este recurso.');
      error._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      toast.warning('O servidor está sobrecarregado no momento. Tente de novo em alguns segundos.');
      error._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status && error.response.status >= 400 && error.response.status < 500 && ![401, 403, 429].includes(error.response.status)) {
      const responseData = error.response.data as { error?: string; message?: string } | undefined;
      const serverMsg = responseData?.error || responseData?.message;
      toast.error(serverMsg || 'Falha na requisição. Verifique os dados e tente novamente.');
      error._toastHandled = true;
    }

    if (error.response?.status && error.response.status >= 500) {
      toast.error('O sistema está momentaneamente instável. Já estamos atuando, tente novamente em alguns instantes.');
      error._toastHandled = true;
    }
    
    // Fallback de erro de rede (quando a API está fora do ar ou CORS)
    if (!error.response) {
      toast.error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
      error._toastHandled = true;
    }
    
    return Promise.reject(error);
  }
);