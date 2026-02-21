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

// ⚠️ ATENÇÃO AQUI: Tem que ser "export function", sem o "default"
export function EmptyState({ 
  title, 
  description, 
  icon: Icon = Inbox, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-hover/30 rounded-3xl border-2 border-dashed border-border/60 transition-colors hover:border-primary/30", className)}>
      <div className="bg-surface p-5 rounded-full mb-5 shadow-sm">
        <Icon className="w-10 h-10 text-text-muted/50" />
      </div>
      <h3 className="text-lg font-black text-text-main uppercase tracking-widest">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary font-medium mt-2 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}