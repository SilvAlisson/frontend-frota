import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatDateDisplay } from './dateUtils';

export const getStatusInfo = (dataValidade?: string | null, categoria?: string) => {
  // 1. Licenças Permanentes (Sem validade e categorias específicas)
  if ((categoria === 'LICENCA_AMBIENTAL' || categoria === 'AST') && !dataValidade) {
    return {
      color: 'bg-success/10 text-success border-success/20',
      text: 'Vigente (Permanente)',
      icon: ShieldCheck
    };
  }

  // 2. Sem data definida (Generico)
  if (!dataValidade) return {
    color: 'bg-surface-hover text-text-muted border-border/60',
    text: 'Sem data',
    icon: null
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const validade = new Date(dataValidade);
  validade.setHours(23, 59, 59, 999);

  const diffTime = validade.getTime() - hoje.getTime();
  const diasParaVencer = Math.ceil(diffTime / (1000 * 3600 * 24));

  // 3. Vencido
  if (diasParaVencer < 0) return {
    color: 'bg-error/10 text-error border-error/20 animate-pulse',
    text: `Venceu a ${formatDateDisplay(dataValidade)}`,
    icon: AlertTriangle
  };

  // 4. Vence em breve (30 dias)
  if (diasParaVencer <= 30) return {
    color: 'bg-warning-500/10 text-warning-600 border-warning-500/20',
    text: `Vence em ${diasParaVencer} dias`,
    icon: AlertTriangle
  };

  // 5. Vigente
  return {
    color: 'bg-success/10 text-success border-success/20',
    text: `Vence a ${formatDateDisplay(dataValidade)}`,
    icon: ShieldCheck
  };
};

export const getStatusBadge = (status?: string) => {
  if (status === 'ARQUIVADO') {
    return { color: 'bg-surface-hover/50 text-text-secondary border-border/80 opacity-70', text: 'ARQUIVADO' };
  }
  return { color: 'bg-primary/10 text-primary border-primary/20', text: 'VIGENTE' };
};
