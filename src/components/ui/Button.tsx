import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils'; 

const buttonVariants = cva(
  // --- Base Elite (Adicionado cursor-default) ---
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.97] select-none cursor-default",
  {
    variants: {
      variant: {
        primary: 
          "bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md",
        secondary: 
          "bg-surface-hover text-text-main border border-border/50 shadow-sm hover:bg-border/50",
        outline: 
          "border-[1.5px] border-border/60 bg-transparent text-text-main hover:bg-surface-hover hover:border-border",
        ghost: 
          "bg-transparent text-text-main hover:bg-surface-hover/50",
        danger: 
          "bg-error text-white shadow-sm hover:bg-error/90 hover:shadow-md",
        success: 
          "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:shadow-md",
        glass: 
          "bg-surface/50 backdrop-blur-md border border-border/50 text-text-main hover:bg-surface/80 shadow-sm",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // 🛡️ TRAVA DUPLO-CLIQUE: Fica disabled se estiver carregando
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Se estiver carregando, mostra o spinner. Se não, mostra o ícone (caso exista) */}
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };