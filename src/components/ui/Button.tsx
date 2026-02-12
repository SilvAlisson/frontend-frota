import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils'; // Ajuste o caminho conforme sua estrutura

// Definindo todas as variações possíveis de estilo
const buttonVariants = cva(
  // Estilos Base (Sempre presentes)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: 
          "bg-primary text-primary-foreground shadow-button hover:bg-primary-hover hover:shadow-float hover:-translate-y-0.5 border border-transparent",
        secondary: 
          "bg-surface text-text-main border border-border shadow-sm hover:bg-surface-hover hover:text-primary hover:border-primary/30",
        ghost: 
          "bg-transparent text-text-secondary hover:bg-primary/10 hover:text-primary border border-transparent",
        danger: 
          "bg-error text-error-foreground shadow-button hover:bg-error/90 hover:shadow-lg hover:-translate-y-0.5 border border-transparent",
        success: 
          "bg-success text-success-foreground shadow-button hover:bg-success/90 hover:shadow-lg hover:-translate-y-0.5 border border-transparent",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
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
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };