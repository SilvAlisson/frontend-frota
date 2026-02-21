import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const calloutVariants = cva(
  "p-5 rounded-3xl border flex gap-4 shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        info: "bg-sky-500/10 border-sky-500/20 text-sky-700",
        warning: "bg-amber-500/5 border-amber-500/20 text-amber-700",
        success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
        danger: "bg-rose-500/10 border-rose-500/20 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
  title: string;
  icon?: React.ElementType;
}

export function Callout({ className, variant, title, icon: Icon, children, ...props }: CalloutProps) {
  // Define ícones padrão caso nenhum seja fornecido
  const DefaultIcon = 
    variant === 'danger' ? AlertCircle : 
    variant === 'warning' ? AlertTriangle : 
    variant === 'success' ? CheckCircle2 : Info;

  const RenderIcon = Icon || DefaultIcon;

  // Ajusta a cor do ícone com base na variante
  const iconColor = 
    variant === 'danger' ? 'text-rose-600' : 
    variant === 'warning' ? 'text-amber-600' : 
    variant === 'success' ? 'text-emerald-600' : 'text-sky-600';

  const iconBg = 
    variant === 'danger' ? 'bg-rose-500/20' : 
    variant === 'warning' ? 'bg-amber-500/20' : 
    variant === 'success' ? 'bg-emerald-500/20' : 'bg-sky-500/20';

  return (
    <div className={cn(calloutVariants({ variant }), className)} {...props}>
      <div className={cn("p-2 rounded-xl h-fit shrink-0", iconBg)}>
        <RenderIcon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div>
        <h5 className={cn("font-black text-[10px] uppercase tracking-[0.2em] mb-1.5", iconColor)}>
          {title}
        </h5>
        <div className="text-xs font-medium leading-relaxed opacity-90 text-text-main">
          {children}
        </div>
      </div>
    </div>
  );
}