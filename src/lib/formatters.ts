// Utilitários de formatação
/**
 * 🏭 FORMATTERS — Fábrica Central de Formatação (ISO pt-BR)
 * 
 * REGRA: Toda formatação de moeda, data, placa, KM, telefone e documento
 * deve passar OBRIGATORIAMENTE por este arquivo.
 * 
 * Proibido usar toLocaleString('pt-BR', ...) inline em componentes.
 */

// ══════════════════════════════════════════════════
// 1. MOEDA (BRL)
// ══════════════════════════════════════════════════

/** Formata número para moeda brasileira: 1500.5 → "R$ 1.500,50" */
export function formatBRL(value: number): string {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Formata input monetário (string) como o usuário digita */
export function formatarDinheiro(valor: string | number): string {
  if (valor === undefined || valor === null) return '';
  const num = typeof valor === 'string' ? valor.replace(/\D/g, '') : Number(valor).toFixed(2).replace(/\D/g, '');
  return (Number(num) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata string formatada (ex: "R$ 1.500,00") para numero: "R$ 1.500,00" → 1500 */
export function desformatarDinheiro(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return Number(cleaned) || 0;
}

/** Custo por KM: `R$ 2,50 / km` */
export function formatCustoKm(value: number): string {
  return `${formatBRL(value)} / km`;
}

// ══════════════════════════════════════════════════
// 2. NÚMEROS E QUILOMETRAGEM
// ══════════════════════════════════════════════════

/** Número com separadores pt-BR: `152430` → "152.430" */
export function formatNumero(value: number, decimals = 0): string {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Quilometragem: `152430` → "152.430 KM" */
export function formatKm(value: number): string {
  return `${formatNumero(value)} KM`;
}

/** Eficiência: `10.5` → "10,5 km/l" */
export function formatKml(value: number, decimals = 1): string {
  return `${(Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} km/l`;
}

// ══════════════════════════════════════════════════
// 3. DATAS
// ══════════════════════════════════════════════════

/** Data curta: "19/07/2025" */
export function formatarData(iso: string | Date): string {
  if (!iso) return '--/--/----';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Data + hora: "19/07/2025 14:00" */
export function formatarDataHora(iso: string | Date): string {
  if (!iso) return '--/--/----';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ══════════════════════════════════════════════════
// 4. PLACAS
// ══════════════════════════════════════════════════

/** Formata placa Mercosul ou antiga: `ABC1D23` / `ABC-1234` */
export function formatarPlaca(value: string): string {
  if (!value) return '';
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length <= 3) return clean;

  const letras = clean.substring(0, 3);
  const resto = clean.substring(3, 7);
  const isMercosul = resto.length > 1 && isNaN(Number(resto[1]));

  return isMercosul ? `${letras}${resto}` : `${letras}-${resto}`;
}

// ══════════════════════════════════════════════════
// 5. DOCUMENTOS E TELEFONE
// ══════════════════════════════════════════════════

/** Formata CPF (11 dígitos) → "123.456.789-00" ou CNPJ (14 dígitos) → "12.345.678/0001-90" */
export function formatCpfCnpj(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return value;
}

/** Formata telefone BR: (11) 91234-5678 ou (11) 1234-5678 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (clean.length === 10) return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return value;
}

// ══════════════════════════════════════════════════
// 6. UTILITÁRIOS DE NÚMEROS
// ══════════════════════════════════════════════════

/** Arredonda para 2 casas decimais: `3.14159` → 3.14 */
export function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}