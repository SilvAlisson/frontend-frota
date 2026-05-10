import Dexie, { type Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  method: string;
  url: string;
  data: any;
  headers: Record<string, string>;
  createdAt: string;
  hash: string; // Anti-tampering hash
}

export interface AuthCacheItem {
  token: string;
  user: any;
  savedAt: number; // timestamp in milliseconds
}

export interface MasterDataItem {
  key: string;
  data: any;
  updatedAt: number;
}

export interface SyncErrorItem {
  id?: number;
  url: string;
  payload: any;
  errorResponse: any;
  createdAt: string;
}

export class KlinOfflineDB extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>;
  authCache!: Table<AuthCacheItem, string>; // key is the token string itself
  masterData!: Table<MasterDataItem, string>; // key is the endpoint or resource name e.g. 'veiculos'
  syncErrors!: Table<SyncErrorItem, number>;

  constructor() {
    super('KlinOfflineDB');
    this.version(1).stores({
      syncQueue: '++id, method, url, createdAt', // id is auto-incremented primary key
      authCache: 'token, savedAt', // token is primary key
      masterData: 'key, updatedAt', // key is primary key
      syncErrors: '++id, url, createdAt' // log de conflitos do servidor
    });
  }
}

export const db = new KlinOfflineDB();

// Helper to generate a simple hash for tampering protection
export const generateTamperHash = async (payloadStr: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadStr + "_KLIN_007_SECRET");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper for 3-day offline limit
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const checkOfflineLoginEligibility = async (token: string): Promise<{ eligible: boolean, user?: any, message?: string }> => {
  const cachedAuth = await db.authCache.get(token);
  
  if (!cachedAuth) {
    return { eligible: false, message: 'Nenhum login offline salvo encontrado para este token.' };
  }

  const now = Date.now();
  if (now - cachedAuth.savedAt > THREE_DAYS_MS) {
    return { 
      eligible: false, 
      message: 'Sua sessão offline expirou (mais de 3 dias). É necessário se conectar à internet para continuar.' 
    };
  }

  return { eligible: true, user: cachedAuth.user };
};

export const saveOfflineLogin = async (token: string, user: any) => {
  await db.authCache.put({
    token,
    user,
    savedAt: Date.now()
  });
};
