import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon = Inbox, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-24 px-6 text-center glass rounded-3xl border-2 border-dashed border-border/40 transition-all hover:border-primary/30 hover:shadow-sm animate-in fade-in zoom-in-95 duration-500", 
      className
    )}>
      <div className="bg-gradient-to-br from-surface to-surface-hover p-6 rounded-full mb-6 shadow-sm border border-border/50 relative group">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
        <Icon className="w-12 h-12 text-primary/60 relative z-10" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-black text-text-main uppercase tracking-[0.1em]">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted font-medium mt-3 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-8 animate-in slide-in-from-bottom-2 fade-in duration-700 delay-150 fill-mode-both">
          {action}
        </div>
      )}
    </div>
  );
}


