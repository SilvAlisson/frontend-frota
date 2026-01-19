export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Formata data para o valor do input HTML (YYYY-MM-DD)
export const formatDateToInput = (date: Date | null | undefined): string | null => {
    if (!date) return null;
    const d = new Date(date);
    // Garante UTC para evitar problemas de fuso horário ao editar
    const dataCorrigida = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return dataCorrigida.toISOString().split('T')[0] as string;
};

// Formata data para exibição visual no padrão brasileiro (DD/MM/AAAA)
// Usa UTC para evitar que 2024-01-01 vire 31/12/2023 devido ao fuso -3h
export const formatDateDisplay = (date: string | Date | null | undefined): string => {
    if (!date) return '-';

    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};