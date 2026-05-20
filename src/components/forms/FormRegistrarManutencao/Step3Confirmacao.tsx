import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Callout } from '../../ui/Callout'; 
import { Textarea } from '../../ui/Textarea';
import { formatarDinheiro, desformatarDinheiro } from '../../../lib/formatters';
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
    // min-w-0 no container principal garante que ele obedeça a largura da tela
    <div className="space-y-6 animate-in zoom-in-95 duration-300 py-4 min-w-0">
      
      <Card variant="solid" className="bg-text-main text-surface border-transparent text-center relative overflow-hidden shadow-float rounded-[2rem] min-w-0">
        <div className="absolute -top-6 -right-6 p-8 opacity-5 pointer-events-none">
          <DollarSign className="w-40 h-40 rotate-12" />
        </div>
        <div className="relative z-10 py-8 px-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 mb-3 truncate">
            Custo Total da Ordem de Serviço
          </p>
          
          {/*  CADEADO: break-all em telas pequenas ajuda se o número for absurdamente gigante */}
          <p className="text-4xl sm:text-5xl md:text-6xl font-mono font-black tracking-tighter text-primary break-words">
            {formatarDinheiro(totalGeral)}
          </p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge variant={tipoManutencao === 'PREVENTIVA' ? 'success' : 'danger'} className="shadow-sm">
              {tipoManutencao}
            </Badge>
            <Badge variant="neutral" className="bg-surface/10 text-surface border-surface/20 shadow-sm">
              {alvoSelecionado === 'VEICULO' ? 'VEÍCULO' : 'EQUIPAMENTO'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* CALLOUT COM QUEBRA DE TEXTO SEGURA */}
      <div className="min-w-0">
        <Callout variant="warning" title="Atenção: Auditoria Financeira" icon={AlertTriangle}>
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-sm font-medium">Confira os valores antes de salvar.</span>
            
            {/*  flex-wrap garante que, se a tela for estreita, o span desça uma linha em vez de esticar a tela */}
            <strong className="text-base sm:text-lg text-amber-700 dark:text-amber-500 animate-pulse flex flex-wrap items-center gap-1">
              O valor total do serviço foi realmente 
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 break-words max-w-full">
                {formatarDinheiro(totalGeral)}
              </span>?
            </strong>
          </div>
        </Callout>
      </div>

      {/*  SUBSTITUIÇÃO CRÍTICA: Trocada a tag crua <textarea> pelo nosso componente <Textarea> que empurra o teclado! */}
      <div className="min-w-0 pb-2">
        <Textarea
          label="Parecer Técnico / Observações"
          {...register("observacoes")}
          placeholder="Opcional: Descreva a causa da falha, anomalias identificadas ou anotações da oficina..."
          disabled={isSubmitting}
          minHeight={100}
        />
      </div>
      
    </div>
  );
}
