import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  "rounded-2xl overflow-hidden transition-all duration-300 ease-out border",
  {
    variants: {
      variant: {
        default: "bg-surface border-border shadow-card", // Sombra suave padrão
        outline: "bg-transparent border-border shadow-none",
        glass: "glass-premium",
        solid: "bg-surface-hover/50 dark:bg-gray-900 border-transparent", // Para fundos mais densos
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-4 sm:p-6",
        lg: "p-6 sm:p-8",
      },
      isInteractive: {
        true: "cursor-pointer hover:shadow-lg hover:border-primary/50 active:scale-[0.99] transition-all",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      isInteractive: false,
    },
  }
);

interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof cardVariants>, 'isInteractive'> {
  interactive?: boolean; // Prop manual para forçar comportamento
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, onClick, children, ...props }, ref) => {
    
    // Auto-detecção: Se tem onClick, é interativo por padrão
    const isClickable = interactive || !!onClick;

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(cardVariants({ variant, padding, isInteractive: isClickable, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export { Card, cardVariants };


