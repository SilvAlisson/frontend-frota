import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'glass';
    noPadding?: boolean; // ✅ Propriedade essencial para tabelas "Edge-to-Edge"
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {

        const variants = {
            default: "bg-white border border-gray-200 shadow-sm",
            outline: "bg-transparent border border-gray-200 shadow-none",
            glass: "bg-white/90 backdrop-blur-md border border-white/20 shadow-lg",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    // Geometria Klin
                    "rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-card",
                    // Estilo Visual
                    variants[variant],
                    // Padding Condicional
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