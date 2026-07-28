import React, { useEffect, useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface SmartFABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
  label?: string;
  icon?: React.ElementType;
}

export function SmartFAB({ onClick, label = "Novo", icon: Icon = Plus, className, ...rest }: SmartFABProps) {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Se rolou para baixo mais de 10px, esconde
      if (currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      } 
      // Se rolou para cima mais de 10px, mostra
      else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  if (!isMobile) return null; // No desktop, usamos o botão normal do PageHeader

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed right-6 bottom-24 z-[90] flex items-center justify-center gap-2 rounded-2xl shadow-xl shadow-primary/30 bg-primary text-primary-foreground font-bold px-4 h-14 transition-all duration-300 active:scale-95 active:shadow-md",
        !isVisible && "translate-y-24 opacity-0 pointer-events-none",
        className
      )}
      aria-label={label}
      {...rest}
    >
      <Icon className="w-6 h-6" />
      <span>{label}</span>
    </button>
  );
}
