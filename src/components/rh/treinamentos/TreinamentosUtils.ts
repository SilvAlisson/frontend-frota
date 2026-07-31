import { CheckCircle2, AlertTriangle, type LucideIcon } from 'lucide-react';

export interface StatusConfig {
    indicatorBg: string;
    badgeBg: string;
    textColor: string;
    border: string;
    Icon: LucideIcon;
    label: string;
}

export function getStatusConfig(vencimento: string | null | undefined): StatusConfig {
    if (!vencimento) {
        return {
            indicatorBg: 'bg-primary/60',
            badgeBg: 'bg-primary/10',
            textColor: 'text-primary',
            border: 'border-primary/20',
            Icon: CheckCircle2,
            label: 'Vitalício / Concluído',
        };
    }

    const [year, month, day] = vencimento.split('T')[0].split('-').map(Number);
    const vencUTC = Date.UTC(year, month - 1, day);
    const now = new Date();
    const hojeUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDias = Math.ceil((vencUTC - hojeUTC) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
        return {
            indicatorBg: 'bg-error',
            badgeBg: 'bg-error/10',
            textColor: 'text-error',
            border: 'border-error/20',
            Icon: AlertTriangle,
            label: 'Vencido',
        };
    }
    if (diffDias < 30) {
        return {
            indicatorBg: 'bg-orange-500',
            badgeBg: 'bg-orange-500/10',
            textColor: 'text-orange-600',
            border: 'border-orange-500/20',
            Icon: AlertTriangle,
            label: 'Expira Brevemente',
        };
    }
    return {
        indicatorBg: 'bg-success',
        badgeBg: 'bg-success/10',
        textColor: 'text-success',
        border: 'border-success/20',
        Icon: CheckCircle2,
        label: 'Válido',
    };
}

export function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
