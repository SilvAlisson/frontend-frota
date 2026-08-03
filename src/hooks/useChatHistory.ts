import { useState, useEffect, useCallback, type SetStateAction } from 'react';
import { type MensagemChat } from './useIA';

// ============================================================================
// ⚙️ CONSTANTES DE CONFIGURAÇÃO
// ============================================================================
const MAX_HISTORY_MESSAGES = 50;
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas de inatividade

// --- WRAPPER NATIVO DE INDEXEDDB ---
const getDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const req = indexedDB.open('KiaFrotaDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('history');
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const saveToDB = async (data: MensagemChat[]) => {
  const db = await getDB();
  db.transaction('history', 'readwrite').objectStore('history').put(data, 'kia_chat');
};

const loadFromDB = async (): Promise<MensagemChat[] | undefined> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('history', 'readonly').objectStore('history').get('kia_chat');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// --- HOOK DE ESTADO ---
export function useChatHistory() {
  const [mensagens, setMensagensState] = useState<MensagemChat[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFromDB().then((historico) => {
      if (historico && historico.length > 0) {
        const ultimaMsg = historico[historico.length - 1];
        const inativo = Date.now() - new Date(ultimaMsg.timestamp).getTime() > SESSION_TIMEOUT_MS;
        
        if (!inativo) {
          setMensagensState(historico.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
          // 💡 Tratando a Floating Promise ao limpar
          saveToDB([]).catch(e => console.error('[KiaDB] Erro ao limpar sessão inativa:', e));
        }
      }
      setIsLoaded(true);
    }).catch(e => console.error('[KiaDB] Erro ao inicializar o banco:', e));
  }, []);

  const setMensagens = useCallback((updater: SetStateAction<MensagemChat[]>) => {
    setMensagensState((prev) => {
      const novo = typeof updater === 'function' ? updater(prev) : updater;
      
      // 💡 Tratando a Floating Promise ao salvar e usando a Constante
      saveToDB(novo.slice(-MAX_HISTORY_MESSAGES))
        .catch(e => console.error('[KiaDB] Falha crítica ao salvar histórico offline:', e));
      
      return novo;
    });
  }, []);

  const limparConversa = useCallback(() => {
    setMensagens([]);
  }, [setMensagens]);

  return { mensagens, setMensagens, limparConversa, isLoaded };
}