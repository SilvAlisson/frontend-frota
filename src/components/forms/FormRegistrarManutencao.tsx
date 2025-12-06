import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { parseDecimal, formatKmVisual } from '../../utils';
import { toast } from 'sonner';
import type { Veiculo, Produto, Fornecedor } from '../../types';

// Opções de "Alvo" da manutenção
const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;

// --- 1. SCHEMA ZOD V4 (Inteligente & Condicional) ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]).default('CORRETIVA'),

  alvo: z.enum(ALVOS_MANUTENCAO),

  // Opcionais na definição base, refinados depois
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),

  fornecedorId: z.string({ error: "Fornecedor obrigatório" })
    .min(1, { message: "Selecione a oficina/fornecedor" }),

  data: z.string({ error: "Data obrigatória" })
    .min(1, { message: "Data inválida" }),

  observacoes: z.string().optional(),

  itens: z.array(z.object({
    produtoId: z.string({ error: "Item obrigatório" })
      .min(1, { message: "Selecione o serviço/peça" }),

    quantidade: z.coerce.number()
      .min(0.01, { message: "Qtd inválida" }),

    valorPorUnidade: z.coerce.number()
      .min(0, { message: "Valor inválido" }),
  })).min(1, { message: "Adicione pelo menos um item à OS" })
})
  .superRefine((data, ctx) => {
    if (data.alvo === 'VEICULO') {
      if (!data.veiculoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o veículo",
          path: ["veiculoId"]
        });
      }
      if (!data.kmAtual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o KM atual",
          path: ["kmAtual"]
        });
      }
    }
  });

type ManutencaoFormInput = z.input<typeof manutencaoSchema>;

interface FormRegistrarManutencaoProps {
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
}

export function FormRegistrarManutencao({
  veiculos,
  produtos,
  fornecedores
}: FormRegistrarManutencaoProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  // FILTRO: Remove Combustível e Aditivo (vão no Abastecimento) e Lavagem (se for o caso)
  // Deixa apenas Peças, Serviços e Outros
  const produtosManutencao = produtos.filter(p =>
    !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo)
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ManutencaoFormInput>({
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  const alvoSelecionado = watch('alvo');
  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens');

  useEffect(() => {
    if (alvoSelecionado !== 'VEICULO' || !veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }

    const fetchInfoVeiculo = async () => {
      try {
        const { data } = await api.get<Veiculo>(`/veiculo/${veiculoIdSelecionado}`);
        setUltimoKmRegistrado(data.ultimoKm || 0);
      } catch (err) {
        console.error("Erro ao buscar KM:", err);
      }
    };
    fetchInfoVeiculo();
  }, [veiculoIdSelecionado, alvoSelecionado]);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  const onValidSubmit = async (data: ManutencaoFormInput) => {
    let kmInputFloat = null;

    if (data.alvo === 'VEICULO') {
      kmInputFloat = parseDecimal(data.kmAtual || '0');
      if (kmInputFloat <= ultimoKmRegistrado && ultimoKmRegistrado > 0) {
        toast.warning(`Atenção: O KM informado é menor que o último registrado (${ultimoKmRegistrado.toLocaleString('pt-BR')}).`);
      }
    }

    const payloadFinal = {
      tipo: data.tipo,
      veiculoId: data.alvo === 'VEICULO' ? data.veiculoId : null,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data).toISOString(),
      // Texto de prefixo para Outros
      observacoes: `${data.alvo === 'OUTROS' ? '[Manutenção de Equipamento/Caixa] ' : ''}${data.observacoes || ''}`,
      itens: data.itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        valorPorUnidade: item.valorPorUnidade
      }))
    };

    setFormDataParaModal(payloadFinal);
    setModalAberto(true);
  };

  const handleModalSuccess = () => {
    toast.success('Ordem de Serviço registrada com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);

    reset({
      alvo: 'VEICULO',
      veiculoId: '',
      fornecedorId: '',
      kmAtual: '',
      data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA',
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    });
    setUltimoKmRegistrado(0);
  };

  const totalGeral = (itensObservados || []).reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const val = Number(item.valorPorUnidade) || 0;
    return acc + (qtd * val);
  }, 0);

  return (
    <>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-8 bg-white p-6 rounded-card shadow-card border border-gray-100">

        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-gray-800 mb-2">Nova Ordem de Serviço</h4>
          <p className="text-sm text-text-secondary">Registro de peças e serviços de manutenção.</p>
        </div>

        {/* SELETOR DE ALVO */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setValue('alvo', 'VEICULO')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${alvoSelecionado === 'VEICULO'
              ? 'bg-white shadow text-blue-700'
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Veículo da Frota
          </button>
          <button
            type="button"
            onClick={() => setValue('alvo', 'OUTROS')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${alvoSelecionado === 'OUTROS'
              ? 'bg-white shadow text-blue-700'
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Caixas / Outros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {alvoSelecionado === 'VEICULO' ? (
            <>
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block mb-1.5 text-sm font-medium text-text-secondary">Veículo</label>
                <div className="relative group">
                  <select
                    {...register("veiculoId")}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione...</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                </div>
                {errors.veiculoId && <span className="text-xs text-error mt-1 block">{errors.veiculoId.message}</span>}
                {ultimoKmRegistrado > 0 && <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded">Último: {ultimoKmRegistrado.toLocaleString('pt-BR')} KM</p>}
              </div>

              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block mb-1.5 text-sm font-medium text-text-secondary">KM Atual</label>
                <Input
                  {...register("kmAtual")}
                  onChange={(e) => {
                    register("kmAtual").onChange(e);
                    handleKmChange(e);
                  }}
                  placeholder={ultimoKmRegistrado > 0 ? `> ${ultimoKmRegistrado}` : "Ex: 50.420"}
                  error={errors.kmAtual?.message}
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm flex items-center gap-3 animate-in fade-in">
              <div className="bg-amber-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              </div>
              <div>
                <strong>Manutenção de Caixas/Equipamentos:</strong>
                <p className="text-xs mt-0.5 opacity-90">Descreva qual equipamento/caixa sendo reparado (Ex: Caixa CA 05 enviada para reparo).</p>
              </div>
            </div>
          )}

          <div className={alvoSelecionado === 'OUTROS' ? "" : "md:col-span-2"}>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Oficina / Fornecedor</label>
            <div className="relative group">
              <select {...register("fornecedorId")} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer" disabled={isSubmitting}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
            {errors.fornecedorId && <span className="text-xs text-error mt-1 block">{errors.fornecedorId.message}</span>}
          </div>

          <div className={alvoSelecionado === 'OUTROS' ? "" : "md:col-span-2"}>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Data do Serviço</label>
            <Input type="date" {...register("data")} error={errors.data?.message} disabled={isSubmitting} />
          </div>
        </div>

        {/* LISTA DE ITENS */}
        <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Peças e Serviços</h4>
            <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
              {fields.length} item(ns)
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const item = itensObservados[index];
              const subtotal = (Number(item?.quantidade) || 0) * (Number(item?.valorPorUnidade) || 0);
              const errItem = errors.itens?.[index];

              return (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg border border-gray-200 shadow-sm">

                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block pl-1">Descrição</label>
                    <div className="relative">
                      <select
                        {...register(`itens.${index}.produtoId`)}
                        className={`w-full pl-3 pr-8 py-2 text-sm border rounded-md focus:ring-2 outline-none appearance-none ${errItem?.produtoId ? 'border-red-300' : 'border-gray-200 focus:border-primary'}`}
                        disabled={isSubmitting}
                      >
                        <option value="">Selecione...</option>
                        {produtosManutencao.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block pl-1">Qtd</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.quantidade`)}
                      className="w-full px-2 py-2 text-sm text-right border border-gray-200 rounded-md focus:ring-2 focus:border-primary outline-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block pl-1">Valor Un.</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.valorPorUnidade`)}
                      className="w-full px-2 py-2 text-sm text-right border border-gray-200 rounded-md focus:ring-2 focus:border-primary outline-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex justify-end items-end gap-2 h-full pb-1">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Subtotal</p>
                      <p className="text-sm font-bold text-gray-700">R$ {subtotal.toFixed(2)}</p>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors mb-0.5"
                        title="Remover item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-between items-center pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
              className="text-xs h-8 bg-white"
              disabled={isSubmitting}
            >
              + Adicionar Item
            </Button>

            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-bold mr-2">Total Geral</span>
              <span className="text-lg font-bold text-primary">R$ {totalGeral.toFixed(2)}</span>
            </div>
          </div>

          {errors.itens && <p className="text-xs text-red-500 font-medium mt-2 text-right">{errors.itens.root?.message || "Verifique os itens da lista."}</p>}
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Observações</label>
          <textarea
            {...register("observacoes")}
            className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
            rows={3}
            placeholder={alvoSelecionado === 'OUTROS' ? "Descreva qual caixa ou equipamento..." : "Detalhes técnicos, descrição do serviço..."}
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="w-full py-3 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          {isSubmitting ? 'Validando...' : 'Registrar Manutenção'}
        </Button>
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo="Comprovante da Manutenção"
          dadosJornada={formDataParaModal}
          apiEndpoint="/ordem-servico"
          apiMethod="POST"
          kmParaConfirmar={formDataParaModal.veiculoId ? formDataParaModal.kmAtual : null}
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}