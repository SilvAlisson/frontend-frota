import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  hasNotification?: boolean; // Para a bolinha vermelha de alerta
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'segmented' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'segmented' }: TabsProps) {
  
  if (variant === 'underline') {
    return (
      <div className={cn("flex gap-6 sm:gap-10 min-w-max border-b border-border/40 overflow-x-auto custom-scrollbar", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "shrink-0 pb-3 px-1 sm:px-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 outline-none select-none relative group cursor-default",
                isActive ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main"
              )}
            >
              {Icon && <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />}
              {tab.label}
              {tab.hasNotification && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variante Padrão: Segmented Control (Apple Style)
  return (
    <div className={cn("bg-surface-hover/50 p-1.5 rounded-2xl border border-border/60 inline-flex overflow-x-auto custom-scrollbar shadow-inner w-full sm:w-auto", className)}>
      <div className="flex space-x-1 min-w-max w-full sm:w-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out flex-1 sm:flex-none outline-none select-none cursor-default",
                isActive 
                  ? "text-primary bg-surface shadow-sm ring-1 ring-border/60" 
                  : "text-text-secondary hover:bg-surface/50 hover:text-text-main"
              )}
            >
              {Icon && <Icon className={cn("w-4 h-4 transition-transform duration-300", isActive ? "scale-110 text-primary" : "text-text-muted")} />}
              {tab.label}
              {tab.hasNotification && (
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-error rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}