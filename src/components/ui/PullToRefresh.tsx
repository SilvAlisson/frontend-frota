import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { hapticLight, hapticSuccess } from '../../lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const MAX_PULL = 70; // Distância necessária para disparar o refresh
  const RESISTANCE_FACTOR = 0.4;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Só permite o pull-to-refresh se estivermos no exato topo da página/container
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    
    const y = e.touches[0].clientY;
    const distance = y - startY;
    
    // Apenas puxando para baixo
    if (distance > 0) {
      const resistance = distance * RESISTANCE_FACTOR;
      const newPullDistance = Math.min(resistance, MAX_PULL + 30); // Permite passar um pouco do limite
      
      // Feedback físico sutil ao cruzar o limite exato de refresh
      if (pullDistance < MAX_PULL && newPullDistance >= MAX_PULL) {
        hapticLight();
      }
      
      setPullDistance(newPullDistance);
      
      // Impede o scroll nativo (refresh da página inteira no Chrome) quando estamos fazendo nosso pull customizado
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, [pulling, refreshing, startY, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling || refreshing) return;
    
    setPulling(false);
    
    if (pullDistance >= MAX_PULL) {
      setRefreshing(true);
      setPullDistance(MAX_PULL); // Trava na posição de loading
      hapticLight();
      
      try {
        await onRefresh();
        hapticSuccess(); // Vibração dupla de sucesso ao concluir
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Retorna à posição original se não puxou o suficiente
      setPullDistance(0);
    }
  }, [pulling, refreshing, pullDistance, onRefresh]);

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Indicador Animado (Atrás do conteúdo ou deslizando) */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden z-0 transition-all duration-300"
        style={{ 
          height: `${refreshing ? MAX_PULL : pullDistance}px`,
          opacity: pullDistance / MAX_PULL
        }}
      >
        <div className="bg-surface border border-border/50 shadow-sm rounded-full p-2 flex items-center justify-center">
          <RefreshCw 
            className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      {/* Container que Desliza */}
      <div 
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto scrollbar-thin relative z-10 bg-background transition-transform duration-300"
        style={{ 
          transform: `translateY(${refreshing ? MAX_PULL : pullDistance}px)`,
          // Se estiver puxando, remove a duração da transição para seguir o dedo instantaneamente
          ...(pulling && pullDistance > 0 ? { transitionDuration: '0ms' } : {})
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
