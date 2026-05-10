import { useState, useEffect } from 'react';
import { db } from '../services/db';

export function useOfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkQueue = async () => {
      try {
        const count = await db.syncQueue.count();
        setQueueSize(count);
      } catch (e) {
        setQueueSize(0);
      }
    };
    
    checkQueue();
    const interval = setInterval(checkQueue, 2000);
    return () => clearInterval(interval);
  }, [isOnline]);

  return { isOnline, queueSize };
}
