import { CheckCircle2, Bell, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AcaoSST } from '../../hooks/useSST';

interface PainelAlertasProps {
  alertas: (AcaoSST & { diffDias: number })[];
}

export function PainelAlertas({ alertas }: PainelAlertasProps) {
  if (alertas.length === 0) {
    return (
      <div
        className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-2xl p-4"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
        <p className="text-sm font-bold text-success">Nenhuma ação com vencimento nos próximos 15 dias. 🎉</p>
      </div>
    );
  }

  return (
    <section
      className="bg-surface border border-error/30 rounded-2xl overflow-hidden shadow-sm"
      aria-label="Painel de alertas de vencimento"
    >
      <div className="flex items-center gap-3 bg-error/10 px-5 py-4 border-b border-error/20">
        <Bell className="w-5 h-5 text-error shrink-0 animate-pulse" aria-hidden="true" />
        <h2 className="font-black text-error text-sm uppercase tracking-wider">
          Painel de Alertas — {alertas.length} {alertas.length === 1 ? 'ação crítica' : 'ações críticas'}
        </h2>
      </div>

      <ul className="divide-y divide-border/40" role="list">
        {alertas.map((alerta) => {
          const isVencida = alerta.diffDias < 0;
          return (
            <li
              key={alerta.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-surface-hover/30 transition-colors"
              aria-label={`${alerta.acao} — ${isVencida ? `vencida há ${Math.abs(alerta.diffDias)} dias` : `vence em ${alerta.diffDias} dias`}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle
                  className={cn('w-4 h-4 mt-0.5 shrink-0', isVencida ? 'text-error' : 'text-warning')}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-main truncate">{alerta.acao}</p>
                  <p className="text-xs text-text-muted mt-0.5">{alerta.responsaveis} · {alerta.programa}</p>
                </div>
              </div>
              <div className="shrink-0 pl-7 sm:pl-0">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border',
                    isVencida
                      ? 'bg-error/10 text-error border-error/20'
                      : 'bg-warning/10 text-warning border-warning/20'
                  )}
                  role="status"
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {isVencida
                    ? `Venceu há ${Math.abs(alerta.diffDias)}d`
                    : `Vence em ${alerta.diffDias}d`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
