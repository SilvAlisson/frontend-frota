import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { parseDecimal, formatKmVisual } from '../../utils';
import type { Veiculo, Produto, Fornecedor } from '../../types';

// --- 1. SCHEMA ZOD INTELIGENTE ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"], {
    error: "Selecione o tipo de manutenção"
  }),

  vinculadoVeiculo: z.boolean(),

  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),

  fornecedorId: z.string().min(1, { error: "Selecione o fornecedor/oficina" }),
  data: z.string().min(1, { error: "Data é obrigatória" }),
  observacoes: z.string().optional(),

  itens: z.array(z.object({
    produtoId: z.string().min(1, { error: "Selecione o item" }),
    // z.coerce converte para number, então o Output é number
    quantidade: z.coerce.number().min(0.01, { error: "Qtd inválida" }),
    valorPorUnidade: z.coerce.number().min(0, { error: "Valor inválido" }),
  })).min(1, { error: "Adicione pelo menos um serviço ou peça" })
}).superRefine((data, ctx) => {
  if (data.vinculadoVeiculo) {
    if (!data.veiculoId || data.veiculoId === "") {
      ctx.addIssue({
        code: "custom",
        message: "Selecione o veículo",
        path: ["veiculoId"]
      });
    }
    if (!data.kmAtual || data.kmAtual === "") {
      ctx.addIssue({
        code: "custom",
        message: "KM é obrigatório para serviços em veículos",
        path: ["kmAtual"]
      });
    }
  }
});

// Extraímos o tipo de SAÍDA do esquema (onde quantidade é number)
type ManutencaoForm = z.infer<typeof manutencaoSchema>;

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
  const [success, setSuccess] = useState('');
  const [errorApi, setErrorApi] = useState('');
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  // --- 2. REACT HOOK FORM ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    // Removemos o genérico <ManutencaoForm> aqui para evitar conflito de Input/Output do z.coerce
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      tipo: 'CORRETIVA',
      vinculadoVeiculo: true,
      data: new Date().toISOString().slice(0, 10),
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  // Observadores
  const veiculoIdSelecionado = watch('veiculoId');
  const vinculadoVeiculo = watch('vinculadoVeiculo');
  const tipoManutencao = watch('tipo');
  
  // ✅ CORREÇÃO: Cast explícito para o tipo de SAÍDA do esquema.
  // Isso diz ao TS: "Eu garanto que, ao ler estes dados, quantidade e valor são números".
  const itensObservados = watch('itens') as ManutencaoForm['itens'];

  // --- 3. EFEITOS ---
  useEffect(() => {
    if (!vinculadoVeiculo || !veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }

    const fetchInfoVeiculo = async () => {
      try {
        const response = await api.get<Veiculo>(`/veiculo/${veiculoIdSelecionado}`);
        setUltimoKmRegistrado(response.data.ultimoKm || 0);
      } catch (err) {
        console.error("Erro ao buscar KM:", err);
      }
    };
    fetchInfoVeiculo();
  }, [veiculoIdSelecionado, vinculadoVeiculo]);

  // --- 4. HANDLERS ---

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  // Aqui usamos o tipo ManutencaoForm para o data, pois o handleSubmit já nos entrega os dados validados/transformados
  const onValidSubmit = async (data: ManutencaoForm) => {
    setErrorApi('');
    setSuccess('');

    let kmInputFloat = null;

    if (data.vinculadoVeiculo) {
      kmInputFloat = parseDecimal(data.kmAtual || '0');
      if (kmInputFloat <= ultimoKmRegistrado && ultimoKmRegistrado > 0) {
        setErrorApi(`O KM inserido (${kmInputFloat}) deve ser maior que o último registrado (${ultimoKmRegistrado}).`);
        return;
      }
    }

    const itensFormatados = data.itens.map(item => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      valorPorUnidade: item.valorPorUnidade
    }));

    const payloadFinal = {
      veiculoId: data.vinculadoVeiculo ? data.veiculoId : null,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data).toISOString(),
      tipo: data.tipo,
      observacoes: data.observacoes,
      itens: itensFormatados
    };

    setFormDataParaModal(payloadFinal);
    setModalAberto(true);
  };

  const handleModalSuccess = () => {
    setSuccess('Manutenção registrada com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);

    reset({
      veiculoId: '',
      fornecedorId: '',
      kmAtual: '',
      vinculadoVeiculo: true,
      data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA',
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    });
    setUltimoKmRegistrado(0);

    setTimeout(() => setSuccess(''), 4000);
  };

  const selectClass = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none";
  const labelClass = "block mb-1.5 text-sm font-medium text-text-secondary";

  return (
    <>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6 bg-white p-6 rounded-card shadow-card border border-gray-100">

        {/* HEADER & TIPO */}
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-primary mb-2">Registrar Ordem de Serviço</h4>
          <p className="text-sm text-text-secondary mb-4">Selecione a categoria do serviço realizado.</p>

          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setValue('tipo', 'PREVENTIVA')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 ${tipoManutencao === 'PREVENTIVA'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Preventiva / Lavagem
            </button>
            <button
              type="button"
              onClick={() => setValue('tipo', 'CORRETIVA')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 ${tipoManutencao === 'CORRETIVA'
                ? 'bg-white text-orange-600 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Corretiva / Reparo
            </button>
          </div>
        </div>

        {/* TOGGLE: VINCULADO A VEÍCULO? */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
          <input
            id="checkVinculo"
            type="checkbox"
            className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
            {...register('vinculadoVeiculo')}
          />
          <label htmlFor="checkVinculo" className="text-sm font-medium text-gray-700 cursor-pointer select-none flex-1">
            O serviço foi realizado em um <strong>Veículo da Frota</strong>?
            <span className="block text-xs text-gray-500 font-normal mt-0.5">
              Desmarque para serviços em equipamentos, caçambas, predial ou estoque.
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SEÇÃO DO VEÍCULO (CONDICIONAL) */}
          {vinculadoVeiculo && (
            <>
              <div className="animate-fadeIn">
                <label className={labelClass}>Veículo <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select {...register("veiculoId")} className={selectClass} disabled={isSubmitting}>
                    <option value="">Selecione...</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                </div>
                {errors.veiculoId && <span className="text-xs text-error">{errors.veiculoId.message as string}</span>}
                {ultimoKmRegistrado > 0 && (
                  <p className="text-xs text-primary mt-1 font-medium">Último KM: {ultimoKmRegistrado.toLocaleString('pt-BR')}</p>
                )}
              </div>

              <div className="animate-fadeIn">
                <label className={labelClass}>KM Atual <span className="text-red-500">*</span></label>
                <Input
                  {...register("kmAtual")}
                  onChange={(e: any) => {
                    register("kmAtual").onChange(e);
                    handleKmChange(e);
                  }}
                  placeholder={ultimoKmRegistrado > 0 ? `> ${ultimoKmRegistrado}` : "Ex: 50.420"}
                  error={errors.kmAtual?.message as string}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* CAMPOS COMUNS */}
          <div className={!vinculadoVeiculo ? "md:col-span-2" : ""}>
            <label className={labelClass}>Oficina / Fornecedor</label>
            <div className="relative">
              <select {...register("fornecedorId")} className={selectClass} disabled={isSubmitting}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
            {errors.fornecedorId && <span className="text-xs text-error">{errors.fornecedorId.message as string}</span>}
          </div>

          <div className={!vinculadoVeiculo ? "md:col-span-2" : ""}>
            <label className={labelClass}>Data do Serviço</label>
            <Input type="date" {...register("data")} error={errors.data?.message as string} disabled={isSubmitting} />
          </div>
        </div>

        {/* ITENS DA OS */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-3">Itens e Serviços</h4>

          <div className="space-y-3">
            {fields.map((field, index) => {
              // Acessamos com segurança os valores observados
              const itemAtual = itensObservados?.[index];
              const qtd = itemAtual?.quantidade || 0;
              const val = itemAtual?.valorPorUnidade || 0;
              const total = qtd * val;

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-gray-100 shadow-sm">

                  <div className="sm:col-span-5">
                    <label className="text-xs text-gray-500 block mb-1 font-medium">Descrição</label>
                    <div className="relative">
                      <select {...register(`itens.${index}.produtoId`)} className={selectClass + " py-2 text-sm"} disabled={isSubmitting}>
                        <option value="">Selecione...</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1 font-medium">Qtd</label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                      disabled={isSubmitting}
                      className="!py-2 text-right"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1 font-medium">Valor Un.</label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.valorPorUnidade`, { valueAsNumber: true })}
                      disabled={isSubmitting}
                      className="!py-2 text-right"
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end items-center gap-2">
                    <span className="text-sm font-bold text-text-secondary bg-gray-100 px-3 py-2 rounded border border-gray-200 min-w-[80px] text-right">
                      R$ {total.toFixed(2)}
                    </span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 font-bold p-2 rounded hover:bg-red-50 transition-colors" disabled={isSubmitting} title="Remover item">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button type="button" variant="secondary" onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })} className="text-xs h-8" disabled={isSubmitting}>
              + Adicionar Item
            </Button>
            <span className="text-sm font-bold text-gray-700">
              Total Geral: R$ {(itensObservados || []).reduce((acc, i) => acc + ((i.quantidade || 0) * (i.valorPorUnidade || 0)), 0).toFixed(2)}
            </span>
          </div>
          {errors.itens && <p className="text-xs text-error mt-2 font-medium">{errors.itens.root?.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            {...register("observacoes")}
            className={selectClass + " h-24 resize-none py-3"}
            placeholder="Detalhes técnicos, número da OS em papel, descrição do reparo..."
            disabled={isSubmitting}
          />
        </div>

        {errorApi && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200 font-medium text-sm">{errorApi}</p>}
        {success && <p className="text-center text-success bg-green-50 p-3 rounded border border-green-200 font-medium text-sm">{success}</p>}

        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} className="w-full py-3">
          {isSubmitting ? 'Validando...' : 'Registrar Ordem de Serviço'}
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