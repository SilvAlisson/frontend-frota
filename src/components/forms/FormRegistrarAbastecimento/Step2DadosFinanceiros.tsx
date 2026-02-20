// src/components/forms/FormRegistrarAbastecimento/Step2DadosFinanceiros.tsx
import { useEffect, useMemo } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { MapPin, Plus, X, Droplets } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { formatCurrency } from '../../../utils';
import { formatarDinheiro, desformatarDinheiro } from '../../../lib/formatters';
import { useFornecedores } from '../../../hooks/useFornecedores';
import { useProdutos } from '../../../hooks/useProdutos';
import { useVeiculos } from '../../../hooks/useVeiculos';
import type { AbastecimentoFormValues } from './schema';
import type { Veiculo } from '../../../types';

export function Step2DadosFinanceiros() {
  const { register, control, watch, setValue, formState: { errors, isSubmitting } } = useFormContext<AbastecimentoFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const { data: fornecedores = [], isLoading: loadF } = useFornecedores();
  const { data: produtos = [], isLoading: loadP } = useProdutos();
  const { data: veiculos = [] } = useVeiculos();

  const isLocked = isSubmitting || loadF || loadP;

  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens') || [];

  const postoOptions = useMemo(() =>
    fornecedores.filter(f => f.tipo === 'POSTO').map(f => ({ value: f.id, label: f.nome })),
    [fornecedores]
  );

  const produtoOptions = useMemo(() =>
    produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo)).map(p => ({ value: p.id, label: p.nome })),
    [produtos]
  );

  // Automação: Sugere o combustível padrão baseado no veículo
  useEffect(() => {
    if (veiculoIdSelecionado) {
      const v = veiculos.find((v: Veiculo) => v.id === veiculoIdSelecionado);
      if (v) {
        const combustivelPadrao = produtos.find(p =>
          v.tipoCombustivel && p.nome.toUpperCase().includes(v.tipoCombustivel.replace('_', ' ').toUpperCase())
        );

        const itemAtualId = itensObservados[0]?.produtoId;
        if (combustivelPadrao && (!itemAtualId || itemAtualId !== combustivelPadrao.id)) {
          setValue('itens.0.produtoId', combustivelPadrao.id);
        }
      }
    }
  }, [veiculoIdSelecionado, veiculos, produtos, setValue]);

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
            onClick={() => append({ produtoId: '', quantidade: 0, valorUnitario: '' } as any)}
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
            const unit = desformatarDinheiro(String(watch(`itens.${index}.valorUnitario`)));
            const totalItem = (qtd * unit).toFixed(2);

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
                    <Input
                      label="Quantidade (L)"
                      type="number"
                      step="0.001"
                      icon={<Droplets className="w-4 h-4 text-sky-500" />}
                      {...register(`itens.${index}.quantidade`)}
                      error={errors.itens?.[index]?.quantidade?.message as string}
                      className="font-mono font-bold"
                      disabled={isLocked}
                    />

                    <Input
                      label="Valor Unitário"
                      {...register(`itens.${index}.valorUnitario`, {
                        onChange: (e) => {
                          e.target.value = formatarDinheiro(e.target.value);
                          setValue(`itens.${index}.valorUnitario`, e.target.value);
                        }
                      })}
                      error={errors.itens?.[index]?.valorUnitario?.message as string}
                      className="font-mono font-black text-emerald-600 tracking-tight"
                      placeholder="R$ 0,00"
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 flex justify-end border-t border-border/40">
                  <div className="px-4 py-1.5 rounded-lg border border-border/50 bg-background text-sm font-medium flex gap-2 shadow-sm">
                    <span className="text-text-muted uppercase tracking-wider text-[10px] self-center">Subtotal:</span>
                    <span className="font-mono font-black text-text-main">{formatCurrency(Number(totalItem))}</span>
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