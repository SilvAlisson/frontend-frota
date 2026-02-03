import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../services/api';
import { toast } from 'sonner';
// CORREÇÃO: Renomeamos 'User' para 'UserIcon' para não conflitar com o tipo
import { Fuel, Save, Plus, X, ChevronDown, User as UserIcon, Truck, MapPin, Calendar, CreditCard } from 'lucide-react';
import type { Abastecimento, User, Veiculo, Produto, Fornecedor } from '../../types';

// --- SCHEMA ---
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.coerce.number().gt(0, "Qtd inválida"),
  valorPorUnidade: z.coerce.number().gt(0, "Valor inválido"),
});

const editSchema = z.object({
  veiculoId: z.string().min(1, "Veículo obrigatório"),
  operadorId: z.string().optional(),
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  kmOdometro: z.coerce.number().min(1, "KM obrigatório"),
  dataHora: z.string().min(1, "Data obrigatória"),
  placaCartaoUsado: z.string().optional(),
  justificativa: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione itens"),
});

type EditFormInput = z.input<typeof editSchema>;
type EditFormOutput = z.output<typeof editSchema>;

interface FormEditarAbastecimentoProps {
  abastecimentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormEditarAbastecimento({ abastecimentoId, onSuccess, onCancel }: FormEditarAbastecimentoProps) {
  const queryClient = useQueryClient();

  // 1. Queries
  const { data: abastecimento, isLoading: loadingAbs } = useQuery<Abastecimento>({
    queryKey: ['abastecimento', abastecimentoId],
    queryFn: async () => (await api.get(`/abastecimentos/${abastecimentoId}`)).data,
    retry: 1
  });

  const { data: usuarios = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    staleTime: 1000 * 60 * 5
  });

  const { data: veiculos = [] } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: async () => (await api.get('/veiculos')).data,
    staleTime: 1000 * 60 * 5
  });

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: async () => (await api.get('/produtos')).data,
    staleTime: 1000 * 60 * 30
  });

  const { data: fornecedores = [] } = useQuery<Fornecedor[]>({
    queryKey: ['fornecedores'],
    queryFn: async () => (await api.get('/fornecedores')).data,
    staleTime: 1000 * 60 * 30
  });

  // Filtros de Negócio
  const produtosCombustivel = produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo));
  const fornecedoresPosto = fornecedores.filter(f => f.tipo === 'POSTO');
  const motoristas = usuarios.filter(u => ['OPERADOR', 'ENCARREGADO'].includes(u.role));

  // 2. Form Setup
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormInput, any, EditFormOutput>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur'
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const itensWatch = useWatch({ control, name: "itens" });

  const totalGeral = itensWatch?.reduce((acc, item) =>
    acc + (Number(item.quantidade || 0) * Number(item.valorPorUnidade || 0)), 0
  ) || 0;

  // 3. Populate Form
  useEffect(() => {
    if (abastecimento) {
      reset({
        veiculoId: abastecimento.veiculoId || (abastecimento.veiculo as any)?.id,
        operadorId: (abastecimento as any).operadorId || usuarios.find(u => u.nome === abastecimento.operador?.nome)?.id || '',
        fornecedorId: (abastecimento as any).fornecedorId || fornecedores.find(f => f.nome === abastecimento.fornecedor?.nome)?.id || '',
        kmOdometro: abastecimento.kmOdometro,
        dataHora: new Date(abastecimento.dataHora).toISOString().slice(0, 16),
        placaCartaoUsado: abastecimento.placaCartaoUsado || '',
        justificativa: abastecimento.justificativa || '',
        itens: abastecimento.itens?.map(i => ({
          produtoId: (i as any).produtoId || i.produto?.id,
          quantidade: i.quantidade,
          valorPorUnidade: (i as any).valorPorUnidade || ((i.produto as any)?.valorAtual || 0)
        })) || []
      });
    }
  }, [abastecimento, usuarios, fornecedores, reset]);

  // 4. Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormOutput) => {
      await api.put(`/abastecimentos/${abastecimentoId}`, {
        ...data,
        dataHora: new Date(data.dataHora).toISOString(),
        itens: data.itens.map(i => ({
          produtoId: i.produtoId,
          quantidade: Number(i.quantidade),
          valorPorUnidade: Number(i.valorPorUnidade)
        }))
      });
    },
    onSuccess: () => {
      toast.success("Registro atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimento', abastecimentoId] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao salvar alterações.");
    }
  });

  // Estilos padronizados
  const labelStyle = "flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background appearance-none";

  if (loadingAbs) return (
    <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-surface rounded-xl border border-border h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-text-muted animate-pulse">Carregando dados...</p>
    </div>
  );

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Editar Abastecimento</h3>
          <p className="text-xs text-text-secondary">Correção de lançamento de combustível.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Fuel className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* GRUPO 1: CONTEXTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelStyle}><Truck className="w-3 h-3"/> Veículo</label>
              <div className="relative">
                <select className={selectStyle} {...register('veiculoId')} disabled={isSubmitting}>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.veiculoId && <p className="text-[10px] text-error mt-1 ml-1">{errors.veiculoId.message}</p>}
            </div>

            <div>
              <label className={labelStyle}><UserIcon className="w-3 h-3"/> Motorista</label>
              <div className="relative">
                <select className={selectStyle} {...register('operadorId')} disabled={isSubmitting}>
                  <option value="">Selecione...</option>
                  {motoristas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelStyle}><MapPin className="w-3 h-3"/> Fornecedor</label>
              <div className="relative">
                <select className={selectStyle} {...register('fornecedorId')} disabled={isSubmitting}>
                  {fornecedoresPosto.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <Input
                label="KM Odômetro"
                type="number"
                {...register('kmOdometro')}
                error={errors.kmOdometro?.message}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className={labelStyle}><Calendar className="w-3 h-3"/> Data e Hora</label>
              <Input
                type="datetime-local"
                {...register('dataHora')}
                error={errors.dataHora?.message}
                disabled={isSubmitting}
                containerClassName="!mb-0"
              />
            </div>

            <div>
              <label className={labelStyle}><CreditCard className="w-3 h-3"/> Cartão (Final)</label>
              <Input
                maxLength={4}
                placeholder="Ex: 1234"
                {...register('placaCartaoUsado')}
                disabled={isSubmitting}
                containerClassName="!mb-0"
              />
            </div>
          </div>

          {/* GRUPO 2: ITENS */}
          <div className="bg-background rounded-xl border border-border p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Produtos / Combustível</label>
              <span className="bg-surface border border-border px-3 py-1 rounded-lg text-xs font-mono font-bold text-primary shadow-sm">
                Total: R$ {totalGeral.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-surface p-3 rounded-xl border border-border shadow-sm relative group hover:border-primary/30 transition-all">

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 bg-surface text-text-muted hover:text-error rounded-full w-6 h-6 border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Produto</label>
                    <div className="relative">
                        <select
                        className="w-full text-xs h-10 px-2 bg-surface border border-border rounded-lg outline-none focus:border-primary text-text-main appearance-none"
                        {...register(`itens.${index}.produtoId`)}
                        disabled={isSubmitting}
                        >
                        {produtosCombustivel.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </div>
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Litros</label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`itens.${index}.quantidade`)}
                      className="!h-10 !text-xs bg-surface"
                      disabled={isSubmitting}
                      containerClassName="!mb-0"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Valor Unit. (R$)</label>
                    <Input
                      type="number"
                      step="0.001"
                      {...register(`itens.${index}.valorPorUnidade`)}
                      className="!h-10 !text-xs font-mono text-right bg-surface"
                      placeholder="0.000"
                      disabled={isSubmitting}
                      containerClassName="!mb-0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ produtoId: '', quantidade: 0, valorPorUnidade: 0 })}
              disabled={isSubmitting}
              className="w-full mt-3 py-2 border border-dashed border-border rounded-lg text-xs text-text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Adicionar Outro Item
            </button>
          </div>

          {/* JUSTIFICATIVA */}
          <div>
            <label className={labelStyle}>Justificativa da Edição (Opcional)</label>
            <textarea
              {...register('justificativa')}
              disabled={isSubmitting}
              className="w-full p-3 text-sm bg-surface border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none h-20 placeholder:text-text-muted transition-all disabled:bg-background text-text-main"
              placeholder="Por que este registro está sendo alterado?"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 p-4 border-t border-border bg-background shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-[2] shadow-button hover:shadow-float"
            icon={<Save className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}