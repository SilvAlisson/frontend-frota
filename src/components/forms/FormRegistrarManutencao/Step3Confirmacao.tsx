// src/components/forms/FormRegistrarManutencao/Step3Confirmacao.tsx
import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { formatCurrency } from '../../../utils';
import { desformatarDinheiro } from '../../../lib/formatters';
import type { ManutencaoFormValues } from './schema';

export function Step3Confirmacao() {
  const { register, watch, formState: { isSubmitting } } = useFormContext<ManutencaoFormValues>();
  
  const itensObservados = watch('itens');
  const tipoManutencao = watch('tipo');
  const alvoSelecionado = watch('alvo');

  const totalGeral = useMemo(() => {
    return (itensObservados || []).reduce((acc, item) => {
      const qtd = Number(item.quantidade) || 0;
      const unit = desformatarDinheiro(String(item.valorPorUnidade || ''));
      return acc + (qtd * unit);
    }, 0);
  }, [itensObservados]);

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-300 py-4">
      <Card variant="solid" className="bg-text-main text-surface border-transparent text-center relative overflow-hidden shadow-xl rounded-3xl">
        <div className="absolute -top-6 -right-6 p-8 opacity-5 pointer-events-none">
          <DollarSign className="w-40 h-40 rotate-12" />
        </div>
        <div className="relative z-10 py-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/80 mb-3">Custo Total da OS</p>
          <p className="text-5xl sm:text-6xl font-mono font-black tracking-tighter truncate text-primary">
            {formatCurrency(totalGeral)}
          </p>
          
          <div className="mt-5 flex justify-center gap-2">
            <Badge variant={tipoManutencao === 'PREVENTIVA' ? 'success' : 'danger'}>
              {tipoManutencao}
            </Badge>
            <Badge variant="neutral" className="bg-surface/10 text-surface border-surface/20">
              {alvoSelecionado === 'VEICULO' ? 'VEÍCULO' : 'EQUIPAMENTO'}
            </Badge>
          </div>
        </div>
      </Card>

      <div>
        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1">
          Parecer Técnico / Observações
        </label>
        <textarea
          {...register("observacoes")}
          className="w-full px-4 py-3 text-sm bg-surface border border-border/60 shadow-sm rounded-xl focus:ring-2 focus:ring-primary/30 outline-none resize-none min-h-[120px] transition-all text-text-main"
          placeholder="Descreva a causa do problema..."
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}