import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { toast } from 'sonner';
import { getDeviceContext } from '../utils/errorHandler';

export interface CustomAxiosError extends AxiosError {
  _toastHandled?: boolean;
}

import { db, generateTamperHash, saveOfflineLogin } from './db';
import { base64ToFile } from '../utils/imageCompressor';

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

async function verifyTampering(item: any): Promise<boolean> {
  const payloadStr = JSON.stringify({ method: item.method, url: item.url, data: item.data });
  const computedHash = await generateTamperHash(payloadStr);
  return computedHash === item.hash;
}

async function processSyncItem(item: any): Promise<boolean> {
  if (!(await verifyTampering(item))) {
    console.error('Tampering detectado na fila offline. Ação bloqueada.', item);
    await db.syncQueue.delete(item.id!);
    return false;
  }

  try {
    let dataToSend = item.data;
    if (typeof dataToSend === 'string') {
      try { dataToSend = JSON.parse(dataToSend); } catch(e){}
    }

    // INTERCEPTADOR DE IMAGENS OFFLINE (Base64 -> R2)
    if (dataToSend && dataToSend._offlineFile_) {
      const { base64, fileName, fileType, originalType, targetField } = dataToSend._offlineFile_;
      const fileObj = base64ToFile(base64, fileName);
      
      const token = sessionStorage.getItem('authToken');
      const presignRes = await axios.post(`${RENDER_API_BASE_URL}/r2/presign`, {
        fileName,
        contentType: originalType,
        folder: fileType
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      const { presignedUrl, publicUrl } = presignRes.data;
      
      await fetch(presignedUrl, {
        method: 'PUT',
        body: fileObj,
        headers: { 'Content-Type': originalType }
      });

      dataToSend[targetField] = publicUrl;
      delete dataToSend._offlineFile_;
    }

    await api.request({
      method: item.method,
      url: item.url,
      data: dataToSend,
      headers: item.headers as Record<string, string>
    });
    await db.syncQueue.delete(item.id!);
    return true;
  } catch (error: any) {
    console.error('Falha ao sincronizar item offline', error);
    if (
      error.code === "ERR_NETWORK" || 
      error.code === "ECONNABORTED" || 
      error.code === "ERR_CANCELED" ||
      (error.response?.status && error.response.status >= 500)
    ) {
       throw error;
    }

    // RESOLUÇÃO DE CONFLITO: Servidor rejeitou os dados offline (Ex: KM inválido).
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      await db.syncErrors.add({
        url: item.url,
        payload: item.data,
        errorResponse: error.response.data,
        createdAt: new Date().toISOString()
      });
      console.warn('Conflito detectado. Ação salva em syncErrors.');
    }

    await db.syncQueue.delete(item.id!);
    return false;
  }
}

export async function syncOfflineQueue() {
  const queue = await db.syncQueue.orderBy('createdAt').toArray();
  if (queue.length === 0) return;

  toast.info(`Sincronizando ${queue.length} ações salvas offline...`);

  let successCount = 0;
  let failCount = 0;

  for (const item of queue) {
    try {
      const isSuccess = await processSyncItem(item);
      if (isSuccess) successCount++;
    } catch {
      failCount++;
    }
  }
  
  if (failCount > 0) {
    toast.error(`Falha ao sincronizar ${failCount} ações. Tentaremos novamente depois.`);
  } else if (successCount > 0) {
    toast.success(`Sincronização offline (${successCount}) concluída com sucesso!`);
  }

  // Telemetria: Rastrear resolução da fila (Analytics)
  if (successCount > 0 || failCount > 0) {
    api.post('/logs', {
      level: failCount > 0 ? 'WARNING' : 'INFO',
      source: 'FRONTEND',
      message: `[ANALYTICS] sync_queue_resolved`,
      context: { successCount, failCount, totalProcessed: queue.length }
    }).catch(() => null);
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
  (config: InternalAxiosRequestConfig & { metadata?: any }) => {
    
    // 🔥 MÁGICA DO OFFLINE-FIRST: Corte instantâneo sem esperar 30s de timeout!
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      // Se não for um GET, cancela agora mesmo e empurra pro erro de rede para salvar na fila
      if (config.method && config.method.toUpperCase() !== 'GET') {
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort("USER_IS_OFFLINE");
      }
    }

    const token = sessionStorage.getItem('authToken');

    const isAuthRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/login-token') ||
      config.url?.includes('/auth/register');

    if (token && !isAuthRoute) {
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
    const userStorage = localStorage.getItem('klin_user') || sessionStorage.getItem('klin_user') || localStorage.getItem('user');
    if (userStorage) {
      const user = JSON.parse(userStorage);
      return `ID: ${user.id} | Nome: ${user.nome} | Cargo: ${user.role}`;
    }
  } catch { /* Silencioso */ }
  return "Deslogado / Desconhecido";
}

function logToAuditTracker(error: AxiosError, duration: number, userLogadoInfo: string, method: string, urlChamada: string) {
  const isLogRoute = !!error.config?.url?.includes('/logs');
  if (isLogRoute || !error.response?.status || error.response.status < 400) return;

  const level = error.response.status >= 500 ? 'CRITICAL' : 'WARNING';
  
  let parsedConfigData = {};
  try {
    parsedConfigData = error.config?.data ? JSON.parse(error.config.data) : {};
  } catch {
    parsedConfigData = { raw: error.config?.data };
  }

  const context = {
    ...sanitizePayload(parsedConfigData),
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

function handleOfflineFallback(error: AxiosError, duration: number, userLogadoInfo: string, method: string, urlChamada: string) {
  const isLogRoute = !!error.config?.url?.includes('/logs');
  if (!isLogRoute) {
    api.post('/logs', {
      level: 'WARNING',
      source: 'FRONTEND',
      message: `[API NETWORK_ERROR] Falha de conexão: ${method} ${urlChamada}`,
      stackTrace: error.stack || error.message,
      context: {
        ...getDeviceContext(),
        _tipoErro: 'NETWORK_ERROR',
        _dataHoraBatida: new Date().toLocaleString('pt-BR'),
        _usuarioLogado: userLogadoInfo,
        _tempoTentandoConectarMs: duration,
        _possivelMotivo: duration >= 30000 ? 'Timeout - Conexão Lenta/DB Travado' : 'Sem Internet / Queda Seca (Offline-First)',
        _payloadTentado: error.config?.data ? sanitizePayload(error.config.data) : 'Nenhum'
      }
    }).catch(() => null);
  }

  if (error.config?.method && error.config.method.toLowerCase() !== 'get' && !isLogRoute) {
    const headers = { ...error.config.headers };
    if (!headers['X-Idempotency-Key']) {
      headers['X-Idempotency-Key'] = crypto.randomUUID();
    }
    
    let dataPayload = error.config.data;
    if (dataPayload) {
      try {
        let parsedObj = typeof dataPayload === 'string' ? JSON.parse(dataPayload) : dataPayload;
        if (typeof parsedObj === 'object' && !parsedObj.actionCreatedAt) {
          parsedObj.actionCreatedAt = new Date().toISOString();
          dataPayload = JSON.stringify(parsedObj);
        }
      } catch(e){}
    }

    const methodToSave = error.config.method || 'POST';
    const urlToSave = error.config.url || '';
    const payloadStr = JSON.stringify({ method: methodToSave, url: urlToSave, data: dataPayload });
    
    generateTamperHash(payloadStr).then(hash => {
      db.syncQueue.add({
        method: methodToSave,
        url: urlToSave,
        data: dataPayload,
        headers: headers as Record<string, string>,
        createdAt: new Date().toISOString(),
        hash: hash
      }).catch(() => null);
    });

    toast.warning("Offline Mode 👷: Você perdeu sinal. Ação salva offline e será enviada automaticamente.");
  } else if (!isLogRoute) {
    toast.error("Parece que você está sem sinal. Verifique a internet e tente novamente.");
  }
}

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes('/auth/login') || response.config.url?.includes('/auth/login-token')) {
      if (response.data?.token && response.data?.user?.loginToken) {
        saveOfflineLogin(response.data.user.loginToken, response.data).catch(() => null);
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

    const isNetworkError = error.code === "ERR_NETWORK" || 
                           error.code === "ECONNABORTED" || 
                           error.code === "ERR_CANCELED" || 
                           error.message === "USER_IS_OFFLINE" ||
                           (typeof window !== 'undefined' && !window.navigator.onLine);

    if (isNetworkError) {
      handleOfflineFallback(error, duration, userLogadoInfo, method, urlChamada);
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage) {
        window.dispatchEvent(new Event('auth:unauthorized'));
        toast.error("Sua sessão expirou por segurança. Por favor, acesse novamente.");
      }
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      toast.error("Seu perfil atual não tem permissão para acessar este recurso.");
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      toast.warning("O servidor está sobrecarregado no momento. Tente de novo em alguns segundos.");
      (error as CustomAxiosError)._toastHandled = true;
      return Promise.reject(error);
    }

    if (error.response?.status && error.response.status >= 500) {
      toast.error("O sistema está momentaneamente instável. Já estamos atuando, tente novamente em alguns instantes.");
      (error as CustomAxiosError)._toastHandled = true;
    } else if (error.response?.status === 400) {
      const responseData = error.response.data as { message?: string, error?: string };
      const msgAtrelada = responseData?.message || responseData?.error;
      toast.error(typeof msgAtrelada === 'string' ? msgAtrelada : "Não foi possível concluir a ação. Revise os dados informados.");
      (error as CustomAxiosError)._toastHandled = true;
    }

    logToAuditTracker(error, duration, userLogadoInfo, method, urlChamada);
    
    return Promise.reject(error);
  }
);