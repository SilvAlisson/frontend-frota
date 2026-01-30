import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Loader2 } from 'lucide-react';

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
      "inline-flex items-center justify-center gap-2",
      "px-5 py-2.5",
      "text-sm font-bold tracking-wide",
      "rounded-lg",
      "transition-all duration-200 ease-out", // 'ease-out' é mais natural
      "active:scale-[0.98]", 
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
    );

    const variants: Record<ButtonVariant, string> = {
      primary: cn(
        "bg-primary text-primary-foreground",
        "hover:bg-primary-hover hover:-translate-y-0.5", 
        "shadow-button hover:shadow-float border border-transparent"
      ),
      secondary: cn(
        "bg-surface text-text-main border border-border",
        "hover:bg-surface-hover hover:border-primary/30 hover:text-primary",
        "shadow-sm hover:shadow-md"
      ),
      ghost: cn(
        "bg-transparent text-text-secondary",
        "hover:bg-primary/10 hover:text-primary", // Usando opacidade nativa
        "shadow-none border border-transparent"
      ),
      danger: cn(
        "bg-error text-error-foreground",
        "hover:bg-error/90 hover:-translate-y-0.5",
        "shadow-button hover:shadow-lg border border-transparent"
      ),
      success: cn(
        "bg-success text-success-foreground",
        "hover:bg-success/90 hover:-translate-y-0.5",
        "shadow-button hover:shadow-lg border border-transparent"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && icon && <span className="-ml-1">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';