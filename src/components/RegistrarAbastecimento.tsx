import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { formatKmVisual, parseDecimal } from './../utils';
import { toast } from 'sonner';
import {
  Fuel, User, MapPin, Calendar, Gauge, DollarSign,
  Droplet, ChevronRight, ChevronLeft, X, Check
} from 'lucide-react'; // Ícones Padronizados
import type { Veiculo, Fornecedor, Produto, User as UserType } from './../types';

// --- SCHEMA ZOD ---
const abastecimentoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione o veículo"),
  operadorId: z.string().min(1, "Selecione o motorista"),
  fornecedorId: z.string().min(1, "Selecione o posto"),
  kmAtual: z.string().min(1, "KM Obrigatório"),
  dataHora: z.string(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Obrigatório"),
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorTotal: z.coerce.number().min(0.01, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
});

type FormInput = z.input<typeof abastecimentoSchema>;

// Interface de Payload para garantir a integridade entre o Form e o Modal/API
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

interface RegistrarAbastecimentoProps {
  veiculos: Veiculo[];
  usuarios: UserType[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  usuarioLogado?: UserType;
  veiculoPreSelecionadoId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// Estilos padronizados
const selectStyle = "w-full h-11 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer font-medium disabled:bg-gray-50 placeholder:text-gray-400 shadow-sm";
const labelStyle = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

export function RegistrarAbastecimento({
  veiculos,
  usuarios,
  produtos,
  fornecedores,
  usuarioLogado,
  veiculoPreSelecionadoId,
  onClose,
  onSuccess
}: RegistrarAbastecimentoProps) {

  const [step, setStep] = useState(1);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [payload, setPayload] = useState<AbastecimentoPayload | null>(null);
  const [ultimoKm, setUltimoKm] = useState(0);

  const postos = useMemo(() => fornecedores.filter(f => f.tipo === 'POSTO'), [fornecedores]);
  const combustiveis = useMemo(() => produtos.filter(p => p.tipo === 'COMBUSTIVEL' || p.tipo === 'ADITIVO'), [produtos]);

  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      veiculoId: veiculoPreSelecionadoId || '',
      operadorId: usuarioLogado?.id || '',
      dataHora: new Date().toLocaleString('sv-SE').slice(0, 16), // Formato ISO local friendly
      itens: [{ produtoId: '', quantidade: 0, valorTotal: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens') || [];

  // Automação: Troca de Veículo -> Sugere Combustível
  useEffect(() => {
    if (veiculoIdSelecionado) {
      const v = veiculos.find(v => v.id === veiculoIdSelecionado);
      if (v) {
        setUltimoKm(v.ultimoKm || 0);

        // 1. Encontra o combustível ideal para este veículo
        const combustivelPadrao = combustiveis.find(c =>
          v.tipoCombustivel && c.nome.toUpperCase().includes(v.tipoCombustivel.replace('_', ' ').toUpperCase())
        );

        // 2. Verifica o que está selecionado atualmente no formulário
        const itemAtualId = itensObservados[0]?.produtoId;

        if (combustivelPadrao) {
          // LÓGICA CORRIGIDA:
          // Se não houver nada selecionado (!itemAtualId)
          // OU se o item selecionado for diferente do padrão deste veículo
          // -> Atualiza para o correto.
          if (!itemAtualId || itemAtualId !== combustivelPadrao.id) {
            setValue('itens.0.produtoId', combustivelPadrao.id);

            // CORREÇÃO: Removido o setValue de 'valorPorUnidade' pois ele não existe no Schema.
            // Apenas resetamos o total, o unitário visual se ajustará sozinho.
            setValue('itens.0.valorTotal', 0);
          }
        }
      }
    }
  }, [veiculoIdSelecionado, veiculos, combustiveis, setValue]);

  const totalGeral = useMemo(() =>
    itensObservados.reduce((acc, item) => acc + (Number(item?.valorTotal) || 0), 0)
    , [itensObservados]);

  const nextStep = async () => {
    const fieldsByStep: Record<number, (keyof FormInput)[]> = {
      1: ['veiculoId', 'operadorId', 'kmAtual', 'dataHora'],
      2: ['fornecedorId', 'itens']
    };

    const isValid = await trigger(fieldsByStep[step]);
    if (isValid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormInput) => {
    const kmInputFloat = parseDecimal(data.kmAtual);

    if (kmInputFloat < ultimoKm) {
      toast.error(`KM Inválido: O valor não pode ser menor que o último registro (${ultimoKm.toLocaleString()} KM).`);
      return;
    }

    const payloadFinal: AbastecimentoPayload = {
      veiculoId: data.veiculoId,
      operadorId: data.operadorId,
      fornecedorId: data.fornecedorId,
      kmOdometro: kmInputFloat,
      dataHora: new Date(data.dataHora).toISOString(),
      itens: data.itens.map(i => {
        const qtd = Number(i.quantidade);
        const total = Number(i.valorTotal);
        return {
          produtoId: i.produtoId,
          quantidade: qtd,
          valorTotal: total,
          valorPorUnidade: qtd > 0 ? (total / qtd) : 0
        };
      })
    };

    setPayload(payloadFinal);
    setModalConfirmacao(true);
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-2xl border border-border overflow-hidden max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-primary to-teal-600 px-6 py-5 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Novo Abastecimento</h3>
              <p className="text-[10px] opacity-80 font-medium uppercase">Passo {step} de 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="px-8 pt-6 flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary' : 'bg-gray-100'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

          {/* --- PASSO 1: DADOS BÁSICOS --- */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelStyle}>Veículo</label>
                  <div className="relative group">
                    <select {...register('veiculoId')} className={selectStyle}>
                      <option value="">Selecione o veículo...</option>
                      {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <Fuel className="w-4 h-4" />
                    </div>
                  </div>
                  {errors.veiculoId && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.veiculoId.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className={labelStyle}>Motorista / Operador</label>
                  <div className="relative group">
                    <select {...register('operadorId')} className={selectStyle}>
                      <option value="">Selecione o motorista...</option>
                      {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>KM Atual (Odômetro)</label>
                  <div className="relative">
                    <Input
                      {...register('kmAtual')}
                      onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
                      placeholder={ultimoKm > 0 ? `Ref: ${ultimoKm}` : "0"}
                      inputMode="numeric"
                      className="pr-10 font-mono tracking-wider"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>
                  {ultimoKm > 0 && (
                    <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1 bg-primary/5 p-1 rounded w-fit px-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      Anterior: {ultimoKm.toLocaleString()} KM
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelStyle}>Data e Hora</label>
                  <div className="relative">
                    <Input type="datetime-local" {...register('dataHora')} />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- PASSO 2: ITENS E VALORES --- */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className={labelStyle}>Posto de Combustível</label>
                <div className="relative group">
                  <select {...register('fornecedorId')} className={selectStyle}>
                    <option value="">Selecione o posto...</option>
                    {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                {errors.fornecedorId && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.fornecedorId.message}</p>}
              </div>

              <div className="pt-2">
                <p className={labelStyle}>Produtos Selecionados</p>
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {fields.map((field, index) => {
                    const qtd = Number(watch(`itens.${index}.quantidade`)) || 0;
                    const total = Number(watch(`itens.${index}.valorTotal`)) || 0;
                    const unitario = (qtd > 0) ? (total / qtd).toFixed(3) : "0.000";

                    return (
                      <div key={field.id} className="bg-gray-50 p-4 rounded-2xl border border-border group transition-all hover:border-primary/40 hover:shadow-sm">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-12 sm:col-span-5">
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Produto</label>
                            <select {...register(`itens.${index}.produtoId`)} className="w-full text-xs h-10 px-2 bg-white rounded-lg border border-border focus:border-primary outline-none cursor-pointer">
                              <option value="">Selecione...</option>
                              {combustiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                          </div>
                          <div className="col-span-4 sm:col-span-3">
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Qtd (L)</label>
                            <div className="relative">
                              <input
                                type="number" step="0.001"
                                {...register(`itens.${index}.quantidade`)}
                                className="w-full text-xs h-10 px-2 bg-white rounded-lg border border-border text-center focus:border-primary outline-none"
                              />
                              <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center opacity-30">
                                <Droplet className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                          <div className="col-span-5 sm:col-span-3">
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Total R$</label>
                            <div className="relative">
                              <input
                                type="number" step="0.01"
                                {...register(`itens.${index}.valorTotal`)}
                                className="w-full text-xs h-10 px-2 bg-white rounded-lg border border-border text-right font-mono font-bold text-primary focus:border-primary outline-none pr-6"
                              />
                              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-primary/50 text-[10px] font-bold">
                                $
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3 sm:col-span-1 flex items-end justify-center">
                            {fields.length > 1 && (
                              <button type="button" onClick={() => remove(index)} className="h-10 w-10 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center px-1">
                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                            Unitário: <span className="text-gray-600 bg-white px-1 rounded border border-gray-100">R$ {unitario}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button" variant="ghost"
                  onClick={() => append({ produtoId: '', quantidade: 0, valorTotal: 0 })}
                  className="w-full mt-3 border-dashed border-2 text-[10px] font-black uppercase text-primary border-primary/20 hover:bg-primary/5 h-10"
                >
                  + Adicionar Item
                </Button>
              </div>
            </div>
          )}

          {/* --- PASSO 3: RESUMO E CONFIRMAÇÃO --- */}
          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-gray-900 p-8 rounded-3xl text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                  <DollarSign className="w-32 h-32" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 relative z-10">Valor Total da Nota</p>
                <p className="text-5xl font-mono font-black italic relative z-10">
                  R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-4 bg-background rounded-2xl border border-border text-center">
                  <p className={labelStyle}>Veículo</p>
                  <p className="font-black text-gray-700">{veiculos.find(v => v.id === veiculoIdSelecionado)?.placa || '---'}</p>
                </div>
                <div className="p-4 bg-background rounded-2xl border border-border text-center">
                  <p className={labelStyle}>Odômetro Final</p>
                  <p className="font-black text-gray-700">{watch('kmAtual')} KM</p>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1 h-12" icon={<ChevronLeft className="w-4 h-4" />}>
                Voltar
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep} variant="primary" className="flex-[2] h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30" icon={<ChevronRight className="w-4 h-4" />}>
                Próximo Passo
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} className="flex-[2] h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/20" icon={<Check className="w-4 h-4" />}>
                Finalizar e Tirar Foto
              </Button>
            )}
          </div>
        </form>
      </div>

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
            onClose();
          }}
        />
      )}
    </>
  );
}