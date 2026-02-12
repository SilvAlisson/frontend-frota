import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Função CN (ClassNames):
 * 1. Condicionalmente junta classes (clsx) -> ex: loading && 'opacity-50'
 * 2. Remove conflitos do Tailwind (tailwind-merge) -> ex: 'p-4 p-2' vira 'p-2'
 * * Isso é a base de todo Design System moderno.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatadores centralizados (Dry Principle)
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value);
};