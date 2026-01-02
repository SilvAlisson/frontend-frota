import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Utilitário para mesclar classes com segurança
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode; // [ADICIONADO] Propriedade icon opcional
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, containerClassName, id, ...rest }, ref) => {

    // Gera um ID único para acessibilidade se não for fornecido
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("w-full", containerClassName)}>
        {/* Label Acessível */}
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none ml-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* [ADICIONADO] Renderização do Ícone */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // --- Estilos Base ---
              "w-full py-2.5 text-sm text-gray-900 bg-white border rounded-lg transition-all duration-200",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",

              // --- Ajuste de Padding se tiver ícone ---
              icon ? "pl-10 pr-4" : "px-4",

              // --- Estado Normal ---
              !error && "border-gray-200 hover:border-gray-300",

              // --- Estado de Erro ---
              error && "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100 pr-10",

              // --- Classes Injetadas (Sobrescrita) ---
              className
            )}
            aria-invalid={!!error}
            {...rest}
          />
        </div>

        {/* Mensagem de Erro com Animação e Ícone */}
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