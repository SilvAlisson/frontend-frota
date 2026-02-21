// src/components/forms/FormRegistrarAbastecimento/Step3Confirmacao.tsx
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { DollarSign, Info } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Callout } from '../../ui/Callout'; // ✨ Importando o Callout
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
      <Card variant="solid" className="bg-text-main text-surface border-transparent text-center relative overflow-hidden shadow-float rounded-[2rem]">
        <div className="absolute -top-6 -right-6 p-8 opacity-5 pointer-events-none">
          <DollarSign className="w-40 h-40 rotate-12" />
        </div>
        <div className="relative z-10 py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 mb-3">Valor Total Estimado</p>
          <p className="text-5xl sm:text-6xl font-mono font-black tracking-tighter truncate text-primary">
            {formatCurrency(totalGeral)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-5 rounded-3xl bg-surface-hover/50 border border-border/60 shadow-sm">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2">Veículo Alocado</p>
          <p className="font-black text-text-main text-base truncate font-mono tracking-tight">
            {placaVeiculo}
          </p>
        </div>
        <div className="text-center p-5 rounded-3xl bg-surface-hover/50 border border-border/60 shadow-sm">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2">Odómetro Final</p>
          <p className="font-black text-primary text-base font-mono tracking-tight">{kmAtual} <span className="text-[10px] opacity-70 ml-0.5">KM</span></p>
        </div>
      </div>

      {/* ✨ CALLOUT INFORMATIVO NO RESUMO */}
      <Callout variant="info" title="Auditoria Fiscal" icon={Info}>
        Verifique se o valor total e as quantidades coincidem exatamente com o cupão fiscal emitido pelo posto. Uma vez confirmado, este registo irá impactar o <strong>Custo por KM (CPK)</strong> da frota imediatamente.
      </Callout>

    </div>
  );
}