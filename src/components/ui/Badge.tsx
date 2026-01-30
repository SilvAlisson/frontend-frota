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
        // Agora usamos as cores semânticas com opacidade OKLCH
        default: "bg-primary/15 text-primary border-primary/20",
        success: "bg-success/15 text-success-500 border-success/20", // success-500 é mais escuro para texto
        warning: "bg-warning/15 text-warning-700 border-warning/20",
        danger:  "bg-error/15 text-error border-error/20",
        info:    "bg-sky-500/15 text-sky-700 border-sky-500/20", // Sky não é semântico, mantemos fixo ou criamos var
        neutral: "bg-text-secondary/10 text-text-secondary border-text-secondary/20",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5",
                "text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                "rounded-md border shadow-sm backdrop-blur-sm", // Blur sutil para parecer vidro
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}