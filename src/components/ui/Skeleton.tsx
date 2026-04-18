import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonVariants = cva(
  "relative overflow-hidden bg-surface-hover/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
  {
    variants: {
      variant: {
        default: "rounded-md",
        card: "rounded-[2rem] border border-border/40 shadow-sm",
        circle: "rounded-full",
        text: "rounded h-4 w-3/4",
        title: "rounded-lg h-8 w-1/2",
        tableRow: "rounded-2xl h-16 w-full"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface SkeletonProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };


