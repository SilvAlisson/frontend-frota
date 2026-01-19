import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Utilitário local (mesmo do Input.tsx)
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    options?: SelectOption[]; // Opções passadas via array (opcional)
    placeholder?: string;
    containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({
        label,
        error,
        icon,
        options = [],
        placeholder,
        className,
        containerClassName,
        id,
        children,
        ...rest
    }, ref) => {

        // Gera ID único para acessibilidade e UX (clicar no label foca o input)
        const generatedId = React.useId();
        const selectId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {/* Label Acessível (Mesmo padrão do Input.tsx) */}
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none ml-1"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {/* Ícone à Esquerda (Opcional) */}
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none [&>svg]:w-5 [&>svg]:h-5 z-10">
                            {icon}
                        </div>
                    )}

                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            // --- Estilos Base (Idênticos ao Input.tsx) ---
                            // py-2.5 garante a mesma altura do Input
                            "w-full py-2.5 text-sm text-gray-900 bg-white border rounded-lg transition-all duration-200 appearance-none cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",

                            // --- Padding ---
                            // Esquerda: se tiver ícone, aumenta. 
                            // Direita: sempre tem espaço extra (pr-10) para a seta customizada não ficar em cima do texto
                            icon ? "pl-10 pr-10" : "pl-4 pr-10",

                            // --- Placeholder Style ---
                            // Se o valor for "vazio", deixa o texto cinza para parecer placeholder
                            "invalid:text-gray-400",

                            // --- Estado Normal ---
                            !error && "border-gray-200 hover:border-gray-300",

                            // --- Estado de Erro ---
                            error && "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100",

                            className
                        )}
                        aria-invalid={!!error}
                        {...rest}
                    >
                        {/* Renderiza o placeholder como primeira opção oculta/desabilitada */}
                        {placeholder && (
                            <option value="" disabled className="text-gray-400 bg-gray-50">
                                {placeholder}
                            </option>
                        )}

                        {/* Renderiza opções via prop 'options' */}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}

                        {/* Permite passar <option> como children também (flexibilidade) */}
                        {children}
                    </select>

                    {/* Ícone Chevron (Seta) Customizado à Direita */}
                    {/* pointer-events-none é CRUCIAL para o clique passar para o select nativo abaixo */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={cn("w-5 h-5 transition-transform duration-200", error && "text-red-400")}
                        >
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Mensagem de Erro (Mesma animação do Input.tsx) */}
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

Select.displayName = 'Select';