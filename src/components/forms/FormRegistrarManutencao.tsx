import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import {
  Wrench, Truck, Calendar, Gauge,
  Plus, Trash2, ChevronRight, ChevronLeft, Check,
  AlertTriangle, DollarSign, Package
} from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card'; // ✅ Novo Componente
import { Badge } from '../ui/Badge';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { ModalGerenciarServicos } from '../ModalGerenciarServicos';

// --- UTILS & HOOKS ---
import { parseDecimal, formatKmVisual, formatCurrency } from '../../utils';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { Veiculo, Produto, Fornecedor } from '../../types';

// --- CONSTANTES ---
const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

// --- SCHEMA ZOD ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),
  numeroCA: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),

  fornecedorId: z.string().min(1, "Selecione o fornecedor"),
  data: z.string().min(1, "Data é obrigatória"),
  
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o serviço/peça"),
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorPorUnidade: z.coerce.number().min(0, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
}).superRefine((data, ctx) => {
  if (data.alvo === 'VEICULO' && !data.veiculoId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o veículo", path: ["veiculoId"] });
  }
  if (data.alvo === 'OUTROS' && !data.numeroCA) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nº do CA/Série", path: ["numeroCA"] });
  }
});

type ManutencaoFormInput = z.input<typeof manutencaoSchema>;
type ManutencaoFormOutput = z.output<typeof manutencaoSchema>;

interface PayloadOrdemServico {
  tipo: string;
  veiculoId: string | null;
  fornecedorId: string;
  kmAtual: number | null;
  data: string;
  observacoes: string;
  itens: { produtoId: string; quantidade: number; valorPorUnidade: number }[];
}

interface FormRegistrarManutencaoProps {
  veiculos?: Veiculo[];
  produtos?: Produto[];
  fornecedores?: Fornecedor[];
  onSuccess?: () => void;
  onClose?: () => void;
}

export function FormRegistrarManutencao({
  veiculos: propsVeiculos,
  produtos: propsProdutos,
  fornecedores: propsFornecedores,
  onSuccess,
  onClose
}: FormRegistrarManutencaoProps) {

  const { data: dadosCache, isLoading: isLoadingDados } = useDashboardData();

  const veiculos = propsVeiculos?.length ? propsVeiculos : (dadosCache?.veiculos || []);
  const produtos = propsProdutos?.length ? propsProdutos : (dadosCache?.produtos || []);
  const fornecedores = propsFornecedores?.length ? propsFornecedores : (dadosCache?.fornecedores || []);

  const [step, setStep] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalServicosOpen, setModalServicosOpen] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<PayloadOrdemServico | null>(null);
  
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);
  const [listaProdutos, setListaProdutos] = useState<Produto[]>(produtos);

  useEffect(() => {
    if (produtos.length > 0) setListaProdutos(produtos);
  }, [produtos]);

  const { register, control, handleSubmit, watch, setValue, trigger, reset, formState: { errors, isSubmitting } } = useForm<ManutencaoFormInput, any, ManutencaoFormOutput>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      alvo: 'VEICULO',
      tipo: 'CORRETIVA',
      data: new Date().toISOString().slice(0, 10),
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  // --- WATCHERS ---
  const alvoSelecionado = watch('alvo');
  const tipoManutencao = watch('tipo');
  const veiculoIdSelecionado = watch('veiculoId');
  const fornecedorIdSelecionado = watch('fornecedorId');
  const itensObservados = watch('itens');

  // --- MEMOS ---
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

  const fornecedoresOpcoes = useMemo(() => 
    fornecedores.filter(f => {
        if (['OFICINA', 'MECANICA', 'OUTRO'].includes(f.tipo)) return true;
        if (['LAVA_JATO', 'POSTO'].includes(f.tipo)) return tipoManutencao === 'PREVENTIVA';
        return false;
      }).map(f => ({ value: f.id, label: f.nome })),
    [fornecedores, tipoManutencao]
  );

  const veiculosOpcoes = useMemo(() => 
    veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
    [veiculos]
  );

  const produtosOpcoes = useMemo(() => 
    produtosDisponiveis.map(p => ({ value: p.id, label: p.nome })),
    [produtosDisponiveis]
  );

  // --- EFEITO KM ---
  useEffect(() => {
    let isMounted = true;
    if (alvoSelecionado !== 'VEICULO' || !veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }
    const fetchInfo = async () => {
      try {
        const { data } = await api.get<Veiculo>(`/veiculos/${veiculoIdSelecionado}`);
        if (isMounted) setUltimoKmRegistrado(data.ultimoKm || 0);
      } catch (err) { console.error(err); }
    };
    fetchInfo();
    return () => { isMounted = false; };
  }, [veiculoIdSelecionado, alvoSelecionado]);

  // --- HANDLERS ---
  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await trigger(['alvo', 'veiculoId', 'fornecedorId', 'data', 'kmAtual', 'numeroCA', 'tipo']);
    else if (step === 2) isValid = await trigger('itens');
    
    if (isValid) setStep(s => s + 1);
  };

  const onSubmit = async (data: ManutencaoFormOutput) => {
    let kmInputFloat = null;
    
    if (data.alvo === 'VEICULO' && data.kmAtual) {
      kmInputFloat = parseDecimal(data.kmAtual);
      if (kmInputFloat < ultimoKmRegistrado && ultimoKmRegistrado > 0) {
        toast.warning(`Nota: KM informado (${kmInputFloat}) é menor que o registro anterior (${ultimoKmRegistrado}).`);
      }
    }

    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    const payload: PayloadOrdemServico = {
      tipo: data.tipo,
      veiculoId: data.alvo === 'VEICULO' ? (data.veiculoId || null) : null,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data + 'T12:00:00').toISOString(),
      observacoes: obsFinal,
      itens: data.itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        valorPorUnidade: item.valorPorUnidade
      }))
    };

    setFormDataParaModal(payload);
    setModalAberto(true);
  };

  const handleSuccess = () => {
    toast.success('Ordem de Serviço registrada com sucesso!');
    setModalAberto(false);
    reset({
      alvo: 'VEICULO', veiculoId: '', fornecedorId: '', kmAtual: '', 
      numeroCA: '', data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA', observacoes: '', 
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    });
    setStep(1);
    if (onSuccess) onSuccess();
  };

  const totalGeral = (itensObservados || []).reduce((acc, item) => 
    acc + ((Number(item.quantidade) || 0) * (Number(item.valorPorUnidade) || 0)), 0
  );

  const isLocked = isSubmitting || isLoadingDados;

  return (
    <div className="flex flex-col h-full bg-surface">
      
      {/* HEADER */}
      <div className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-main">Nova Manutenção</h3>
            <p className="text-xs text-text-secondary font-medium">Etapa {step} de 3</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">

          {/* PASSO 1: DADOS GERAIS */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
              
              {/* TIPO DE MANUTENÇÃO */}
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {['CORRETIVA', 'PREVENTIVA'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('tipo', t as TipoManutencao)}
                    className={`
                      py-2 text-xs font-bold rounded-lg transition-all
                      ${tipoManutencao === t 
                        ? 'bg-white text-primary shadow-sm border border-gray-200' 
                        : 'text-text-muted hover:text-text-main'}
                    `}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* ALVO (VEÍCULO OU OUTRO) */}
              <div className="flex gap-4">
                {['VEICULO', 'OUTROS'].map(alvo => (
                  <label key={alvo} className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl w-full transition-all ${alvoSelecionado === alvo ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      value={alvo}
                      {...register('alvo')}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm font-bold text-text-main">
                      {alvo === 'VEICULO' ? 'Veículo da Frota' : 'Outro Equipamento'}
                    </span>
                  </label>
                ))}
              </div>

              {alvoSelecionado === 'VEICULO' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Veículo"
                    options={veiculosOpcoes}
                    icon={<Truck className="w-4 h-4" />}
                    {...register("veiculoId")}
                    error={errors.veiculoId?.message}
                    disabled={isLocked}
                  />
                  <div>
                    <Input
                      label="KM Atual (Opcional)"
                      icon={<Gauge className="w-4 h-4" />}
                      {...register("kmAtual")}
                      onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
                      placeholder={ultimoKmRegistrado > 0 ? `Ref: ${ultimoKmRegistrado}` : "0"}
                      error={errors.kmAtual?.message}
                      disabled={isLocked}
                    />
                    {ultimoKmRegistrado > 0 && (
                      <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1 bg-primary/5 p-1.5 rounded-lg w-fit px-2 border border-primary/10">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        Anterior: {ultimoKmRegistrado.toLocaleString()} KM
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Input 
                  label="Identificação (CA / Série)"
                  {...register("numeroCA")}
                  placeholder="Ex: CA-1234"
                  error={errors.numeroCA?.message}
                  disabled={isLocked}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Oficina / Fornecedor"
                  options={fornecedoresOpcoes}
                  icon={<Wrench className="w-4 h-4" />}
                  {...register("fornecedorId")}
                  error={errors.fornecedorId?.message}
                  disabled={isLocked}
                />
                <Input
                  label="Data do Serviço"
                  type="date"
                  icon={<Calendar className="w-4 h-4" />}
                  {...register("data")}
                  error={errors.data?.message}
                  disabled={isLocked}
                />
              </div>
            </div>
          )}

          {/* PASSO 2: ITENS E SERVIÇOS */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Peças e Serviços</h4>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalServicosOpen(true)}
                  className="text-primary hover:bg-primary/10 h-8"
                  icon={<Plus className="w-3 h-3" />}
                >
                  Novo no Catálogo
                </Button>
              </div>

              {fornecedorIdSelecionado && produtosDisponiveis.length < listaProdutos.length && (
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border border-blue-100">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Mostrando apenas itens deste fornecedor.
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card 
                    key={field.id} 
                    padding="sm" 
                    variant="outline" 
                    className="relative group bg-gray-50/50 border-dashed hover:border-solid hover:border-primary/30 transition-colors"
                  >
                    {fields.length > 1 && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="h-6 w-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-6">
                        <Select
                          label="Item / Serviço"
                          options={produtosOpcoes}
                          {...register(`itens.${index}.produtoId`)}
                          className="bg-white h-9 text-xs"
                          disabled={isLocked}
                          icon={<Package className="w-4 h-4 text-gray-400" />}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          label="Qtd"
                          type="number"
                          step="0.1"
                          {...register(`itens.${index}.quantidade`)}
                          className="bg-white h-9 text-xs text-center"
                          disabled={isLocked}
                        />
                      </div>
                      <div className="col-span-8 sm:col-span-4">
                        <Input
                          label="Valor Unit (R$)"
                          type="number"
                          step="0.01"
                          {...register(`itens.${index}.valorPorUnidade`)}
                          className="bg-white h-9 text-xs text-right font-bold text-text-main"
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
                className="w-full border-dashed border border-border text-xs text-primary hover:bg-primary/5 h-10"
                icon={<Plus className="w-3 h-3" />}
              >
                Adicionar Outro Item
              </Button>

              {errors.itens && <p className="text-xs text-red-500 font-medium text-right">{errors.itens.root?.message}</p>}
            </div>
          )}

          {/* PASSO 3: CONFIRMAÇÃO E VALORES */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 py-2">
              
              <Card variant="solid" className="bg-gray-900 text-white border-transparent text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <DollarSign className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 py-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Total Estimado</p>
                  <p className="text-4xl sm:text-5xl font-mono font-black tracking-tight truncate">
                    {formatCurrency(totalGeral)}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Badge variant={tipoManutencao === 'PREVENTIVA' ? 'success' : 'warning'}>{tipoManutencao}</Badge>
                    <Badge variant="neutral">{alvoSelecionado === 'VEICULO' ? 'Veículo' : 'Equipamento'}</Badge>
                  </div>
                </div>
              </Card>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1">
                  Observações Gerais
                </label>
                <textarea
                  {...register("observacoes")}
                  className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none min-h-[100px] transition-all text-text-main"
                  placeholder="Descreva o problema, peças trocadas ou detalhes adicionais..."
                  disabled={isLocked}
                />
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
              disabled={isLocked}
            >
              Voltar
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 text-text-secondary hover:text-text-main"
              disabled={isLocked}
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
              disabled={isLocked}
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
              Finalizar OS
            </Button>
          )}
        </div>
      </form>

      {/* MODAL DE FOTO */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo={`OS ${formDataParaModal.tipo}`}
          dadosJornada={formDataParaModal}
          apiEndpoint="/manutencoes"
          apiMethod="POST"
          kmParaConfirmar={null}
          jornadaId={formDataParaModal.veiculoId}
          onClose={() => setModalAberto(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* MODAL NOVO SERVIÇO */}
      {modalServicosOpen && (
        <ModalGerenciarServicos
          onClose={() => setModalServicosOpen(false)}
          onItemAdded={(novoItem) => setListaProdutos(prev => [...prev, novoItem].sort((a, b) => a.nome.localeCompare(b.nome)))}
        />
      )}
    </div>
  );
}