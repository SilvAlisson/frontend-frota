import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatadores centralizados (Dry Principle)
export const formatCurrency = (value: number | string) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value);
};