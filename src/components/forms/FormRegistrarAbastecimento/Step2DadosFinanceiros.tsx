import { useEffect, useMemo } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { MapPin, Plus, X, Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { formatarDinheiro, desformatarDinheiro } from '../../../lib/formatters';
import { useFornecedores } from '../../../hooks/useFornecedores';
import { useProdutos } from '../../../hooks/useProdutos';
import { useVeiculos } from '../../../hooks/useVeiculos';
import type { AbastecimentoFormValues } from './schema';
import type { Veiculo } from '../../../types';


export function Step2DadosFinanceiros() {
  const { register, control, watch, setValue, getValues, formState: { errors, isSubmitting } } = useFormContext<AbastecimentoFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const { fornecedores = [], isLoading: loadF } = useFornecedores();
  const { produtos = [], loading: loadP } = useProdutos();
  const { data: veiculos = [] } = useVeiculos();

  const isLocked = isSubmitting || loadF || loadP;

  const veiculoIdSelecionado = watch('veiculoId');
  const fornecedorIdSelecionado = watch('fornecedorId');
  const itensObservados = watch('itens') || [];

  const postoOptions = useMemo(() =>
    fornecedores.filter(f => f.tipo === 'POSTO').map(f => ({ value: f.id, label: f.nome })),
    [fornecedores]
  );

  const produtoOptions = useMemo(() =>
    produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo)).map(p => ({ value: p.id, label: p.nome })),
    [produtos]
  );

  // Automação 1: Sugere o combustível padrão baseado no veículo
  useEffect(() => {
    if (veiculoIdSelecionado) {
      const v = veiculos.find((v: Veiculo) => v.id === veiculoIdSelecionado);
      if (v && v.tipoCombustivel) {
        const combustivelPadrao = produtos.find(p =>
          p.nome.toUpperCase().includes(v.tipoCombustivel!.replace('_', ' ').toUpperCase())
        );

        const itemAtualId = getValues('itens.0.produtoId');
        if (combustivelPadrao && (!itemAtualId || itemAtualId !== combustivelPadrao.id)) {
          setValue('itens.0.produtoId', combustivelPadrao.id);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculoIdSelecionado, veiculos, produtos, setValue]);

  // Automação 2: Preenchimento Automático do Último Preço
  useEffect(() => {
    itensObservados.forEach((item, index) => {
      if (item && item.produtoId) {
        const produtoSelecionado = produtos.find(p => p.id === item.produtoId);
        let precoSugerido = produtoSelecionado?.ultimoPreco;
        
        if (fornecedorIdSelecionado && produtoSelecionado?.precosPorFornecedor?.[fornecedorIdSelecionado]) {
          precoSugerido = produtoSelecionado.precosPorFornecedor[fornecedorIdSelecionado];
        }

        // Se tem histórico e o input de valor ainda está vazio/zerado
        if (precoSugerido && (!item.valorUnitario || desformatarDinheiro(String(item.valorUnitario)) === 0)) {
           const precoFormatado = formatarDinheiro(String(precoSugerido.toFixed(2)).replace('.', ','));
           setValue(`itens.${index}.valorUnitario`, precoFormatado, { shouldValidate: true });
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(itensObservados.map(i => i?.produtoId)), fornecedorIdSelecionado, produtos, setValue]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
        <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Dados Financeiros</label>
      </div>

      <Select
        label="Posto / Fornecedor"
        options={postoOptions}
        icon={<MapPin className="w-4 h-4" />}
        {...register('fornecedorId')}
        error={errors.fornecedorId?.message as string}
        disabled={isLocked}
      />

      <div className="pt-2 border-t border-border/40">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em]">Produtos Consumidos</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ produtoId: '', quantidade: 0, valorUnitario: '' })}
            className="text-primary hover:bg-primary/10 h-8"
            icon={<Plus className="w-4 h-4" />}
            disabled={isLocked}
          >
            Adicionar Produto
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            const qtd = Number(watch(`itens.${index}.quantidade`)) || 0;
            const unitString = watch(`itens.${index}.valorUnitario`);
            const unit = desformatarDinheiro(String(unitString));
            const totalItem = (qtd * unit).toFixed(2);

            // Inteligência: Lógica para detectar variação de preço
            const produtoIdAtual = watch(`itens.${index}.produtoId`);
            const produtoData = produtos.find(p => p.id === produtoIdAtual);
            
            let ultimoPrecoHistorico = produtoData?.ultimoPreco || 0;
            if (fornecedorIdSelecionado && produtoData?.precosPorFornecedor?.[fornecedorIdSelecionado]) {
              ultimoPrecoHistorico = produtoData.precosPorFornecedor[fornecedorIdSelecionado];
            }
            
            let statusPreco: 'igual' | 'aumentou' | 'diminuiu' | 'sem_historico' = 'sem_historico';
            
            if (ultimoPrecoHistorico > 0 && unit > 0) {
               if (unit > ultimoPrecoHistorico) statusPreco = 'aumentou';
               else if (unit < ultimoPrecoHistorico) statusPreco = 'diminuiu';
               else statusPreco = 'igual';
            }

            return (
              <div key={field.id} className="relative bg-surface p-4 rounded-xl border border-border/60 shadow-sm hover:border-primary/40 transition-colors group">
                {fields.length > 1 && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isLocked}
                      className="h-7 w-7 rounded-full bg-surface border border-border/60 text-text-muted hover:text-error hover:border-error/40 hover:bg-error/10 shadow-sm flex items-center justify-center transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <Select
                      label="Produto"
                      options={produtoOptions}
                      {...register(`itens.${index}.produtoId`)}
                      error={errors.itens?.[index]?.produtoId?.message as string}
                      disabled={isLocked}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:col-span-6 gap-4">
                    <div className="min-w-0">
                      <Input
                        label="Quantidade (L)"
                        type="text" 
                        inputMode="decimal"
                        step="0.001"
                        icon={<Droplets className="w-4 h-4 text-info" />}
                        {...register(`itens.${index}.quantidade`, {
                          onChange: (e) => {
                            let val = e.target.value.replace(/[^0-9.,]/g, '');
                            val = val.replace(',', '.');
                            
                            const parts = val.split('.');
                            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                            
                            if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                              val = val.replace(/^0+/, '');
                            }
                            
                            e.target.value = val;
                            setValue(`itens.${index}.quantidade`, val);
                          }
                        })}
                        error={errors.itens?.[index]?.quantidade?.message as string}
                        className="font-mono font-bold"
                        disabled={isLocked}
                      />
                    </div>

                    <div className="flex flex-col relative min-w-0">
                      <Input
                        label="Valor Unitário"
                        type="tel" 
                        inputMode="numeric"
                        {...register(`itens.${index}.valorUnitario`, {
                          onChange: (e) => {
                            e.target.value = formatarDinheiro(e.target.value);
                            setValue(`itens.${index}.valorUnitario`, e.target.value);
                          }
                        })}
                        error={errors.itens?.[index]?.valorUnitario?.message as string}
                        className={`font-mono font-black tracking-tight ${
                           statusPreco === 'aumentou' ? 'text-error' : 
                           statusPreco === 'diminuiu' ? 'text-success' : 'text-emerald-600'
                        }`}
                        placeholder="R$ 0,00"
                        disabled={isLocked}
                        containerClassName="!mb-1"
                      />

                      {/* Feedback Visual Contextual */}
                      {statusPreco === 'aumentou' && (
                         <div className="flex items-center gap-1 text-[10px] text-error font-bold tracking-tight mt-1 animate-in fade-in">
                            <TrendingUp className="w-3 h-3 shrink-0" />
                            <span className="truncate">O valor subiu? (Anterior: {formatarDinheiro(String(ultimoPrecoHistorico.toFixed(2)).replace('.', ','))})</span>
                         </div>
                      )}
                      {statusPreco === 'diminuiu' && (
                         <div className="flex items-center gap-1 text-[10px] text-success font-bold tracking-tight mt-1 animate-in fade-in">
                            <TrendingDown className="w-3 h-3 shrink-0" />
                            <span className="truncate">O valor baixou? (Anterior: {formatarDinheiro(String(ultimoPrecoHistorico.toFixed(2)).replace('.', ','))})</span>
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex justify-end border-t border-border/40">
                  <div className="px-4 py-1.5 rounded-lg border border-border/50 bg-background text-sm font-medium flex gap-2 shadow-sm">
                    <span className="text-text-muted uppercase tracking-wider text-[10px] self-center">Subtotal:</span>
                    <span className="font-mono font-black text-text-main">{formatarDinheiro(Number(totalItem))}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}