import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Loader2 } from 'lucide-react';

// Utilitário local
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    isLoading = false,
    icon,
    children,
    className,
    disabled,
    ...rest
  }, ref) => {

    const baseStyles = cn(
      // Layout e Espaçamento
      "inline-flex items-center justify-center gap-2",
      // py-2.5 para alinhar perfeitamente com a altura do Input e Select
      "px-5 py-2.5",

      // Tipografia e Borda
      "text-sm font-bold tracking-wide",
      "rounded-lg", // Padronizado com Input/Select (era rounded-button)

      // Transições e Interação
      "transition-all duration-200 ease-in-out",
      "active:scale-[0.98]", // Efeito de clique sutil (micro-interação)

      // Foco Acessível
      "focus:outline-none focus:ring-2 focus:ring-offset-2",

      // Estado Desabilitado
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none"
    );

    const variants: Record<ButtonVariant, string> = {
      primary: cn(
        "bg-primary text-primary-foreground", // Usa variáveis semânticas do index.css
        "hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg", // Efeito de "elevação" no hover
        "focus:ring-primary shadow-button border border-transparent"
      ),
      secondary: cn(
        "bg-white text-text-main border border-gray-200",
        "hover:bg-gray-50 hover:border-gray-300 hover:text-primary",
        "focus:ring-gray-200 shadow-sm"
      ),
      ghost: cn(
        "bg-transparent text-text-secondary",
        "hover:bg-primary-soft hover:text-primary",
        "focus:ring-primary/20 shadow-none"
      ),
      danger: cn(
        "bg-error text-error-foreground",
        "hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg",
        "focus:ring-error shadow-md border border-transparent"
      ),
      success: cn(
        "bg-success text-success-foreground",
        "hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg",
        "focus:ring-success shadow-md border border-transparent"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {!isLoading && icon && (
          <span className="flex items-center justify-center -ml-1">
            {icon}
          </span>
        )}

        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';