import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Utilitário para mesclar classes (padrão shadcn/ui)
// Permite que classes passadas via props sobrescrevam as padrões
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
  ({ variant = 'primary', isLoading = false, icon, children, className, disabled, ...rest }, ref) => {

    const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-200 rounded-button focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-button active:scale-95";

    const variants: Record<ButtonVariant, string> = {
      primary: "bg-primary text-surface hover:bg-primary-hover focus:ring-primary hover:-translate-y-0.5",
      secondary: "bg-surface text-text border border-gray-200 hover:bg-gray-50 focus:ring-gray-300 hover:border-gray-300",
      ghost: "bg-transparent text-primary hover:bg-primary-soft shadow-none hover:shadow-none",
      danger: "bg-error text-surface hover:bg-red-600 focus:ring-error hover:-translate-y-0.5",
      success: "bg-success text-surface hover:bg-green-600 focus:ring-success hover:-translate-y-0.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}

        {!isLoading && icon && <span className="flex items-center justify-center">{icon}</span>}

        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';