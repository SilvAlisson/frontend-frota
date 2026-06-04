
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, Wrench, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { PlanoManutencao } from '../../hooks/usePlanosManutencao';

export type StatusPlano = 'VERDE' | 'AMARELO' | 'VERMELHO';

export interface PlanoProcessado extends PlanoManutencao {
  percentualDesgaste: number;
  status: StatusPlano;
  descricaoFalta: string;
}

export const STATUS_CONFIG = {
  VERMELHO: { border: 'border-error/40', bg: 'bg-error/10', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', icon: ShieldAlert, color: 'text-error' },
  AMARELO: { border: 'border-warning/40', bg: 'bg-warning/10', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', icon: AlertTriangle, color: 'text-warning' },
  VERDE: { border: 'border-border/60', bg: 'bg-surface', glow: 'shadow-sm', icon: CheckCircle, color: 'text-success/80' }
};

interface CardPlanoManutencaoProps {
  planoProcessado: PlanoProcessado;
  onExcluir: (id: string) => void;
  onBaixar: (plano: PlanoProcessado) => void;
  isExcluindo: boolean;
}

export function CardPlanoManutencao({ planoProcessado: plano, onExcluir, onBaixar, isExcluindo }: CardPlanoManutencaoProps) {
  const conf = STATUS_CONFIG[plano.status];
  const Icon = conf.icon;

  return (
    <div className={`relative flex flex-col bg-surface border transition-all duration-300 rounded-[2rem] overflow-hidden ${conf.border} hover:${conf.glow}`}>
      {/* Cabeçalho do Card */}
      <div className={`p-5 pb-3 border-b border-border/20 flex flex-col gap-2 ${conf.bg}`}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/80">{plano.veiculo.modelo}</span>
            <h3 className="text-2xl font-black font-mono text-text-main tracking-tight uppercase leading-none">{plano.veiculo.placa}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              isLoading={isExcluindo}
              onClick={() => onExcluir(plano.id)}
              className="!p-1.5 text-text-muted hover:bg-error/20 hover:text-error rounded-lg transition-colors"
              title="Excluir Plano"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className={`p-2 rounded-xl bg-background/50 border border-border/20 ${conf.color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <p className="text-sm font-bold text-text-secondary mt-1">{plano.descricao}</p>
      </div>

      {/* Miolo - Termostato/Gauge Linear */}
      <div className="flex-1 p-5 pb-4 space-y-4">
        <div className="flex justify-between items-end text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          <span>Progresso ({plano.tipoIntervalo})</span>
          <span className={conf.color}>{plano.descricaoFalta}</span>
        </div>

        <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden border border-border/40 shadow-inner">
          <div
            className={`h-full rounded-r-full transition-all duration-1000 ${plano.status === 'VERMELHO' ? 'bg-error' : plano.status === 'AMARELO' ? 'bg-warning' : 'bg-emerald-500'}`}
            style={{
              width: `${Math.max(10, plano.percentualDesgaste)}%`,
              boxShadow: plano.status === 'VERMELHO' ? '0 0 10px rgba(239,68,68,0.7)' : 'none'
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary mt-1.5 opacity-80">
          <span>
            Atual: {plano.tipoIntervalo === 'KM' ? (plano.veiculo.ultimoKm?.toLocaleString() + ' KM') : 'Hoje'}
          </span>
          <span>
            Alvo: {plano.tipoIntervalo === 'KM' ? (plano.kmProximaManutencao?.toLocaleString() + ' KM') : (plano.dataProximaManutencao ? format(new Date(plano.dataProximaManutencao), 'dd/MM/yyyy') : '--')}
          </span>
        </div>
      </div>

      {/* Histórico Mini Timeline */}
      {plano.historicoExecucoes && plano.historicoExecucoes.length > 0 && (
        <div className="px-5 pb-4 text-[10px] text-text-muted font-medium flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Última Baixa: {format(new Date(plano.historicoExecucoes[0].dataExecucao), 'dd/MM/yyyy')} por {plano.historicoExecucoes[0].registradoPor?.nome.split(' ')[0]}
        </div>
      )}

      <div className="p-4 pt-0">
        <Button
          variant={plano.status === 'VERMELHO' ? 'danger' : 'outline'}
          className={`w-full group ${plano.status === 'VERMELHO' ? 'bg-error hover:bg-error-500 border-error text-white' : ''}`}
          onClick={() => onBaixar(plano)}
        >
          <Wrench className={`w-4 h-4 mr-2 ${plano.status === 'VERMELHO' ? 'text-white group-hover:animate-spin' : ''}`} />
          {plano.status === 'VERDE' ? 'Anotar Revisão Antecipada' : 'Manutenção Realizada!'}
        </Button>
      </div>
    </div>
  );
}

// Funções Helpers para calcular e processar os planos
export function processarPlanosManutencao(planos: PlanoManutencao[]): PlanoProcessado[] {
  return planos.map(plano => {
    let percentualDesgaste = 0;
    let status: StatusPlano = 'VERDE';
    let descricaoFalta = '';

    if (plano.tipoIntervalo === 'KM') {
      const kmAtual = plano.veiculo.ultimoKm || 0;
      const alvo = plano.kmProximaManutencao || 0;
      const inicioCiclo = alvo - plano.valorIntervalo;
      const totalPercorridoNoCiclo = Math.max(0, kmAtual - inicioCiclo);

      percentualDesgaste = Math.min((totalPercorridoNoCiclo / plano.valorIntervalo) * 100, 100);
      const kmFaltante = alvo - kmAtual;

      if (kmFaltante <= 0) {
        status = 'VERMELHO';
        descricaoFalta = `Estourou por ${Math.abs(kmFaltante).toLocaleString()} KM`;
      } else if (kmFaltante <= 1500) {
        status = 'AMARELO';
        descricaoFalta = `Atenção: Apenas ${kmFaltante.toLocaleString()} KM restantes`;
      } else {
        status = 'VERDE';
        descricaoFalta = `Faltam ${kmFaltante.toLocaleString()} KM`;
      }
    } else {
      const dataAlvo = plano.dataProximaManutencao ? new Date(plano.dataProximaManutencao) : new Date();
      const diasFaltantes = differenceInDays(dataAlvo, new Date());

      const totalDiasDoCiclo = plano.valorIntervalo * 30;
      const diasPassados = totalDiasDoCiclo - diasFaltantes;

      percentualDesgaste = Math.min((diasPassados / totalDiasDoCiclo) * 100, 100);

      if (diasFaltantes <= 0) {
        status = 'VERMELHO';
        descricaoFalta = `Vencido há ${Math.abs(diasFaltantes)} dias`;
      } else if (diasFaltantes <= 15) {
        status = 'AMARELO';
        descricaoFalta = `Vence em ${diasFaltantes} dias`;
      } else {
        status = 'VERDE';
        descricaoFalta = `Seguro por ${diasFaltantes} dias`;
      }
    }

    return { ...plano, percentualDesgaste, status, descricaoFalta };
  });
}
