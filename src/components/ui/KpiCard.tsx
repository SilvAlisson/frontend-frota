import React from 'react';
import { Card } from './Card';
import { NumberTicker } from './NumberTicker';
import { Skeleton } from './Skeleton';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface KpiCardProps {
  titulo: string;
  valorRaw?: number;
  formatter: (val: number) => string;
  descricao: string;
  onClick?: () => void;
  loading?: boolean;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export const KpiCard = React.memo(function KpiCard({ titulo, valorRaw, formatter, descricao, onClick, loading, highlight, variant = 'default', icon }: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn("flex flex-col justify-between overflow-hidden border-border/40 glass rounded-2xl", highlight ? "min-h-[160px]" : "min-h-[140px]")}>
        <div className="flex justify-between items-start w-full p-4 relative z-10">
          <Skeleton variant="text" className="w-24 mt-2" />
          <Skeleton variant="default" className="h-10 w-10 rounded-xl" />
        </div>
        <div className="space-y-3 mt-auto p-4 relative z-10">
          <Skeleton variant="title" className="w-3/4 h-8" />
          <Skeleton variant="text" className="w-full h-3" />
        </div>
      </Card>
    );
  }

  const styles = {
    default: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconText: 'text-primary', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(var(--color-primary),0.3)]' },
    success: { border: 'border-l-success', iconBg: 'bg-success/10', iconText: 'text-success', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(var(--color-success),0.3)]' },
    warning: { border: 'border-l-warning', iconBg: 'bg-warning/10', iconText: 'text-warning', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(var(--color-warning),0.3)]' },
    danger: { border: 'border-l-error', iconBg: 'bg-error/10', iconText: 'text-error', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(var(--color-error),0.3)]' },
    info: { border: 'border-l-info', iconBg: 'bg-info/10', iconText: 'text-info', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.3)]' }
  };

  const style = styles[variant] || styles.default;

  return (
    <Card
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "relative flex flex-col justify-between h-full cursor-pointer overflow-hidden group glass hover-lift rounded-2xl",
        "border-l-[4px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background", 
        style.border, style.glow,
        highlight ? "min-h-[160px]" : "min-h-[140px]"
      )}
    >
      <div className="flex justify-between items-start shrink-0 mb-1 relative z-10 p-3 sm:p-4 pb-0 min-w-0">
        <h4 className="font-header text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mt-1.5 leading-snug truncate">
          {titulo}
        </h4>
        {icon && (
          <div className={cn("p-2 sm:p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm shrink-0 ml-2", style.iconBg, style.iconText)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end flex-1 min-h-0 relative z-10 p-3 sm:p-4 min-w-0">
        <span
          className={cn(
            "block w-full text-left font-black text-text-main leading-none truncate transition-colors duration-300 tracking-tighter max-w-full",
            highlight 
              ? "text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl" 
              : "text-lg sm:text-xl lg:text-lg xl:text-xl 2xl:text-2xl"
          )}
          title={formatter(valorRaw || 0)}
        >
          <NumberTicker 
             value={valorRaw || 0} 
             formatter={formatter} 
             duration={1.5} 
             className="max-w-full truncate" 
          />
        </span>

        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border/40 flex items-center justify-between shrink-0 min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase text-text-muted truncate max-w-[90%] group-hover:text-text-main transition-colors tracking-wider">
            {descricao}
          </p>
          {onClick && (
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-text-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          )}
        </div>
      </div>

      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-current opacity-[0.02] rounded-full blur-2xl group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
    </Card>
  );
});
