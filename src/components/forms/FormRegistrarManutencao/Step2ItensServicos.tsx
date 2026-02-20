// src/components/forms/FormRegistrarManutencao/Step2ItensServicos.tsx
import { useState, useEffect, useMemo } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, X, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { ModalGerenciarServicos } from '../../ModalGerenciarServicos';
import { formatCurrency } from '../../../utils';
import { formatarDinheiro, desformatarDinheiro } from '../../../lib/formatters';
import { useProdutos } from '../../../hooks/useProdutos';
import { useFornecedores } from '../../../hooks/useFornecedores';
import type { Produto } from '../../../types';
import type { ManutencaoFormValues } from './schema';

export function Step2ItensServicos() {
  const { register, control, watch, setValue, formState: { errors, isSubmitting } } = useFormContext<ManutencaoFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const { data: produtos = [], isLoading: loadP } = useProdutos();
  const { data: fornecedores = [] } = useFornecedores();
  
  const isLocked = isSubmitting || loadP;
  const [modalServicosOpen, setModalServicosOpen] = useState(false);
  const [listaProdutos, setListaProdutos] = useState<Produto[]>(produtos);

  useEffect(() => {
    if (produtos.length > 0) setListaProdutos(produtos);
  }, [produtos]);

  const tipoManutencao = watch('tipo');
  const fornecedorIdSelecionado = watch('fornecedorId');

  const produtosDisponiveis = useMemo(() => {
    const tiposBloqueados = ['COMBUSTIVEL', 'ADITIVO'];
    if (tipoManutencao === 'CORRETIVA') tiposBloqueados.push('LAVAGEM');

    let lista = listaProdutos.filter(p => !tiposBloqueados.includes(p.tipo));
    
    if (fornecedorIdSelecionado) {
      const fornecedor = fornecedores.find(f => f.id === fornecedorIdSelecionado);
      if (fornecedor?.produtosOferecidos?.length) {
        const idsPermitidos = fornecedor.produtosOferecidos.map(p => p.id);
        lista = lista.filter(p => idsPermitidos.includes(p.id));
      }
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [listaProdutos, fornecedorIdSelecionado, fornecedores, tipoManutencao]);

  const produtosOpcoes = useMemo(() => 
    produtosDisponiveis.map(p => ({ value: p.id, label: p.nome })),
    [produtosDisponiveis]
  );

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center pb-2 border-b border-border/50">
        <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em]">Peças e Serviços Utilizados</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setModalServicosOpen(true)}
          className="text-primary hover:bg-primary/10 h-8"
          icon={<Plus className="w-3 h-3" />}
        >
          Criar no Catálogo
        </Button>
      </div>

      {fornecedorIdSelecionado && produtosDisponiveis.length < listaProdutos.length && (
        <div className="bg-sky-500/10 text-sky-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-sky-500/20 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Mostrando apenas itens fornecidos por esta oficina.
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const qtd = Number(watch(`itens.${index}.quantidade`)) || 0;
          const unit = desformatarDinheiro(String(watch(`itens.${index}.valorPorUnidade`)));
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
                    label="Item / Serviço"
                    options={produtosOpcoes}
                    {...register(`itens.${index}.produtoId`)}
                    error={errors.itens?.[index]?.produtoId?.message}
                    disabled={isLocked}
                    icon={<Package className="w-4 h-4 text-text-muted" />}
                  />
                </div>
                
                <div className="grid grid-cols-2 sm:col-span-6 gap-4">
                  <Input
                    label="Qtd"
                    type="number"
                    step="0.1"
                    {...register(`itens.${index}.quantidade`)}
                    error={errors.itens?.[index]?.quantidade?.message}
                    className="font-mono font-bold text-center"
                    disabled={isLocked}
                  />

                  <Input
                    label="Valor Unitário"
                    {...register(`itens.${index}.valorPorUnidade`, {
                      onChange: (e) => {
                        e.target.value = formatarDinheiro(e.target.value);
                        setValue(`itens.${index}.valorPorUnidade`, e.target.value);
                      }
                    })}
                    error={errors.itens?.[index]?.valorPorUnidade?.message}
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

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: '' } as any)}
        className="w-full border-dashed"
        icon={<Plus className="w-4 h-4" />}
      >
        Adicionar mais uma peça ou serviço
      </Button>

      {modalServicosOpen && (
        <ModalGerenciarServicos
          onClose={() => setModalServicosOpen(false)}
          onItemAdded={(novoItem) => setListaProdutos(prev => [...prev, novoItem].sort((a, b) => a.nome.localeCompare(b.nome)))}
        />
      )}
    </div>
  );
}