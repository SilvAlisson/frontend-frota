import { useState, useEffect, useCallback, type SetStateAction } from 'react';
import { type MensagemChat } from './useIA';

// --- WRAPPER NATIVO DE INDEXEDDB (Assíncrono, não trava a tela) ---
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
        const inativo = Date.now() - new Date(ultimaMsg.timestamp).getTime() > 2 * 60 * 60 * 1000;
        
        // Se inativo por 2 horas, começa limpo. Se não, restaura as datas.
        if (!inativo) {
          setMensagensState(historico.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
          saveToDB([]);
        }
      }
      setIsLoaded(true);
    }).catch(console.error);
  }, []);

  const setMensagens = useCallback((updater: SetStateAction<MensagemChat[]>) => {
    setMensagensState((prev) => {
      const novo = typeof updater === 'function' ? updater(prev) : updater;
      saveToDB(novo.slice(-50)); // Mantém as últimas 50 de forma assíncrona
      return novo;
    });
  }, []);

  const limparConversa = useCallback(() => {
    setMensagens([]);
  }, [setMensagens]);

  return { mensagens, setMensagens, limparConversa, isLoaded };
}