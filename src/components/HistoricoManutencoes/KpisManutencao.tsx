import { DollarSign, Wrench } from 'lucide-react';
import { Card } from '../ui/Card';

interface KpisManutencaoProps {
  estatisticas: {
    totalGasto: number;
    osAbertas: number;
  };
}

export function KpisManutencao({ estatisticas }: KpisManutencaoProps) {
  const { totalGasto, osAbertas } = estatisticas;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
        <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> Subtotal do Período/Oficina
        </span>
        <span className="text-3xl font-sans font-black tracking-tight text-text-main truncate group-hover:text-primary transition-colors">
          {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </Card>

      <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
        <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ordens de Serviço (Fichas)
        </span>
        <span className="text-3xl font-sans font-black tracking-tight text-text-main truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {osAbertas} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">Em Oficina</small>
        </span>
      </Card>
    </div>
  );
}
