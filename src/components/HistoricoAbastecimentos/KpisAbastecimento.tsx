import { DollarSign, Droplets } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import { GraficoCurvaAbastecimento } from '../ui/GraficosFrota';

interface KpisAbastecimentoProps {
  estatisticas: {
    totalGasto: number;
    totalLitros: number;
    dadosCurva: { mes: string; litros: number; custo: number }[];
  };
}

export function KpisAbastecimento({ estatisticas }: KpisAbastecimentoProps) {
  const { totalGasto, totalLitros, dadosCurva } = estatisticas;

  return (
    <>
      {dadosCurva.length > 1 && (
        <div className="bg-surface border border-border/60 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted block">Tendência Mensal de Consumo</span>
              <p className="text-sm font-bold text-text-main mt-0.5">Litros abastecidos nos últimos meses</p>
            </div>
          </div>
          <GraficoCurvaAbastecimento dados={dadosCurva} modo="litros" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Capital Investido (Relatório Atual)
          </span>
          <span className="text-3xl font-sans font-black tracking-tight text-text-main truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {formatCurrency(totalGasto)}
          </span>
        </Card>
        
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-info " /> Litragem Abastecida
          </span>
          <span className="text-3xl font-sans font-black tracking-tight text-text-main group-hover:text-info dark:group-hover:text-sky-400 transition-colors">
            {totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <small className="text-lg font-bold opacity-60 ml-1 uppercase tracking-widest">Litros</small>
          </span>
        </Card>
      </div>
    </>
  );
}
