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
        // Agora usamos as cores base hiper brilhantes "LED-like" em vez dos tons escuros "-700" que não aparecem no Dark Mode.
        default: "bg-primary/15 text-primary border-primary/20",
        success: "bg-success/15 text-success border-success/30 hover:bg-success/20 hover:border-success/40 transition-colors", 
        warning: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20 hover:border-warning/40 transition-colors",
        danger:  "bg-error/15 text-error border-error/30 hover:bg-error/20 hover:border-error/40 transition-colors",
        info:    "bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/20 transition-colors", 
        neutral: "bg-surface-hover/80 text-text-secondary border-border/60 hover:text-text-main transition-colors",
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


