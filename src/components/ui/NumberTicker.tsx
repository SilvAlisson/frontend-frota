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
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCurrent(value * easeProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(value);
      }
    };

    setCurrent(0);
    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  const displayValue = formatter ? formatter(current) : current.toLocaleString('pt-BR');

  return (
    // Adicionamos 'max-w-full overflow-hidden text-ellipsis' 
    // Isso força o componente a nunca ser maior que o pai, cortando com ... se necessário.
    <span className={cn(
      "inline-block tabular-nums max-w-full overflow-hidden text-ellipsis whitespace-nowrap", 
      className
    )}>
      {displayValue}
    </span>
  );
}