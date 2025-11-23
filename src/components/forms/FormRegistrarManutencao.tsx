import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../services/api';
import { parseDecimal, formatKmVisual } from '../../utils';
import type { Veiculo, Produto, Fornecedor } from '../../types';

// --- 1. SCHEMA ZOD ---
const manutencaoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  fornecedorId: z.string().min(1, "Selecione uma oficina/fornecedor"),
  kmAtual: z.string().min(1, "KM é obrigatório").refine((val) => parseDecimal(val) > 0, "KM inválido"),
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["PREVENTIVA", "CORRETIVA", "LAVAGEM"]),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o item"),
    quantidade: z.coerce.number().min(0, "Qtd inválida"), // Aceita 0 temporariamente, corrigido no submit se for lavagem
    valorPorUnidade: z.coerce.number().gt(0, "Valor deve ser maior que zero"),
  })).min(1, "Adicione pelo menos um serviço ou peça")
});

type ManutencaoForm = z.infer<typeof manutencaoSchema>;

// --- 2. PROPS ---
interface FormRegistrarManutencaoProps {
  token: string; // Mantido para compatibilidade
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
}

export function FormRegistrarManutencao({
  veiculos,
  produtos,
  fornecedores
}: FormRegistrarManutencaoProps) {

  // Estados Locais
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [errorApi, setErrorApi] = useState('');

  // Estado para validação de KM (buscado da API)
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  // --- 3. REACT HOOK FORM ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ManutencaoForm>({
    resolver: zodResolver(manutencaoSchema) as any,
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  // Observadores
  const veiculoIdSelecionado = watch('veiculoId');
  const tipoManutencao = watch('tipo');
  const itensObservados = watch('itens');

  // --- 4. EFEITOS ---

  // Buscar último KM quando troca o veículo
  useEffect(() => {
    if (!veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }

    const fetchInfoVeiculo = async () => {
      try {
        const response = await api.get(`/veiculo/${veiculoIdSelecionado}`);
        // O backend agora retorna 'ultimoKm' no endpoint de detalhe (se implementamos a alteração no controller)
        // Caso contrário, usamos 0 ou ajustamos o backend. Assumindo que o backend envia:
        setUltimoKmRegistrado(response.data.ultimoKm || 0);
      } catch (err) {
        console.error("Erro ao buscar KM:", err);
      }
    };
    fetchInfoVeiculo();
  }, [veiculoIdSelecionado]);

  // --- 5. HANDLERS ---

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  const onValidSubmit = (data: ManutencaoForm) => {
    setErrorApi('');
    setSuccess('');

    const kmInputFloat = parseDecimal(data.kmAtual);

    // Validação de Regra de Negócio (KM)
    if (kmInputFloat <= ultimoKmRegistrado && ultimoKmRegistrado > 0) {
      setErrorApi(`O KM inserido (${kmInputFloat}) deve ser maior que o último registrado (${ultimoKmRegistrado}).`);
      return;
    }

    // Preparação dos dados
    const itensFormatados = data.itens.map(item => ({
      produtoId: item.produtoId,
      // Se for LAVAGEM, forçamos quantidade 1, senão usa o valor do input
      quantidade: data.tipo === 'LAVAGEM' ? 1 : item.quantidade,
      valorPorUnidade: item.valorPorUnidade
    }));

    const payloadFinal = {
      veiculoId: data.veiculoId,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data).toISOString(),
      tipo: data.tipo,
      observacoes: data.observacoes ? DOMPurify.sanitize(data.observacoes) : null,
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
      data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    });
    setUltimoKmRegistrado(0);
    setTimeout(() => setSuccess(''), 5000);
  };

  // Filtros de produtos (Serviços/Peças vs Combustível)
  const produtosFiltrados = produtos.filter(p => p.tipo === 'SERVICO' || p.tipo === 'OUTRO');

  // Estilos
  const selectClass = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";
  const labelClass = "block mb-1.5 text-sm font-medium text-text-secondary";

  return (
    <>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">Registar Manutenção</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Veículo */}
          <div>
            <label className={labelClass}>Veículo</label>
            <select {...register("veiculoId")} className={selectClass}>
              <option value="">Selecione...</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
            </select>
            {errors.veiculoId && <span className="text-xs text-error">{errors.veiculoId.message}</span>}
            {ultimoKmRegistrado > 0 && (
              <p className="text-xs text-gray-500 mt-1">Último KM: <strong>{ultimoKmRegistrado}</strong></p>
            )}
          </div>

          {/* Fornecedor */}
          <div>
            <label className={labelClass}>Oficina / Lava-Rápido</label>
            <select {...register("fornecedorId")} className={selectClass}>
              <option value="">Selecione...</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            {errors.fornecedorId && <span className="text-xs text-error">{errors.fornecedorId.message}</span>}
          </div>

          {/* KM Atual */}
          <div>
            <label className={labelClass}>KM Atual</label>
            <Input
              {...register("kmAtual")}
              onChange={(e) => {
                register("kmAtual").onChange(e);
                handleKmChange(e);
              }}
              placeholder={ultimoKmRegistrado > 0 ? `> ${ultimoKmRegistrado}` : "Ex: 50.420"}
              error={errors.kmAtual?.message}
            />
          </div>

          {/* Data */}
          <div>
            <label className={labelClass}>Data do Serviço</label>
            <Input type="date" {...register("data")} error={errors.data?.message} />
          </div>

          {/* Tipo */}
          <div>
            <label className={labelClass}>Tipo de Serviço</label>
            <select {...register("tipo")} className={selectClass}>
              <option value="CORRETIVA">Manutenção Corretiva</option>
              <option value="PREVENTIVA">Manutenção Preventiva</option>
              <option value="LAVAGEM">Lavagem</option>
            </select>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="bg-gray-50 p-4 rounded-card border border-gray-200 mt-6">
          <h4 className="text-sm font-bold text-text-secondary uppercase mb-3">Serviços Realizados</h4>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const isLavagem = tipoManutencao === 'LAVAGEM';
              const qtd = isLavagem ? 1 : (itensObservados[index]?.quantidade || 0);
              const val = itensObservados[index]?.valorPorUnidade || 0;
              const total = qtd * val;

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-gray-100">

                  {/* Produto */}
                  <div className="sm:col-span-5">
                    <label className="text-xs text-gray-500 block mb-1">Descrição</label>
                    <select {...register(`itens.${index}.produtoId`)} className={selectClass + " py-1 text-sm"}>
                      <option value="">Selecione...</option>
                      {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>

                  {/* Quantidade (Escondida se for Lavagem) */}
                  {!isLavagem && (
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Qtd</label>
                      <Input type="number" step="0.01" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} />
                    </div>
                  )}

                  {/* Valor Unitário */}
                  <div className={isLavagem ? "sm:col-span-4" : "sm:col-span-2"}>
                    <label className="text-xs text-gray-500 block mb-1">Valor {isLavagem ? 'Total' : 'Un.'}</label>
                    <Input type="number" step="0.01" {...register(`itens.${index}.valorPorUnidade`, { valueAsNumber: true })} />
                  </div>

                  {/* Total e Delete */}
                  <div className="sm:col-span-3 flex justify-end items-center gap-2">
                    <span className="text-sm font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      R$ {total.toFixed(2)}
                    </span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 font-bold px-2">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })} className="text-xs">
              + Adicionar Item
            </Button>
            {errors.itens && <p className="text-xs text-error mt-2">{errors.itens.root?.message}</p>}
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            {...register("observacoes")}
            className={selectClass + " h-24 resize-none"}
            placeholder="Detalhes sobre o serviço..."
          />
        </div>

        {errorApi && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200">{errorApi}</p>}
        {success && <p className="text-center text-success bg-green-50 p-3 rounded border border-green-200">{success}</p>}

        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} className="w-full">
          {isSubmitting ? 'A Validar...' : 'Registar Serviço'}
        </Button>
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Envie o Comprovativo"
          dadosJornada={formDataParaModal}
          apiEndpoint="/ordem-servico"
          apiMethod="POST"
          kmParaConfirmar={null}
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}