import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarActionButtonProps {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  badge?: number | string | null;
  variant?: 'default' | 'danger' | 'warning' | 'subtle';
}

export function SidebarActionButton({ icon: Icon, title, onClick, badge, variant = 'default' }: SidebarActionButtonProps) {
  const isDanger = variant === 'danger';
  const isSubtle = variant === 'subtle';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full group flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 border hover:-translate-y-0.5 shadow-sm hover:shadow-md",
        isDanger ? "bg-error/5 hover:bg-error/10 border-error/20 hover:border-error/40" 
        : isSubtle ? "bg-surface/30 hover:bg-surface border-transparent hover:border-border/30 opacity-70 hover:opacity-100" 
        : "bg-surface hover:bg-surface-hover/80 border-border/40 hover:border-primary/30"
      )} aria-label="Navegar"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border shadow-inner",
          isDanger ? "bg-error/10 text-error border-error/20" 
          : "bg-primary/5 text-primary border-primary/10 group-hover:bg-primary/10"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "font-black tracking-tight text-sm",
          isDanger ? "text-error" : "text-text-main"
        )}>{title}</span>
      </div>
      
      {badge ? (
        <span className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse border",
          isDanger ? "bg-error/20 text-error border-error/30" : "bg-primary/20 text-primary border-primary/30"
        )}>
           {badge}
        </span>
      ) : (
        <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all", isDanger ? "text-error" : "text-primary")} />
      )}
    </button>
  );
}
