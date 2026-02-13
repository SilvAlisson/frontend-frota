import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Fuel, User, MapPin, Calendar, Gauge, DollarSign,
  Droplets, ChevronRight, ChevronLeft, Check, X, Plus
} from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';

// --- UTILS & HOOKS ---
import { formatKmVisual, parseKmInteligente, formatCurrency } from '../../utils'; 
import { useDashboardData } from '../../hooks/useDashboardData';
import type { Veiculo, Fornecedor, Produto, User as UserType } from '../../types';

// --- SCHEMA ZOD ---
const abastecimentoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione o veículo"),
  operadorId: z.string().min(1, "Selecione o motorista"),
  fornecedorId: z.string().min(1, "Selecione o posto"),
  kmAtual: z.string().min(1, "KM Obrigatório"),
  dataHora: z.string(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o produto"),
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorUnitario: z.coerce.number().min(0.01, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
});

type FormInput = z.input<typeof abastecimentoSchema>;

// Interface Payload
interface AbastecimentoPayload {
  veiculoId: string;
  operadorId: string;
  fornecedorId: string;
  kmOdometro: number;
  dataHora: string;
  itens: {
    produtoId: string;
    quantidade: number;
    valorTotal: number;
    valorPorUnidade: number;
  }[];
}

interface FormRegistrarAbastecimentoProps {
  veiculos?: Veiculo[];
  usuarios?: UserType[];
  produtos?: Produto[];
  fornecedores?: Fornecedor[];
  usuarioLogado?: UserType;
  veiculoPreSelecionadoId?: string;
  onSuccess?: () => void;
  onCancelar: () => void;
}

export function FormRegistrarAbastecimento({
  veiculos: propsVeiculos,
  usuarios: propsUsuarios,
  produtos: propsProdutos,
  fornecedores: propsFornecedores,
  usuarioLogado,
  veiculoPreSelecionadoId,
  onCancelar,
  onSuccess
}: FormRegistrarAbastecimentoProps) {

  const { data: dadosCache, isLoading: isLoadingDados } = useDashboardData();

  const veiculos = propsVeiculos?.length ? propsVeiculos : (dadosCache?.veiculos || []);
  const usuarios = propsUsuarios?.length ? propsUsuarios : (dadosCache?.usuarios || []);
  const produtos = propsProdutos?.length ? propsProdutos : (dadosCache?.produtos || []);
  const fornecedores = propsFornecedores?.length ? propsFornecedores : (dadosCache?.fornecedores || []);

  const [step, setStep] = useState(1);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [payload, setPayload] = useState<AbastecimentoPayload | null>(null);
  const [ultimoKm, setUltimoKm] = useState(0);

  // Filtros
  const operadorOptions = useMemo(() =>
    usuarios.filter(u => u.role === 'OPERADOR').map(u => ({ value: u.id, label: u.nome })),
    [usuarios]);

  const postoOptions = useMemo(() =>
    fornecedores.filter(f => f.tipo === 'POSTO').map(f => ({ value: f.id, label: f.nome })),
    [fornecedores]);

  const produtoOptions = useMemo(() =>
    produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo)).map(p => ({ value: p.id, label: p.nome })),
    [produtos]);

  const veiculoOptions = useMemo(() =>
    veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
    [veiculos]);

  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      veiculoId: veiculoPreSelecionadoId || '',
      operadorId: (usuarioLogado?.role === 'OPERADOR' ? usuarioLogado.id : ''),
      dataHora: new Date().toISOString().slice(0, 16),
      itens: [{ produtoId: '', quantidade: 0, valorUnitario: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens') || [];

  // Automação Combustível
  useEffect(() => {
    if (veiculoIdSelecionado) {
      const v = veiculos.find(v => v.id === veiculoIdSelecionado);
      if (v) {
        setUltimoKm(v.ultimoKm || 0);
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

  // Total Geral
  const totalGeral = useMemo(() =>
    itensObservados.reduce((acc, item) => {
      const qtd = Number(item?.quantidade) || 0;
      const unit = Number(item?.valorUnitario) || 0;
      return acc + (qtd * unit);
    }, 0)
  , [itensObservados]);

  // Navegação
  const nextStep = async () => {
    const fieldsByStep: Record<number, (keyof FormInput)[]> = {
      1: ['veiculoId', 'operadorId', 'kmAtual', 'dataHora'],
      2: ['fornecedorId', 'itens']
    };
    const isValid = await trigger(fieldsByStep[step]);
    if (isValid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormInput) => {
    const kmInputFloat = parseKmInteligente(data.kmAtual, ultimoKm);

    if (kmInputFloat < ultimoKm) {
      toast.warning(`Atenção: KM informado (${kmInputFloat.toLocaleString()}) é menor que o anterior (${ultimoKm.toLocaleString()}).`);
    }

    const payloadFinal: AbastecimentoPayload = {
      veiculoId: data.veiculoId,
      operadorId: data.operadorId,
      fornecedorId: data.fornecedorId,
      kmOdometro: kmInputFloat,
      dataHora: new Date(data.dataHora).toISOString(),
      itens: data.itens.map(i => {
        const qtd = Number(i.quantidade);
        const unit = Number(i.valorUnitario);
        const total = Number((qtd * unit).toFixed(2)); 
        
        return {
          produtoId: i.produtoId,
          quantidade: qtd,
          valorTotal: total,
          valorPorUnidade: unit
        };
      })
    };

    setPayload(payloadFinal);
    setModalConfirmacao(true);
  };

  const isLocked = isSubmitting || isLoadingDados;

  return (
    <div className="flex flex-col h-full bg-surface">

      {/* HEADER PROGRESSO */}
      <div className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-main">Novo Abastecimento</h3>
            <p className="text-xs text-text-secondary font-medium">Etapa {step} de 3</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">

          {/* --- PASSO 1: DADOS BÁSICOS --- */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Veículo"
                  options={veiculoOptions}
                  icon={<Fuel className="w-4 h-4" />}
                  {...register('veiculoId')}
                  error={errors.veiculoId?.message}
                  containerClassName="md:col-span-2"
                  disabled={isLocked}
                />

                <Select
                  label="Motorista"
                  options={operadorOptions}
                  icon={<User className="w-4 h-4" />}
                  {...register('operadorId')}
                  error={errors.operadorId?.message}
                  containerClassName="md:col-span-2"
                  disabled={isLocked}
                />

                <div>
                  <Input
                    label="KM Atual"
                    icon={<Gauge className="w-4 h-4" />}
                    {...register('kmAtual')}
                    onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
                    placeholder={ultimoKm > 0 ? `Ref: ${ultimoKm}` : "0"}
                    error={errors.kmAtual?.message}
                    disabled={isLocked}
                  />
                  {ultimoKm > 0 && (
                    <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1 bg-primary/5 p-1.5 rounded-lg w-fit px-2 border border-primary/10">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      Anterior: {ultimoKm.toLocaleString()} KM
                    </p>
                  )}
                </div>

                <Input
                  label="Data e Hora"
                  type="datetime-local"
                  icon={<Calendar className="w-4 h-4" />}
                  {...register('dataHora')}
                  error={errors.dataHora?.message}
                  disabled={isLocked}
                />
              </div>
            </div>
          )}

          {/* --- PASSO 2: ITENS --- */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
              <Select
                label="Posto de Combustível"
                options={postoOptions}
                icon={<MapPin className="w-4 h-4" />}
                {...register('fornecedorId')}
                error={errors.fornecedorId?.message}
                disabled={isLocked}
              />

              <div className="pt-2">
                <div className="flex justify-between items-center mb-3 ml-1">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Itens</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => append({ produtoId: '', quantidade: 0, valorUnitario: 0 })}
                    className="text-primary hover:bg-primary/10 h-8"
                    disabled={isLocked}
                    icon={<Plus className="w-3 h-3" />}
                  >
                    Adicionar Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const qtd = Number(watch(`itens.${index}.quantidade`)) || 0;
                    const unit = Number(watch(`itens.${index}.valorUnitario`)) || 0;
                    const totalItem = (qtd * unit).toFixed(2);

                    return (
                      <Card 
                        key={field.id} 
                        padding="sm" 
                        variant="outline" 
                        className="relative group bg-gray-50/50 dark:bg-gray-800/50 border-dashed hover:border-solid hover:border-primary/30 transition-colors"
                      >
                        {fields.length > 1 && (
                          <div className="absolute -top-2 -right-2 z-10">
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={isLocked}
                                className="h-6 w-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-12 sm:col-span-6">
                            <Select
                              label="Produto"
                              options={produtoOptions}
                              {...register(`itens.${index}.produtoId`)}
                              className="bg-white dark:bg-gray-900 h-9 text-xs"
                              disabled={isLocked}
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <Input
                              label="Qtd (L)"
                              type="number"
                              step="0.001"
                              icon={<Droplets className="w-3 h-3 text-sky-500" />}
                              {...register(`itens.${index}.quantidade`)}
                              className="bg-white dark:bg-gray-900 h-9 text-xs text-center"
                              disabled={isLocked}
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <Input
                              label="Unitário R$"
                              type="number"
                              step="0.001"
                              {...register(`itens.${index}.valorUnitario`)}
                              className="bg-white dark:bg-gray-900 h-9 text-xs text-right font-bold text-text-main"
                              disabled={isLocked}
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex justify-end">
                          <div className="bg-white dark:bg-gray-900 px-3 py-1 rounded-md border border-border shadow-sm text-xs font-medium text-text-secondary flex gap-2">
                            <span>Total Item:</span>
                            <span className="font-bold text-text-main">R$ {totalItem}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* --- PASSO 3: CONFIRMAÇÃO --- */}
          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300 py-4">
              <Card variant="solid" className="bg-gray-900 dark:bg-black text-white border-transparent text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <DollarSign className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 py-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Valor Total Estimado</p>
                  <p className="text-4xl sm:text-5xl font-mono font-black tracking-tight truncate">
                    {formatCurrency(totalGeral)}
                  </p>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card variant="outline" padding="sm" className="text-center bg-gray-50/50">
                  <p className="text-xs text-text-muted font-bold uppercase mb-1">Veículo</p>
                  <p className="font-bold text-text-main text-sm truncate">
                    {veiculos.find(v => v.id === veiculoIdSelecionado)?.placa || '---'}
                  </p>
                </Card>
                <Card variant="outline" padding="sm" className="text-center bg-gray-50/50">
                  <p className="text-xs text-text-muted font-bold uppercase mb-1">Odômetro Final</p>
                  <p className="font-bold text-text-main text-sm">{watch('kmAtual')} KM</p>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-border bg-gray-50/30 flex gap-3 shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(s => s - 1)}
              className="flex-1"
              icon={<ChevronLeft className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancelar}
              className="flex-1 text-text-secondary hover:text-text-main"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex-[2]"
              icon={<ChevronRight className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:shadow-lg hover:shadow-emerald-500/20"
              icon={<Check className="w-4 h-4" />}
            >
              Confirmar
            </Button>
          )}
        </div>
      </form>

      {/* MODAL DE FOTO */}
      {modalConfirmacao && payload && (
        <ModalConfirmacaoFoto
          titulo="Comprovante de Abastecimento"
          dadosJornada={payload}
          kmParaConfirmar={payload.kmOdometro}
          jornadaId={payload.veiculoId}
          apiEndpoint="/abastecimentos"
          apiMethod="POST"
          onClose={() => setModalConfirmacao(false)}
          onSuccess={() => {
            toast.success("Abastecimento registrado com sucesso!");
            onSuccess?.();
            onCancelar();
          }}
        />
      )}
    </div>
  );
}