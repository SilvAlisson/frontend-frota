import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, containerClassName, id, ...rest }, ref) => {

    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider select-none ml-1"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Ícone à Esquerda */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none [&>svg]:w-5 [&>svg]:h-5 transition-colors group-focus-within:text-primary">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // --- Base ---
              "w-full py-2.5 text-sm text-text-main bg-surface border rounded-lg transition-all duration-200",
              
              // --- Bordas e Cores ---
              "border-input placeholder:text-text-muted",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",

              // --- Foco (Anel de foco semântico) ---
              "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",

              // --- Desabilitado ---
              "disabled:bg-background disabled:text-text-muted disabled:cursor-not-allowed",

              // --- Padding Condicional ---
              icon ? "pl-10 pr-4" : "px-4",

              // --- Estados Normais vs Erro ---
              !error && "hover:border-primary/50",
              error && "border-error text-error focus:border-error focus:ring-error/20 pr-10 placeholder:text-error/50",

              className
            )}
            aria-invalid={!!error}
            {...rest}
          />
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <p className="mt-1.5 text-xs text-error font-medium flex items-center gap-1 animate-enter ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';