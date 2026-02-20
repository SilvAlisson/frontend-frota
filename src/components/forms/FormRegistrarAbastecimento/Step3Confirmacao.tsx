// src/components/forms/FormRegistrarAbastecimento/Step3Confirmacao.tsx
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import { Card } from '../../ui/Card';
import { formatCurrency } from '../../../utils';
import { desformatarDinheiro } from '../../../lib/formatters';
import { useVeiculos } from '../../../hooks/useVeiculos';
import type { AbastecimentoFormValues } from './schema';
import type { Veiculo } from '../../../types';

export function Step3Confirmacao() {
  const { watch } = useFormContext<AbastecimentoFormValues>();
  const { data: veiculos = [] } = useVeiculos();

  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens') || [];
  const kmAtual = watch('kmAtual');

  const totalGeral = useMemo(() => {
    return itensObservados.reduce((acc, item) => {
      const qtd = Number(item?.quantidade) || 0;
      const unit = desformatarDinheiro(String(item?.valorUnitario || '')); 
      return acc + (qtd * unit);
    }, 0);
  }, [itensObservados]);

  const placaVeiculo = veiculos.find((v: Veiculo) => v.id === veiculoIdSelecionado)?.placa || '---';

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-300 py-4">
      <Card variant="solid" className="bg-text-main text-surface border-transparent text-center relative overflow-hidden shadow-xl rounded-3xl">
        <div className="absolute -top-6 -right-6 p-8 opacity-5 pointer-events-none">
          <DollarSign className="w-40 h-40 rotate-12" />
        </div>
        <div className="relative z-10 py-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/80 mb-3">Valor Total Estimado</p>
          <p className="text-5xl sm:text-6xl font-mono font-black tracking-tighter truncate text-primary">
            {formatCurrency(totalGeral)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 rounded-2xl bg-surface-hover/50 border border-border/60">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1.5">Veículo Alocado</p>
          <p className="font-bold text-text-main text-sm truncate font-mono">
            {placaVeiculo}
          </p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-surface-hover/50 border border-border/60">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1.5">Odômetro Final</p>
          <p className="font-black text-primary text-sm font-mono tracking-tight">{kmAtual} <span className="text-[10px] opacity-70">KM</span></p>
        </div>
      </div>
    </div>
  );
}