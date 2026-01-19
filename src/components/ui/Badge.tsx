import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {

    const variants: Record<BadgeVariant, string> = {
        default: "bg-primary/10 text-primary border-primary/20",     // Azul Marca
        success: "bg-emerald-50 text-emerald-700 border-emerald-200", // Verde Sucesso (Mais legível que success/10)
        warning: "bg-amber-50 text-amber-700 border-amber-200",       // Laranja Alerta
        danger: "bg-red-50 text-red-700 border-red-200",             // Vermelho Erro
        info: "bg-sky-50 text-sky-700 border-sky-200",             // Azul Informação
        neutral: "bg-slate-100 text-slate-600 border-slate-200",      // Cinza Neutro
    };

    return (
        <span
            className={cn(
                // Base Layout
                "inline-flex items-center justify-center px-2.5 py-0.5",
                // Tipografia
                "text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                // Borda e Arredondamento
                "rounded-md border",
                // Variante de Cor
                variants[variant],
                // Customização
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}