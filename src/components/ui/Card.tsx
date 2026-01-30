import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'glass';
    noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {

        const variants = {
            default: "bg-white border border-border shadow-card", // Usa var --shadow-card tinturada
            outline: "bg-transparent border border-border shadow-none",
            glass:   "glass", // Usa a classe utilitária do index.css
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl overflow-hidden transition-all duration-300",
                    "hover:shadow-float", // Sombra flutuante no hover para todos
                    variants[variant],
                    noPadding ? "p-0" : "p-5 sm:p-6",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = "Card";
export { Card };