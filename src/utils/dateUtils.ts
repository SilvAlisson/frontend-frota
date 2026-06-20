

// Formata data para exibição visual no padrão brasileiro (DD/MM/AAAA)
// Usa UTC para evitar que 2024-01-01 vire 31/12/2023 devido ao fuso -3h
export const formatDateDisplay = (date: string | Date | null | undefined): string => {
    if (!date) return '-';

    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


