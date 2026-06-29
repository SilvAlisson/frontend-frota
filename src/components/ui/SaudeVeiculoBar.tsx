import { cn } from '../../lib/utils';
import { Activity } from 'lucide-react';

interface SaudeVeiculoBarProps {
  score: number;
  className?: string;
}

export function SaudeVeiculoBar({ score, className }: SaudeVeiculoBarProps) {
  // Define cor e label baseado no score
  let colorClass = 'bg-success';
  let bgSoftClass = 'bg-success-soft';
  let label = 'Excelente';

  if (score < 50) {
    colorClass = 'bg-error';
    bgSoftClass = 'bg-error-soft';
    label = 'Crítico';
  } else if (score < 80) {
    colorClass = 'bg-warning';
    bgSoftClass = 'bg-warning-soft';
    label = 'Atenção';
  }

  if (score === 0) {
    label = 'Inoperante';
  }

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
        <span className="text-text-muted flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Saúde
        </span>
        <span className={cn(
          "px-1.5 rounded-sm",
          score < 50 ? "text-error" : score < 80 ? "text-warning" : "text-success"
        )}>
          {score}% - {label}
        </span>
      </div>
      <div className={cn("h-1.5 w-full rounded-full overflow-hidden", bgSoftClass)}>
        <div 
          className={cn("h-full transition-all duration-1000 ease-out rounded-full", colorClass)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
