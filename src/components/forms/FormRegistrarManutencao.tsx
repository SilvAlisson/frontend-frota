import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { ModalGerenciarServicos } from '../ModalGerenciarServicos';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { parseDecimal, formatKmVisual } from '../../utils';
import { toast } from 'sonner';
import type { Veiculo, Produto, Fornecedor } from '../../types';

// --- TIPOS E CONSTANTES ---
const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

// Interface forte para o payload
interface PayloadOrdemServico {
  tipo: string;
  veiculoId: string | null;
  fornecedorId: string;
  kmAtual: number | null;
  data: string;
  observacoes: string;
  itens: { produtoId: string; quantidade: number; valorPorUnidade: number }[];
}

// --- SCHEMA ZOD ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),
  numeroCA: z.string().optional(),
  fornecedorId: z.string({ error: "Fornecedor obrigatório" }).min(1, "Selecione o fornecedor"),
  data: z.string({ error: "Data obrigatória" }).min(1, "Data inválida"),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string({ error: "Item obrigatório" }).min(1, "Selecione o serviço/peça"),
    // Coerce converte string do input para number
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorPorUnidade: z.coerce.number().min(0, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item à OS")
}).superRefine((data, ctx) => {
  if (data.alvo === 'VEICULO' && !data.veiculoId) {
    ctx.addIssue({ code: "custom", message: "Selecione o veículo", path: ["veiculoId"] });
  }
  if (data.alvo === 'OUTROS' && !data.numeroCA) {
    ctx.addIssue({ code: "custom", message: "Informe o nº do CA", path: ["numeroCA"] });
  }
});

// Tipagem Segura (Input vs Output)
type ManutencaoFormInput = z.input<typeof manutencaoSchema>;
type ManutencaoFormOutput = z.output<typeof manutencaoSchema>;

interface FormRegistrarManutencaoProps {
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  onSuccess?: () => void;
}

// --- COMPONENTE VISUAL: STEPPER ---
const Stepper = ({ current, steps }: { current: number, steps: string[] }) => (
  <div className="flex justify-between items-center mb-8 px-2">
    {steps.map((label, index) => {
      const stepNum = index + 1;
      const isActive = stepNum === current;
      const isCompleted = stepNum < current;

      return (
        <div key={stepNum} className="flex flex-col items-center relative z-10 w-1/3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
            ${isActive ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-110' :
              isCompleted ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400 border-gray-200'}
          `}>
            {isCompleted ? '✓' : stepNum}
          </div>
          <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            {label}
          </span>
          {/* Linha de Conexão */}
          {index !== steps.length - 1 && (
            <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 transition-colors duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`} />
          )}
        </div>
      );
    })}
  </div>
);

export function FormRegistrarManutencao({
  veiculos,
  produtos,
  fornecedores,
  onSuccess
}: FormRegistrarManutencaoProps) {

  const [step, setStep] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalServicosOpen, setModalServicosOpen] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<PayloadOrdemServico | null>(null);

  // Estados Lógicos
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);
  const [abaAtiva, setAbaAtiva] = useState<TipoManutencao>('CORRETIVA');
  const [listaProdutos, setListaProdutos] = useState<Produto[]>(produtos);

  useEffect(() => { setListaProdutos(produtos); }, [produtos]);

  // Filtros Otimizados
  const produtosManutencao = useMemo(() =>
    listaProdutos.filter(p => !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo)),
    [listaProdutos]);

  const fornecedoresFiltrados = useMemo(() =>
    fornecedores.filter(f => {
      if (abaAtiva === 'CORRETIVA') return !['POSTO', 'LAVA_JATO'].includes(f.tipo);
      return true;
    }),
    [fornecedores, abaAtiva]);

  // [CORREÇÃO] Tipagem completa do useForm <Input, Context, Output>
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ManutencaoFormInput, any, ManutencaoFormOutput>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      alvo: 'VEICULO',
      tipo: 'CORRETIVA',
      data: new Date().toISOString().slice(0, 10),
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    },
    mode: 'onBlur'
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const handleTrocaAba = (novaAba: TipoManutencao) => {
    setAbaAtiva(novaAba);
    setValue('tipo', novaAba);
    setValue('fornecedorId', '');
  };

  const alvoSelecionado = watch('alvo');
  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens');

  // Busca de KM Segura
  useEffect(() => {
    let isMounted = true;
    if (alvoSelecionado !== 'VEICULO' || !veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }
    const fetchInfoVeiculo = async () => {
      try {
        setUltimoKmRegistrado(0);
        const { data } = await api.get<Veiculo>(`/veiculos/${veiculoIdSelecionado}`);
        if (isMounted) setUltimoKmRegistrado(data.ultimoKm || 0);
      } catch (err) {
        console.error("Erro ao buscar KM:", err);
      }
    };
    fetchInfoVeiculo();
    return () => { isMounted = false; };
  }, [veiculoIdSelecionado, alvoSelecionado]);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  // Navegação
  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await trigger(['alvo', 'veiculoId', 'fornecedorId', 'data', 'kmAtual', 'numeroCA', 'tipo']);
    else if (step === 2) isValid = await trigger('itens');
    if (isValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  // Submit (Recebe 'data' já tipado e convertido pelo Zod)
  const onValidSubmit = async (data: ManutencaoFormOutput) => {
    let kmInputFloat = null;
    if (data.alvo === 'VEICULO' && data.kmAtual) {
      kmInputFloat = parseDecimal(data.kmAtual);
      if (kmInputFloat < ultimoKmRegistrado && ultimoKmRegistrado > 0) {
        toast.warning(`Nota: KM informado é menor que o último (${ultimoKmRegistrado}).`);
      }
    }

    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    // Payload final
    const payloadFinal: PayloadOrdemServico = {
      tipo: data.tipo,
      veiculoId: data.alvo === 'VEICULO' ? (data.veiculoId || null) : null,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data + 'T12:00:00').toISOString(),
      observacoes: obsFinal,
      itens: data.itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade, // Já é number graças ao Zod Output
        valorPorUnidade: item.valorPorUnidade // Já é number
      }))
    };

    setFormDataParaModal(payloadFinal);
    setModalAberto(true);
  };

  const handleModalSuccess = () => {
    toast.success('Ordem de Serviço registrada!');
    setModalAberto(false);
    setFormDataParaModal(null);
    reset({
      alvo: 'VEICULO',
      veiculoId: '',
      fornecedorId: '',
      kmAtual: '',
      numeroCA: '',
      data: new Date().toISOString().slice(0, 10),
      tipo: abaAtiva,
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    });
    setUltimoKmRegistrado(0);
    setStep(1);
    if (onSuccess) onSuccess();
  };

  const totalGeral = useMemo(() => (itensObservados || []).reduce((acc, item) => {
    return acc + ((Number(item.quantidade) || 0) * (Number(item.valorPorUnidade) || 0));
  }, 0), [itensObservados]);

  // Estilos
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-white border border-border rounded-input text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none text-gray-900 font-medium disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-card border border-border w-full animate-in fade-in duration-500">

        {/* TABS DE TIPO */}
        <div className="flex mb-8 bg-background p-1 rounded-xl border border-border">
          {['CORRETIVA', 'PREVENTIVA'].map(tipo => (
            <button
              key={tipo}
              type="button"
              disabled={isSubmitting} // [SEGURANÇA] Bloqueio
              onClick={() => handleTrocaAba(tipo as TipoManutencao)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 ${abaAtiva === tipo ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tipo}
            </button>
          ))}
        </div>

        <Stepper current={step} steps={['Contexto', 'Serviços', 'Revisão']} />

        <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

          {/* --- PASSO 1: CONTEXTO --- */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">

              <div className="flex gap-4">
                {['VEICULO', 'OUTROS'].map(alvo => (
                  <label key={alvo} className={`flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors flex-1 ${isSubmitting ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      value={alvo}
                      {...register('alvo')}
                      disabled={isSubmitting}
                      onClick={() => !isSubmitting && setValue('alvo', alvo as any)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">{alvo === 'VEICULO' ? 'Veículo' : 'Equipamento/Caixa'}</span>
                  </label>
                ))}
              </div>

              {alvoSelecionado === 'VEICULO' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Veículo</label>
                    <select {...register("veiculoId")} className={selectStyle} disabled={isSubmitting}>
                      <option value="">Selecione...</option>
                      {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                    </select>
                    {errors.veiculoId && <span className="text-xs text-red-500 mt-1 block">{errors.veiculoId.message}</span>}
                  </div>
                  <div>
                    <label className={labelStyle}>KM Atual</label>
                    <Input
                      {...register("kmAtual")}
                      onChange={(e) => { register("kmAtual").onChange(e); handleKmChange(e); }}
                      placeholder={ultimoKmRegistrado > 0 ? `Ref: ${ultimoKmRegistrado}` : "0"}
                      error={errors.kmAtual?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={labelStyle}>Identificação (CA)</label>
                  <Input {...register("numeroCA")} placeholder="Nº do CA ou Série" error={errors.numeroCA?.message} autoFocus disabled={isSubmitting} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Oficina / Fornecedor</label>
                  <select {...register("fornecedorId")} className={selectStyle} disabled={isSubmitting}>
                    <option value="">Selecione...</option>
                    {fornecedoresFiltrados.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                  {errors.fornecedorId && <span className="text-xs text-red-500 mt-1 block">{errors.fornecedorId.message}</span>}
                </div>
                <div>
                  <label className={labelStyle}>Data</label>
                  <Input type="date" {...register("data")} error={errors.data?.message} disabled={isSubmitting} />
                </div>
              </div>
            </div>
          )}

          {/* --- PASSO 2: ITENS --- */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-700">Lista de Serviços</h4>
                <button
                  type="button"
                  onClick={() => setModalServicosOpen(true)}
                  disabled={isSubmitting}
                  className="text-xs text-primary font-bold hover:underline disabled:opacity-50"
                >
                  + Novo Item no Catálogo
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-2 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                {fields.map((field, index) => {
                  const errItem = errors.itens?.[index];
                  return (
                    <div key={field.id} className="bg-white p-3 rounded-lg border border-border shadow-sm relative group">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={isSubmitting}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:hidden"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                      )}

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Item</label>
                          <select
                            {...register(`itens.${index}.produtoId`)}
                            disabled={isSubmitting}
                            className={`w-full text-xs p-2 bg-gray-50 border rounded focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 ${errItem?.produtoId ? 'border-red-300' : 'border-border'}`}
                          >
                            <option value="">Selecione...</option>
                            {produtosManutencao.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-gray-400 uppercase text-center block">Qtd</label>
                          <input
                            type="number" step="0.1"
                            {...register(`itens.${index}.quantidade`)}
                            disabled={isSubmitting}
                            className="w-full text-xs p-2 text-center border border-border rounded focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="text-[9px] font-bold text-gray-400 uppercase text-right block">Valor (Unit)</label>
                          <input
                            type="number" step="0.01"
                            {...register(`itens.${index}.valorPorUnidade`)}
                            disabled={isSubmitting}
                            className="w-full text-xs p-2 text-right border border-border rounded focus:ring-1 focus:ring-primary outline-none font-mono disabled:bg-gray-100"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      {(errItem?.produtoId || errItem?.quantidade || errItem?.valorPorUnidade) && <span className="text-[9px] text-red-500 block mt-1 text-center">Preencha todos os campos</span>}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
                disabled={isSubmitting}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-gray-400 text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                + Adicionar Outro Item
              </button>

              <div className="flex justify-end items-center gap-2 pt-2">
                <span className="text-xs text-gray-400 uppercase font-bold">Subtotal Estimado:</span>
                <span className="text-lg font-mono font-bold text-gray-900">R$ {totalGeral.toFixed(2)}</span>
              </div>
              {errors.itens && <p className="text-xs text-red-500 font-medium text-right">{errors.itens.root?.message || "Adicione itens válidos"}</p>}
            </div>
          )}

          {/* --- PASSO 3: CONFIRMAÇÃO --- */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase">Total da Nota</span>
                  <span className="text-3xl font-mono font-bold text-primary">R$ {totalGeral.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400 text-right">Confira os valores antes de salvar.</p>
              </div>

              <div>
                <label className={labelStyle}>Observações Gerais</label>
                <textarea
                  {...register("observacoes")}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 text-sm bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none min-h-[100px] disabled:bg-gray-50"
                  placeholder="Descreva detalhes adicionais, problemas encontrados..."
                />
              </div>
            </div>
          )}

          {/* NAVEGAÇÃO */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep} className="flex-1" disabled={isSubmitting}>
                Voltar
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" variant="primary" onClick={nextStep} className="flex-[2]" disabled={isSubmitting}>
                Próximo
              </Button>
            ) : (
              <Button type="submit" variant="success" isLoading={isSubmitting} className="flex-[2] shadow-lg shadow-green-500/20" disabled={isSubmitting}>
                Finalizar OS
              </Button>
            )}
          </div>

        </form>
      </div>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo={`Comprovante - ${formDataParaModal.tipo}`}
          dadosJornada={formDataParaModal}
          apiEndpoint="/ordens-servico"
          apiMethod="POST"
          kmParaConfirmar={null}
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalServicosOpen && (
        <ModalGerenciarServicos
          onClose={() => setModalServicosOpen(false)}
          onItemAdded={(novoItem) => setListaProdutos(prev => [...prev, novoItem].sort((a, b) => a.nome.localeCompare(b.nome)))}
        />
      )}
    </>
  );
}