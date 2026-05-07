import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  nome?: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Avatar({ nome = 'Usuário', url, size = 'md', className, ...props }: AvatarProps) {
  const initials = nome
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    'sm': 'w-8 h-8 text-[10px]',
    'md': 'w-10 h-10 text-xs',
    'lg': 'w-14 h-14 text-sm',
    'xl': 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const dims = sizeClasses[size] || sizeClasses.md;

  if (url) {
    return (
      <img 
        src={url} 
        alt={nome} 
        className={cn(
          dims, 
          'rounded-full object-cover border border-border/60 shadow-sm shrink-0',
          className
        )} 
        {...(props as any)}
      />
    );
  }

  return (
    <div 
      className={cn(
        dims, 
        'rounded-full bg-gradient-to-br from-surface-hover to-border/40 text-text-main flex items-center justify-center font-black border border-border/60 shadow-inner shrink-0',
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
}
