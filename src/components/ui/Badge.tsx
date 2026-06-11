import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap rounded-md border shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border-primary/30",
        success: "bg-success/20 text-success border-success/40 hover:bg-success/30 hover:border-success/50 transition-colors", 
        warning: "bg-warning/20 text-warning border-warning/40 hover:bg-warning/30 hover:border-warning/50 transition-colors",
        danger:  "bg-error/20 text-error border-error/40 hover:bg-error/30 hover:border-error/50 transition-colors",
        info:    "bg-info/20 text-info border-info/40 hover:bg-info/30 hover:border-info/50 transition-colors", 
        neutral: "bg-surface-hover/90 text-text-secondary border-border hover:text-text-main transition-colors",
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


