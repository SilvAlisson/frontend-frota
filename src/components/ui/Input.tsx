import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Utilitário local (pode ser movido para src/utils.ts no futuro)
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
        {/* Label com tipografia Klin (Inter/JetBrains) */}
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none ml-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Ícone à Esquerda */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // --- Geometria (Idêntica ao Select.tsx e Button.tsx) ---
              "w-full py-2.5 text-sm text-gray-900 bg-white border rounded-lg transition-all duration-200",

              // --- Tipografia e Placeholder ---
              "placeholder:text-gray-400",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",

              // --- Estados Interativos (Foco com cor da marca) ---
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",

              // --- Estado Desabilitado ---
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",

              // --- Padding Condicional (Se tem ícone) ---
              icon ? "pl-10 pr-4" : "px-4",

              // --- Cores de Borda (Normal vs Erro) ---
              !error && "border-gray-200 hover:border-gray-300",
              error && "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100 pr-10",

              className
            )}
            aria-invalid={!!error}
            {...rest}
          />
        </div>

        {/* Mensagem de Erro Animada */}
        {error && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1 animate-in slide-in-from-top-1 fade-in duration-200 ml-1">
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