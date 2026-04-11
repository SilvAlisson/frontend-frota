import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonVariants = cva(
  "animate-pulse bg-surface-hover/80",
  {
    variants: {
      variant: {
        default: "rounded-md",
        card: "rounded-3xl",
        circle: "rounded-full",
        text: "rounded h-4 w-3/4",
        title: "rounded-lg h-8 w-1/2",
        tableRow: "rounded-xl h-14 w-full"
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


