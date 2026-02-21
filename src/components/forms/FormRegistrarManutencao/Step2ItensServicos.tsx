// src/components/forms/FormRegistrarManutencao/Step2ItensServicos.tsx
import { useState, useEffect, useMemo } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, X, Package, Store } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Callout } from '../../ui/Callout'; // ✨
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
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center pb-3 border-b border-border/60">
        <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Relação de Peças e Serviços</h4>
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

      {/* ✨ O AVISO DE FILTRO DA OFICINA AGORA USA CALLOUT */}
      {fornecedorIdSelecionado && produtosDisponiveis.length < listaProdutos.length && (
        <Callout variant="info" title="Filtro Ativo" icon={Store}>
          A exibir apenas os serviços e peças que estão registados como fornecidos pela oficina selecionada.
        </Callout>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const qtd = Number(watch(`itens.${index}.quantidade`)) || 0;
          const unit = desformatarDinheiro(String(watch(`itens.${index}.valorPorUnidade`)));
          const totalItem = (qtd * unit).toFixed(2);

          return (
            <div key={field.id} className="relative bg-surface p-5 rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 group">
              {fields.length > 1 && (
                <div className="absolute -top-3 -right-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isLocked}
                      className="h-8 w-8 rounded-full bg-surface border border-border/60 text-text-muted hover:text-white hover:border-error hover:bg-error shadow-sm flex items-center justify-center transition-all disabled:opacity-50"
                      title="Remover linha"
                    >
                      <X className="w-4 h-4" />
                    </button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-6">
                  <Select
                    label="Item / Serviço do Catálogo"
                    options={produtosOpcoes}
                    {...register(`itens.${index}.produtoId`)}
                    error={errors.itens?.[index]?.produtoId?.message}
                    disabled={isLocked}
                    icon={<Package className="w-4 h-4 text-text-muted" />}
                    containerClassName="!mb-0"
                  />
                </div>
                
                <div className="grid grid-cols-2 xl:col-span-6 gap-4">
                  <Input
                    label="Quantidade"
                    type="number"
                    step="0.1"
                    {...register(`itens.${index}.quantidade`)}
                    error={errors.itens?.[index]?.quantidade?.message}
                    className="font-mono font-black text-center"
                    disabled={isLocked}
                    containerClassName="!mb-0"
                  />

                  <Input
                    label="Preço Unitário"
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
                    containerClassName="!mb-0"
                  />
                </div>
              </div>

              <div className="mt-5 pt-4 flex justify-end border-t border-border/40">
                <div className="px-4 py-2 rounded-xl bg-surface-hover/80 text-sm font-medium flex items-center gap-3 border border-border/60">
                  <span className="text-text-muted uppercase tracking-[0.2em] text-[9px] font-black">Subtotal:</span>
                  <span className="font-mono font-black text-text-main text-lg tracking-tight leading-none">{formatCurrency(Number(totalItem))}</span>
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
        className="w-full border-dashed border-2 hover:border-primary/50 hover:text-primary transition-all bg-background h-12 mt-2"
        icon={<Plus className="w-4 h-4" />}
      >
        Adicionar outra Peça ou Serviço
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