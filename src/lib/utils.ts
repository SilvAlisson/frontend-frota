// 1. Correção do import (clsx FORA das chaves)
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Função CN (ClassNames) com BLINDAGEM:
 * Se o build minificar errado e perder a referência do clsx/twMerge,
 * ele usa o fallback nativo do JS e a tela NÃO QUEBRA.
 */
export function cn(...inputs: ClassValue[]) {
  try {
    // Validação de segurança: as bibliotecas foram carregadas corretamente?
    if (typeof clsx !== 'function' || typeof twMerge !== 'function') {
      // Fallback Nativo
      return inputs.filter(Boolean).map(String).join(' ');
    }
    
    // Caminho feliz
    return twMerge(clsx(inputs));
  } catch (error) {
    // Se der qualquer erro bizarro na execução, fallback nativo
    return inputs.filter(Boolean).map(String).join(' ');
  }
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