import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useNetwork } from '../../hooks/useNetwork';
import { cn } from '../../lib/utils';

export function NetworkStatus() {
  const { isOnline } = useNetwork();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Delay dismissing so user can see it went back online if we wanted
      // But for a simple approach, just hide when online
      setShow(false);
    }
  }, [isOnline]);

  if (!show && isOnline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center p-2 transition-all duration-500 ease-in-out pointer-events-none",
        !isOnline ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="bg-error/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-4">
        <WifiOff className="w-3.5 h-3.5" />
        Você está offline. Aguardando conexão...
      </div>
    </div>
  );
}
