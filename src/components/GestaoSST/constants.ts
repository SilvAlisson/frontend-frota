import type { ProgramaSST, StatusSST } from '../../hooks/useSST';

export const PROGRAMAS: { value: ProgramaSST | ''; label: string }[] = [
  { value: '',  label: 'Todos os Programas' },
  { value: 'PCA', label: 'PCA — Proteção Auditiva' },
  { value: 'PPR', label: 'PPR — Proteção Respiratória' },
  { value: 'AET', label: 'AET — Ergonomia' },
  { value: 'PGR', label: 'PGR — Gerenciamento de Riscos' },
];

export const STATUS_CONFIG: Record<StatusSST, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  REALIZADO: { label: 'Realizado', variant: 'success' },
  ATRASADO: { label: 'Atrasado', variant: 'danger' },
  PENDENTE: { label: 'Pendente', variant: 'warning' },
};

export const PROGRAMA_CORES: Record<ProgramaSST, string> = {
  PCA: 'text-info bg-info/10 border-info/20',
  PPR: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
  AET: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  PGR: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};
