import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // Importação nomeada para melhor tree-shaking
import { api } from '../../services/api';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { ModalGerenciarServicos } from '../ModalGerenciarServicos'; // Import Modal
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { parseDecimal, formatKmVisual } from '../../utils';
import { toast } from 'sonner';
import type { Veiculo, Produto, Fornecedor } from '../../types';

// Opções de "Alvo" da manutenção
const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

// --- 1. SCHEMA ZOD V4 ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),

  // KM agora é totalmente opcional no schema
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),

  // Novo campo para CA (Controle de caixa/EPI)
  numeroCA: z.string().optional(),

  fornecedorId: z.string({ error: "Fornecedor obrigatório" })
    .min(1, { error: "Selecione o fornecedor" }),

  data: z.string({ error: "Data obrigatória" })
    .min(1, { error: "Data inválida" }),

  observacoes: z.string().optional(),

  itens: z.array(z.object({
    produtoId: z.string({ error: "Item obrigatório" })
      .min(1, { error: "Selecione o serviço/peça" }),

    quantidade: z.coerce.number()
      .min(0.01, { error: "Qtd inválida" }),

    valorPorUnidade: z.coerce.number()
      .min(0, { error: "Valor inválido" }),
  })).min(1, { error: "Adicione pelo menos um item à OS" })
})
  .superRefine((data, ctx) => {
    // Validação Condicional
    if (data.alvo === 'VEICULO') {
      if (!data.veiculoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o veículo",
          path: ["veiculoId"]
        });
      }
    }

    if (data.alvo === 'OUTROS') {
      if (!data.numeroCA) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o nº do CA",
          path: ["numeroCA"]
        });
      }
    }
  });

type ManutencaoFormInput = z.input<typeof manutencaoSchema>;

interface FormRegistrarManutencaoProps {
  veiculos: Veiculo[];
  produtos: Produto[]; // Recebe produtos iniciais do pai
  fornecedores: Fornecedor[];
}

export function FormRegistrarManutencao({
  veiculos,
  produtos,
  fornecedores
}: FormRegistrarManutencaoProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [modalServicosOpen, setModalServicosOpen] = useState(false); // Estado da Modal de Serviços
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  // Controle das Abas
  const [abaAtiva, setAbaAtiva] = useState<TipoManutencao>('CORRETIVA');

  // NOVO: Estado local para produtos (permite atualizar sem refresh da página)
  const [listaProdutos, setListaProdutos] = useState<Produto[]>(produtos);

  // Sincroniza se a prop mudar externamente (boa prática)
  useEffect(() => {
    setListaProdutos(produtos);
  }, [produtos]);

  // Filtra produtos usando a lista local
  const produtosManutencao = listaProdutos.filter(p =>
    !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo)
  );

  // Filtro de Fornecedores por Aba
  const fornecedoresFiltrados = fornecedores.filter(f => {
    if (abaAtiva === 'CORRETIVA') {
      // Na corretiva, removemos Posto e Lava Jato da lista
      return !['POSTO', 'LAVA_JATO'].includes(f.tipo);
    }
    // Na preventiva, mostra todos (ou ajuste conforme necessidade)
    return true;
  });

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

  // Sincroniza a aba com o valor do formulário
  useEffect(() => {
    setValue('tipo', abaAtiva);
  }, [abaAtiva, setValue]);

  const alvoSelecionado = watch('alvo');
  const veiculoIdSelecionado = watch('veiculoId');
  const itensObservados = watch('itens');

  // Busca último KM para referência (apenas informativo agora)
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

    if (data.alvo === 'VEICULO' && data.kmAtual) {
      kmInputFloat = parseDecimal(data.kmAtual);
      // Aviso sutil se KM for menor, mas permite salvar (flexibilidade)
      if (kmInputFloat < ultimoKmRegistrado && ultimoKmRegistrado > 0) {
        toast.warning(`Nota: KM informado é menor que o último (${ultimoKmRegistrado}).`);
      }
    }

    // Formata observação incluindo o CA se houver
    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    const payloadFinal = {
      tipo: data.tipo,
      veiculoId: data.alvo === 'VEICULO' ? data.veiculoId : null,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data).toISOString(),
      observacoes: obsFinal,
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
      numeroCA: '',
      data: new Date().toISOString().slice(0, 10),
      tipo: abaAtiva, // Mantém a aba atual
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
      <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">

        {/* HEADER ABAS */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setAbaAtiva('CORRETIVA')}
            className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wide transition-colors ${abaAtiva === 'CORRETIVA'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Corretiva / Reparo
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('PREVENTIVA')}
            className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wide transition-colors ${abaAtiva === 'PREVENTIVA'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Preventiva
          </button>
        </div>

        <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

          {/* SELETOR DE ALVO */}
          <div className="flex p-1 bg-gray-50 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setValue('alvo', 'VEICULO')}
              className={`flex-1 py-2 text-xs font-bold rounded transition-all ${alvoSelecionado === 'VEICULO'
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-400 hover:bg-gray-100'}`}
            >
              Veículo
            </button>
            <button
              type="button"
              onClick={() => setValue('alvo', 'OUTROS')}
              className={`flex-1 py-2 text-xs font-bold rounded transition-all ${alvoSelecionado === 'OUTROS'
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-400 hover:bg-gray-100'}`}
            >
              Caixa / Equipamento
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {alvoSelecionado === 'VEICULO' ? (
              <div className="md:col-span-2 space-y-4">
                <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">Veículo</label>
                  <select
                    {...register("veiculoId")}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione...</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                  </select>
                  {errors.veiculoId && <span className="text-xs text-error mt-1 block">{errors.veiculoId.message}</span>}
                </div>

                <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">KM Atual (Opcional)</label>
                  <Input
                    {...register("kmAtual")}
                    onChange={(e) => {
                      register("kmAtual").onChange(e);
                      handleKmChange(e);
                    }}
                    placeholder={ultimoKmRegistrado > 0 ? `Ref: ${ultimoKmRegistrado} km` : "Ex: 50.000"}
                    error={errors.kmAtual?.message}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 animate-in fade-in slide-in-from-top-1">
                {/* Pergunta do CA */}
                <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">Qual o CA da Caixa?</label>
                <Input
                  {...register("numeroCA")}
                  placeholder="Digite o número do CA ou Identificação"
                  error={errors.numeroCA?.message}
                  disabled={isSubmitting}
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 mt-1">Identificação obrigatória para reparo de caixas.</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">
                {abaAtiva === 'CORRETIVA' ? 'Oficina de Reparo' : 'Fornecedor / Oficina'}
              </label>
              <select
                {...register("fornecedorId")}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
                disabled={isSubmitting}
              >
                <option value="">Selecione...</option>
                {fornecedoresFiltrados.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {errors.fornecedorId && <span className="text-xs text-error mt-1 block">{errors.fornecedorId.message}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">Data do Serviço</label>
              <Input type="date" {...register("data")} error={errors.data?.message} disabled={isSubmitting} />
            </div>
          </div>

          {/* LISTA DE ITENS */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Peças e Serviços</h4>
                {/* BOTÃO DE ENGRENAGEM PARA GERENCIAR SERVIÇOS */}
                <button
                  type="button"
                  onClick={() => setModalServicosOpen(true)}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-full transition-all"
                  title="Gerenciar Catálogo de Serviços/Peças"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 text-gray-400">{fields.length} itens</span>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const item = itensObservados[index];
                const subtotal = (Number(item?.quantidade) || 0) * (Number(item?.valorPorUnidade) || 0);
                const errItem = errors.itens?.[index];

                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="col-span-12 sm:col-span-6">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Item</label>
                      <select
                        {...register(`itens.${index}.produtoId`)}
                        className={`w-full p-2 text-sm border rounded-md focus:ring-2 outline-none appearance-none bg-white ${errItem?.produtoId ? 'border-red-300' : 'border-gray-200 focus:border-primary'}`}
                        disabled={isSubmitting}
                      >
                        <option value="">Selecione...</option>
                        {produtosManutencao.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qtd</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`itens.${index}.quantidade`)}
                        className="w-full p-2 text-sm border border-gray-200 rounded-md outline-none focus:border-primary text-center"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">R$ Unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`itens.${index}.valorPorUnidade`)}
                        className="w-full p-2 text-sm border border-gray-200 rounded-md outline-none focus:border-primary text-right"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2 flex flex-col justify-end items-end h-full pb-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block opacity-0">Sub</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">R$ {subtotal.toFixed(2)}</span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                disabled={isSubmitting}
              >
                + Adicionar Item
              </button>
              <div className="text-right">
                <span className="text-xs text-gray-400 uppercase font-bold mr-2">Total Estimado</span>
                <span className="text-base font-bold text-gray-800">R$ {totalGeral.toFixed(2)}</span>
              </div>
            </div>
            {errors.itens && <p className="text-xs text-red-500 font-medium mt-2 text-right">{errors.itens.root?.message}</p>}
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">Observações</label>
            <textarea
              {...register("observacoes")}
              className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
              rows={2}
              placeholder={alvoSelecionado === 'OUTROS' ? "Descreva o defeito da caixa..." : "Detalhes do serviço..."}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="w-full py-3.5 text-base shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
          >
            {isSubmitting ? 'Salvando...' : `Confirmar ${abaAtiva === 'CORRETIVA' ? 'Reparo' : 'Manutenção'}`}
          </Button>
        </form>
      </div>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo={`Comprovante - ${formDataParaModal.tipo}`}
          dadosJornada={formDataParaModal}
          apiEndpoint="/ordem-servico"
          apiMethod="POST"
          kmParaConfirmar={null}
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* RENDERIZAÇÃO DA MODAL DE SERVIÇOS */}
      {modalServicosOpen && (
        <ModalGerenciarServicos
          onClose={() => setModalServicosOpen(false)}
          onItemAdded={(novoItem) => {
            // Atualiza a lista local com o novo item e reordena
            setListaProdutos(prev => [...prev, novoItem].sort((a, b) => a.nome.localeCompare(b.nome)));
          }}
        />
      )}
    </>
  );
}