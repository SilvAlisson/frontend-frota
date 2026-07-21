import { useState, useEffect, useMemo } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Plus, X, Package, Store, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Callout } from '../../ui/Callout';
import { ModalGerenciarServicos } from '../../ModalGerenciarServicos';
import { formatarDinheiro, desformatarDinheiro } from '../../../lib/formatters';
import { useProdutos } from '../../../hooks/useProdutos';
import { useFornecedores } from '../../../hooks/useFornecedores';
import type { Produto } from '../../../types';
import type { ManutencaoFormValues } from './schema';

// Extendendo o tipo Produto para garantir que sabemos sobre a propriedade ultimoPreco vinda do backend
interface ProdutoComPreco extends Produto {
  ultimoPreco?: number;
}

export function Step2ItensServicos() {
  const { register, control, watch, setValue, formState: { errors, isSubmitting } } = useFormContext<ManutencaoFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  // Usamos cast para avisar ao TS sobre nossa interface estendida
  const { produtos = [], loading: loadP } = useProdutos() as { produtos: ProdutoComPreco[], loading: boolean };
  const { fornecedores = [] } = useFornecedores();
  
  const isLocked = isSubmitting || loadP;
  const [modalServicosOpen, setModalServicosOpen] = useState(false);
  const [listaProdutos, setListaProdutos] = useState<ProdutoComPreco[]>(produtos);

  useEffect(() => {
    if (produtos.length > 0) setListaProdutos(produtos);
  }, [produtos]);

  const tipoManutencao = watch('tipo');
  const fornecedorIdSelecionado = watch('fornecedorId');
  const itensObservados = watch('itens') || [];

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

  // 1. A Mágica do Preço Automático para Peças e Serviços
  useEffect(() => {
    itensObservados.forEach((item, index) => {
      if (item && item.produtoId) {
        const produtoSelecionado = listaProdutos.find(p => p.id === item.produtoId);
        const precoSugerido = produtoSelecionado?.ultimoPreco;

        // Se tem histórico e o input de valor ainda está vazio/zerado
        if (precoSugerido && (!item.valorPorUnidade || desformatarDinheiro(String(item.valorPorUnidade)) === 0)) {
           const precoFormatado = formatarDinheiro(String(precoSugerido.toFixed(2)).replace('.', ','));
           setValue(`itens.${index}.valorPorUnidade`, precoFormatado, { shouldValidate: true });
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(itensObservados.map(i => i?.produtoId)), listaProdutos, setValue]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center pb-3 border-b border-border/60 gap-4">
        <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] truncate min-w-0">
          Relação de Peças
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setModalServicosOpen(true)}
          className="text-primary hover:bg-primary/10 h-10 sm:h-8 px-3 shrink-0"
          icon={<Plus className="w-4 h-4 sm:w-3 sm:h-3" />}
        >
          Criar no Catálogo
        </Button>
      </div>

      {fornecedorIdSelecionado && produtosDisponiveis.length < listaProdutos.length && (
        <Callout variant="info" title="Filtro Ativo" icon={Store}>
          A exibir apenas os serviços e peças que estão Registrados como fornecidos pela oficina selecionada.
        </Callout>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const qtd = Number(watch(`itens.${index}.quantidade`)) || 0;
          const unitString = watch(`itens.${index}.valorPorUnidade`);
          const unit = desformatarDinheiro(String(unitString));
          const totalItem = (qtd * unit).toFixed(2);

          // 2. Lógica para detectar variação de preço da peça/serviço
          const produtoIdAtual = watch(`itens.${index}.produtoId`);
          const produtoData = listaProdutos.find(p => p.id === produtoIdAtual);
          const ultimoPrecoHistorico = produtoData?.ultimoPreco || 0;
          
          let statusPreco: 'igual' | 'aumentou' | 'diminuiu' | 'sem_historico' = 'sem_historico';
          
          if (ultimoPrecoHistorico > 0 && unit > 0) {
             if (unit > ultimoPrecoHistorico) statusPreco = 'aumentou';
             else if (unit < ultimoPrecoHistorico) statusPreco = 'diminuiu';
             else statusPreco = 'igual';
          }

          return (
            <div key={field.id} className="relative bg-surface p-5 rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 group">
              {fields.length > 1 && (
                <div className="absolute -top-3 -right-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isLocked}
                      className="h-11 w-11 sm:h-8 sm:w-8 rounded-full bg-surface border border-border/60 text-text-muted hover:text-white hover:border-error hover:bg-error shadow-sm flex items-center justify-center transition-all disabled:opacity-50"
                      title="Remover linha"
                      aria-label="Remover linha"
                    >
                      <X className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-w-0">
                
                <div className="xl:col-span-6 min-w-0">
                  <Controller
                    control={control}
                    name={`itens.${index}.produtoId`}
                    render={({ field }) => (
                      <Select
                        label="Item / Serviço do Catálogo"
                        options={produtosOpcoes}
                        icon={<Package className="w-4 h-4 text-text-muted" />}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        error={errors.itens?.[index]?.produtoId?.message}
                        disabled={isLocked}
                        containerClassName="!mb-0"
                      />
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 xl:col-span-6 gap-4 min-w-0 relative">
                  <div className="min-w-0">
                    <Input
                      label="Quantidade"
                      type="text" 
                      inputMode="decimal"
                      step="0.001"
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
                      error={errors.itens?.[index]?.quantidade?.message}
                      className="font-mono font-black text-center"
                      disabled={isLocked}
                      containerClassName="!mb-0"
                    />
                  </div>

                  <div className="flex flex-col relative min-w-0">
                    <Input
                      label="Preço Unitário"
                      type="tel"
                      inputMode="numeric"
                      {...register(`itens.${index}.valorPorUnidade`, {
                        onChange: (e) => {
                          e.target.value = formatarDinheiro(e.target.value);
                          setValue(`itens.${index}.valorPorUnidade`, e.target.value);
                        }
                      })}
                      error={errors.itens?.[index]?.valorPorUnidade?.message}
                      className={`font-mono font-black tracking-tight ${
                         statusPreco === 'aumentou' ? 'text-error' : 
                         statusPreco === 'diminuiu' ? 'text-success' : 'text-emerald-600'
                      }`}
                      placeholder="R$ 0,00"
                      disabled={isLocked}
                      containerClassName="!mb-1"
                    />
                    
                    {/* 3. Feedback Visual Contextual */}
                    {statusPreco === 'aumentou' && (
                       <div className="flex items-center gap-1 text-[10px] text-error font-bold tracking-tight mt-1 animate-in fade-in">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span className="truncate">Custo maior! (Anterior: {formatarDinheiro(String(ultimoPrecoHistorico.toFixed(2)).replace('.', ','))})</span>
                       </div>
                    )}
                    {statusPreco === 'diminuiu' && (
                       <div className="flex items-center gap-1 text-[10px] text-success font-bold tracking-tight mt-1 animate-in fade-in">
                          <TrendingDown className="w-3 h-3 shrink-0" />
                          <span className="truncate">Custo menor! (Anterior: {formatarDinheiro(String(ultimoPrecoHistorico.toFixed(2)).replace('.', ','))})</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 flex justify-end border-t border-border/40 min-w-0">
                <div className="px-4 py-2 rounded-xl bg-surface-hover/80 text-sm font-medium flex items-center gap-3 border border-border/60 max-w-full truncate">
                  <span className="text-text-muted uppercase tracking-[0.2em] text-[9px] font-black shrink-0">Subtotal:</span>
                  <span className="font-mono font-black text-text-main text-lg tracking-tight leading-none truncate">
                    {formatarDinheiro(Number(totalItem))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: '' } as unknown as ManutencaoFormValues['itens'][0])}
        className="w-full border-dashed border-2 hover:border-primary/50 hover:text-primary transition-all bg-background touch-target h-12 mt-2"
        icon={<Plus className="w-4 h-4" />}
      >
        Adicionar outra Peça ou Serviço
      </Button>

      {modalServicosOpen && (
        <ModalGerenciarServicos
          onClose={() => setModalServicosOpen(false)}
          onItemAdded={(novoItem) => setListaProdutos(prev => [...prev, novoItem as unknown as ProdutoComPreco].sort((a, b) => a.nome.localeCompare(b.nome)))}
        />
      )}
    </div>
  );
}