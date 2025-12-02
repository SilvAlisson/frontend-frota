import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...rest }, ref) => {

    // Estilos base do input
    const baseStyles = `
      w-full px-4 py-2 text-text bg-white border 
      rounded-input transition-all duration-200
      placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    `;

    // Estilos condicionais (Erro vs Normal)
    const stateStyles = error
      ? "border-error focus:border-error focus:ring-error/20 text-error"
      : "border-gray-300 hover:border-primary focus:border-primary focus:ring-primary/20";

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            className="block mb-1.5 text-sm font-medium text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis"
            title={label}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={`${baseStyles} ${stateStyles} ${className}`}
          {...rest}
        />

        {/* Mensagem de erro */}
        {error && (
          <p className="mt-1 text-xs text-error animate-pulse">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';