import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { AlertCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//  Sistema de Variantes
const inputVariants = cva(
  "flex w-full text-sm transition-all duration-200 outline-none placeholder:text-text-muted/60 disabled:cursor-not-allowed disabled:opacity-60 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",
  {
    variants: {
      variant: {
        default: "bg-surface border border-border/60 rounded-xl py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm hover:border-border disabled:bg-surface-hover/50 disabled:border-border/40 text-text-main",
        ghost: "bg-transparent border-transparent rounded-xl h-11 hover:bg-surface-hover/80 focus:bg-surface-hover shadow-none focus:ring-0 text-text-main",
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

// Adicionamos o VariantProps à Interface
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, containerClassName, id, variant, ...rest }, ref) => {

    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("w-full flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none ml-1"
          >
            {label}
          </label>
        )}

        <div className="relative group w-full">
          {/* Ícone à Esquerda */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10 [&>svg]:w-5 [&>svg]:h-5 transition-colors group-focus-within:text-primary">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Aplica a variante (default ou ghost)
              inputVariants({ variant }),
              
              // Padding da esquerda (abre espaço para o ícone, se houver)
              icon ? "pl-10" : (variant === 'ghost' ? "pl-3" : "pl-4"),
              
              error 
                ? "pr-12 text-ellipsis border-error border text-error focus:border-error focus:ring-error/20 placeholder:text-error/50" 
                : (variant === 'default' ? "pr-4" : "pr-3"),

              className
            )}
            aria-invalid={!!error}
            {...rest}
          />

          {/* Ícone de Erro embutido no Input (Estilo Material/Apple) */}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none animate-in zoom-in-95 duration-200">
               <AlertCircle className="w-5 h-5 opacity-80" />
            </div>
          )}
        </div>

        {/* Mensagem de Erro Textual */}
        {error && (
          <p className="text-xs text-error font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ml-1 mt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';