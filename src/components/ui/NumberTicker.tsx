// src/components/ui/NumberTicker.tsx
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface NumberTickerProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function NumberTicker({
  value,
  duration = 5.5, 
  className,
  formatter
}: NumberTickerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Curva de Animação (EaseOutExpo): Começa rápido e desacelera suavemente no fim
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCurrent(value * easeProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(value); // Garante que termina exatamente no valor final
      }
    };

    setCurrent(0);
    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  // Se o Usuário fornecer um formatador (ex: R$), usamos. Senão, formatação padrão.
  const displayValue = formatter ? formatter(current) : current.toLocaleString('pt-BR');

  return (
    // tabular-nums garante que os números ocupam a mesma largura, evitando tremores (layout shift)
    <span className={cn("inline-block tabular-nums", className)}>
      {displayValue}
    </span>
  );
}


