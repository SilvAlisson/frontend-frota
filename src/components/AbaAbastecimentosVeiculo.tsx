import { useState } from 'react';
import { Fuel } from 'lucide-react';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import type { Abastecimento, Veiculo } from '../types';

interface AbaAbastecimentosVeiculoProps {
  veiculo: Veiculo;
}

export function AbaAbastecimentosVeiculo({ veiculo }: AbaAbastecimentosVeiculoProps) {
  const [limiteAbastecimentos, setLimiteAbastecimentos] = useState(10);

  const formatBRL = (val: number) =>
    (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
          <Fuel className="w-5 h-5" />
        </div>
        <h3 className="font-black text-text-main text-lg tracking-tight">Registros de Combustível</h3>
      </div>
      
      <div className="divide-y divide-border/30 overflow-y-auto max-h-[500px] scrollbar-thin pr-2 relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40 -z-10" />
        
        {(veiculo.abastecimentos || []).slice(0, limiteAbastecimentos).map((a: Abastecimento, idx: number) => (
          <div key={a.id} className={`py-4 flex justify-between items-center transition-colors group px-4 rounded-xl ml-2 hover-lift ${idx === 0 ? 'ghost-row bg-surface-hover/30' : 'hover:bg-surface-hover/50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 z-10">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors tracking-tight leading-none">{a.fornecedor?.nome || 'Posto Local'}</p>
                <p className="text-data flex items-center gap-1.5 mt-0.5">
                  {new Date(a.dataHora).toLocaleDateString('pt-BR')}
                  <span className="w-1 h-1 bg-border/80 rounded-full" />
                  <span className="text-data">{a.kmOdometro?.toLocaleString('pt-BR')} KM</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-data text-success bg-success/10 border border-success/20 px-3 py-1 rounded-lg shadow-sm block">
                {Number(a.quantidade).toFixed(1)} L
              </span>
              <span className="text-[10px] font-black text-text-muted mt-1 block">
                {formatBRL(Number(a.custoTotal || 0))}
              </span>
            </div>
          </div>
        ))}

        {(veiculo.abastecimentos && veiculo.abastecimentos.length > limiteAbastecimentos) && (
          <div className="pt-4 pb-2 flex justify-center">
            <Button variant="outline" onClick={() => setLimiteAbastecimentos(prev => prev + 10)} className="text-xs h-8">
              Carregar mais registros
            </Button>
          </div>
        )}

        {(!veiculo.abastecimentos || veiculo.abastecimentos.length === 0) && (
          <div className="py-8">
            <EmptyState
              title="Tanque Zerado"
              description="Não há registros operacionais de abastecimento para este veículo."
              icon={Fuel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
