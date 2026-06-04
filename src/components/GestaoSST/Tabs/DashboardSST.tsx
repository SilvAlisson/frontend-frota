import { Target, ShieldCheck, CheckCircle2, Clock, XCircle, TrendingUp, Bell } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AcaoSST } from '../../../hooks/useSST';
import { KpiCard } from '../ui/KpiCard';
import { ProgressBar } from '../ui/ProgressBar';
import { PainelAlertas } from '../PainelAlertas';
import { PROGRAMA_CORES } from '../constants';

interface DashboardSSTProps {
  estatisticas: {
    total: number;
    realizadas: number;
    pendentes: number;
    atrasadas: number;
    progresso: number;
    porPrograma: {
      programa: 'PCA' | 'PPR' | 'AET' | 'PGR';
      total: number;
      realizadas: number;
      progresso: number;
    }[];
  };
  alertas: (AcaoSST & { diffDias: number })[];
}

export function DashboardSST({ estatisticas, alertas }: DashboardSSTProps) {
  return (
    <div id="sst-tab-dashboard" role="tabpanel" aria-label="Dashboard de Metas" className="space-y-6">
      <div className="bg-surface border border-border/60 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-black text-text-main flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" aria-hidden="true" />
          Objetivos e Metas 2026
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Fortalecer a cultura de SST na KLIN.',
            'Controlar os riscos ocupacionais da KLIN.',
          ].map((obj, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-4">
              <span className="text-primary font-black text-lg leading-none shrink-0">{i + 1}.</span>
              <p className="text-sm font-bold text-text-main">{obj}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de Ações"
          value={estatisticas.total}
          icon={ShieldCheck}
          colorClass="bg-primary/10 text-primary border-primary/20"
        />
        <KpiCard
          label="Realizadas"
          value={estatisticas.realizadas}
          icon={CheckCircle2}
          colorClass="bg-success/10 text-success border-success/20"
        />
        <KpiCard
          label="Pendentes"
          value={estatisticas.pendentes}
          icon={Clock}
          colorClass="bg-warning/10 text-warning border-warning/20"
        />
        <KpiCard
          label="Atrasadas"
          value={estatisticas.atrasadas}
          icon={XCircle}
          colorClass="bg-error/10 text-error border-error/20"
        />
      </div>

      <div className="bg-surface border border-border/60 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-text-main flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            Progresso Global do Plano de Ação
          </h3>
          <span className="text-2xl font-black text-primary">{estatisticas.progresso}%</span>
        </div>
        <ProgressBar value={estatisticas.progresso} />

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          {estatisticas.porPrograma.map(({ programa, total, realizadas, progresso }) => (
            <div key={programa} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={cn('text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border', PROGRAMA_CORES[programa])}>
                  {programa}
                </span>
                <span className="text-xs text-text-muted font-bold">{realizadas}/{total} · {progresso}%</span>
              </div>
              <ProgressBar value={progresso} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-black text-text-main flex items-center gap-2">
          <Bell className="w-4 h-4 text-error" aria-hidden="true" />
          Alertas de Vencimento
          {alertas.length > 0 && (
            <span className="text-xs font-black bg-error text-white px-2 py-0.5 rounded-full" aria-label={`${alertas.length} alertas ativos`}>
              {alertas.length}
            </span>
          )}
        </h3>
        <PainelAlertas alertas={alertas} />
      </div>
    </div>
  );
}
