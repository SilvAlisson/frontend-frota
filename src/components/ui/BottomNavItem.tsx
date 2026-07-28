import React from 'react';
import { Button } from './Button';
import { useHaptics } from '../../hooks/useHaptics';
import { cn } from '../../lib/utils';

export interface BottomNavItemProps {
 icon: React.ElementType;
 label: string;
 onClick: () => void;
 accent?: 'yellow' | 'red' | 'sky' | 'purple';
 badge?: boolean;
}

export function BottomNavItem({ icon: Icon, label, onClick, accent = 'yellow', badge = false }: BottomNavItemProps) {
 const { vibrateLight } = useHaptics();
 const accentMap = {
  yellow: 'text-warning-600 dark:text-warning bg-warning/10 group-active:bg-warning/20',
  red: 'text-error bg-error/10 group-active:bg-error/20',
  sky: 'text-info bg-info/10 group-active:bg-info/20',
  purple: 'text-primary bg-primary/10 group-active:bg-primary/20',
 };

 const handleClick = () => {
  vibrateLight();
  onClick();
 };

 return (
  <Button
   variant="ghost"
   onClick={handleClick}
   className="group relative flex flex-col items-center justify-center gap-1 flex-1 h-full touch-target transition-all active:scale-95 hover:bg-transparent !p-0 focus-ring rounded-xl"
   aria-label={label}
  >
   <div className={cn(
    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border border-transparent",
    accentMap[accent]
   )}>
    <Icon className="w-5 h-5" />
   </div>
   <span className="text-[9px] font-black uppercase tracking-widest text-text-muted leading-none">{label}</span>

    {badge && (
     <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-error animate-pulse border-2 border-background" />
    )}
  </Button>
 );
}
