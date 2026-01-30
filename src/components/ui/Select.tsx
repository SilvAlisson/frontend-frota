import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

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
    options?: SelectOption[];
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

        const generatedId = React.useId();
        const selectId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block mb-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider select-none ml-1"
                    >
                        {label}
                    </label>
                )}

                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none [&>svg]:w-5 [&>svg]:h-5 z-10 transition-colors group-focus-within:text-primary">
                            {icon}
                        </div>
                    )}

                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            // Base
                            "w-full py-2.5 text-sm text-text-main bg-surface border rounded-lg transition-all duration-200 appearance-none cursor-pointer",
                            
                            // Foco
                            "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
                            
                            // Desabilitado
                            "disabled:bg-background disabled:text-text-muted disabled:cursor-not-allowed",

                            // Padding
                            icon ? "pl-10 pr-10" : "pl-4 pr-10",

                            // Placeholder visual
                            "invalid:text-text-muted",

                            // Estados
                            !error && "border-input hover:border-primary/50",
                            error && "border-error text-error focus:border-error focus:ring-error/20",

                            className
                        )}
                        aria-invalid={!!error}
                        {...rest}
                    >
                        {placeholder && (
                            <option value="" disabled className="text-text-muted bg-background">
                                {placeholder}
                            </option>
                        )}

                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}

                        {children}
                    </select>

                    {/* Chevron Icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={cn("w-5 h-5 transition-transform duration-200", error && "text-error")}
                        >
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

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

Select.displayName = 'Select';