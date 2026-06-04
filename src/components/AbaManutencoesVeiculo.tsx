import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import type { OrdemServico, Veiculo } from '../types';

interface AbaManutencoesVeiculoProps {
  veiculo: Veiculo;
}

export function AbaManutencoesVeiculo({ veiculo }: AbaManutencoesVeiculoProps) {
  const [limiteManutencoes, setLimiteManutencoes] = useState(10);

  const formatBRL = (val: number) =>
    (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="p-2 bg-warning-500/10 rounded-xl text-warning-600 border border-warning-500/20 shadow-inner">
          <Wrench className="w-5 h-5" />
        </div>
        <h3 className="font-black text-text-main text-lg tracking-tight">Registro de Oficina</h3>
      </div>
      
      <div className="divide-y divide-border/30 overflow-y-auto max-h-[500px] scrollbar-thin pr-2 relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40 -z-10" />
        
        {(veiculo.ordensServico || []).slice(0, limiteManutencoes).map((m: OrdemServico, idx: number) => (
          <div key={m.id} className={`py-4 flex justify-between items-center transition-colors group px-4 rounded-xl ml-2 hover-lift ${idx === 0 ? 'ghost-row bg-surface-hover/30' : 'hover:bg-surface-hover/50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 z-10">
                <div className="w-2 h-2 rounded-full bg-warning-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors tracking-tight leading-none">{m.fornecedor?.nome || 'Oficina Não Registrada'}</p>
                <p className="text-data">{new Date(m.data).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <span className="text-data text-error bg-error/5 px-2.5 py-1 rounded-lg border border-error/10 shadow-sm">
              -{formatBRL(Number(m.custoTotal))}
            </span>
          </div>
        ))}

        {(veiculo.ordensServico && veiculo.ordensServico.length > limiteManutencoes) && (
          <div className="pt-4 pb-2 flex justify-center">
            <Button variant="outline" onClick={() => setLimiteManutencoes(prev => prev + 10)} className="text-xs h-8">
              Carregar mais histórico
            </Button>
          </div>
        )}

        {(!veiculo.ordensServico || veiculo.ordensServico.length === 0) && (
          <div className="py-8">
            <EmptyState
              title="Nenhuma Oficina"
              description="O veículo ainda não possui histórico de manutenção corretiva ou preventiva."
              icon={Wrench}
            />
          </div>
        )}
      </div>
    </div>
  );
}
