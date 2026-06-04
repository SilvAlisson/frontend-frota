import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap rounded-md border shadow-sm backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border-primary/20",
        success: "bg-success/15 text-success border-success/30 hover:bg-success/20 hover:border-success/40 transition-colors", 
        warning: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20 hover:border-warning/40 transition-colors",
        danger:  "bg-error/15 text-error border-error/30 hover:bg-error/20 hover:border-error/40 transition-colors",
        info:    "bg-info/15 text-info border-info/30 hover:bg-info/20 hover:border-info/40 transition-colors", 
        neutral: "bg-surface-hover/80 text-text-secondary border-border/60 hover:text-text-main transition-colors",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLSpanElement>, 
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant, className }))}
            {...props}
        >
            {children}
        </span>
    );
}


