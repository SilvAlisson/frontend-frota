import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- MOCKS E UTILS (Para funcionamento isolado) ---

// Mock de Tipos
interface Veiculo { id: string; placa: string; modelo: string; ultimoKm?: number; }
interface Produto { id: string; nome: string; tipo: 'PECA' | 'SERVICO' | 'OUTRO'; }
interface Fornecedor { id: string; nome: string; }

// Utils Mock
const parseDecimal = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
const formatKmVisual = (val: string) => val.replace(/\D/g, ''); // Simplificado para exemplo

// API Mock
const api = {
  get: (url: string) =>
    new Promise<{ data: any }>((resolve) => {
      console.log(`GET ${url}`);
      setTimeout(() => {
        if (url.includes('/veiculo/')) {
          // Simula retorno do KM do veículo
          resolve({ data: { ultimoKm: 50000 } });
        } else {
          resolve({ data: {} });
        }
      }, 500);
    }),
  post: (url: string, data: any) =>
    new Promise((resolve) => {
      console.log(`POST ${url}`, data);
      setTimeout(() => {
        resolve({ data: { success: true } });
      }, 1000);
    })
};

// Componentes UI Mocks
const Button = ({ isLoading, children, variant, className, ...props }: any) => (
  <button
    className={`px-4 py-2 rounded text-white font-bold transition-colors w-full ${variant === 'secondary' ? 'bg-gray-400 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    disabled={isLoading}
    {...props}
  >
    {isLoading ? 'Carregando...' : children}
  </button>
);

const Input = React.forwardRef(({ label, error, ...props }: any, ref: any) => (
  <div className="w-full">
    <input
      ref={ref}
      className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
        }`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));
Input.displayName = 'Input';

const ModalConfirmacaoFoto = ({ onClose, onSuccess }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-lg">
      <h3 className="font-bold text-lg mb-4 text-center">Confirmar e Enviar Foto?</h3>
      <div className="bg-gray-100 h-32 flex items-center justify-center mb-4 rounded border border-dashed border-gray-300">
        <span className="text-gray-500 text-sm">[Área de Upload Simulada]</span>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
        <button onClick={onSuccess} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Confirmar</button>
      </div>
    </div>
  </div>
);

// --- 1. SCHEMA ZOD ---
const manutencaoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  fornecedorId: z.string().min(1, "Selecione uma oficina/fornecedor"),
  kmAtual: z.string().min(1, "KM é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["PREVENTIVA", "CORRETIVA", "LAVAGEM"]),
  observacoes: z.union([z.string().optional(), z.literal('')]),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o item"),
    // ATUALIZAÇÃO ZOD 4: Uso da propriedade 'error' com callback
    quantidade: z.coerce.number({
      error: (issue) => issue.input === undefined ? "Qtd é obrigatória" : "Qtd inválida"
    }).min(0.01, "Qtd deve ser maior que 0"),

    valorPorUnidade: z.coerce.number({
      error: (issue) => issue.input === undefined ? "Valor é obrigatório" : "Valor inválido"
    }).min(0, "Valor não pode ser negativo"),
  })).min(1, "Adicione pelo menos um serviço ou peça")
});

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
  } = useForm<ManutencaoForm>({
    // 'as any' mantido para evitar conflitos de tipagem estrita do hook-form com coerce
    resolver: zodResolver(manutencaoSchema) as any,
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA',
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  const veiculoIdSelecionado = watch('veiculoId');
  const tipoManutencao = watch('tipo');
  const itensObservados = watch('itens');

  // --- 3. EFEITOS ---
  useEffect(() => {
    if (!veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }

    const fetchInfoVeiculo = async () => {
      try {
        const response = await api.get(`/veiculo/${veiculoIdSelecionado}`);
        setUltimoKmRegistrado(response.data.ultimoKm || 0);
      } catch (err) {
        console.error("Erro ao buscar KM:", err);
      }
    };
    fetchInfoVeiculo();
  }, [veiculoIdSelecionado]);

  // --- 4. HANDLERS ---

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  const onValidSubmit = async (data: ManutencaoForm) => {
    setErrorApi('');
    setSuccess('');

    const kmInputFloat = parseDecimal(data.kmAtual);

    // Validação de consistência do KM
    if (kmInputFloat <= ultimoKmRegistrado && ultimoKmRegistrado > 0) {
      setErrorApi(`O KM inserido (${kmInputFloat}) deve ser maior que o último registrado (${ultimoKmRegistrado}).`);
      return;
    }

    try {
      const response = await api.get(`/veiculo/${data.veiculoId}`);
      const kmBanco = response.data.ultimoKm || 0;

      if (kmInputFloat <= kmBanco) {
        setErrorApi(`Atenção: O veículo já possui registro com ${kmBanco} KM. Ajuste o valor.`);
        setUltimoKmRegistrado(kmBanco);
        return;
      }
    } catch (err) {
      console.error("Erro de validação de KM:", err);
    }

    const itensFormatados = data.itens.map(item => ({
      produtoId: item.produtoId,
      quantidade: data.tipo === 'LAVAGEM' ? 1 : item.quantidade,
      valorPorUnidade: item.valorPorUnidade
    }));

    const payloadFinal = {
      veiculoId: data.veiculoId,
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
      data: new Date().toISOString().slice(0, 10),
      tipo: 'CORRETIVA',
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: 0 }]
    });
    setUltimoKmRegistrado(0);

    setTimeout(() => setSuccess(''), 4000);
  };

  const produtosFiltrados = produtos.filter(p => p.tipo === 'SERVICO' || p.tipo === 'OUTRO');
  const selectClass = "w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 appearance-none";
  const labelClass = "block mb-1.5 text-sm font-medium text-gray-700";

  return (
    <>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">Registrar Manutenção</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Veículo</label>
            <div className="relative">
              <select {...register("veiculoId")} className={selectClass} disabled={isSubmitting}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
            {errors.veiculoId && <span className="text-xs text-red-500">{errors.veiculoId.message}</span>}
            {ultimoKmRegistrado > 0 && (
              <p className="text-xs text-gray-500 mt-1">Último KM: <strong>{ultimoKmRegistrado.toLocaleString('pt-BR')}</strong></p>
            )}
          </div>

          <div>
            <label className={labelClass}>Oficina / Lava-Rápido</label>
            <div className="relative">
              <select {...register("fornecedorId")} className={selectClass} disabled={isSubmitting}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
            {errors.fornecedorId && <span className="text-xs text-red-500">{errors.fornecedorId.message}</span>}
          </div>

          <div>
            <label className={labelClass}>KM Atual</label>
            <Input
              {...register("kmAtual")}
              onChange={(e: any) => {
                register("kmAtual").onChange(e);
                handleKmChange(e);
              }}
              placeholder={ultimoKmRegistrado > 0 ? `> ${ultimoKmRegistrado}` : "Ex: 50.420"}
              error={errors.kmAtual?.message}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelClass}>Data do Serviço</label>
            <Input type="date" {...register("data")} error={errors.data?.message} disabled={isSubmitting} />
          </div>

          <div>
            <label className={labelClass}>Tipo de Serviço</label>
            <div className="relative">
              <select {...register("tipo")} className={selectClass} disabled={isSubmitting}>
                <option value="CORRETIVA">Manutenção Corretiva</option>
                <option value="PREVENTIVA">Manutenção Preventiva</option>
                <option value="LAVAGEM">Lavagem</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-6">
          <h4 className="text-sm font-bold text-gray-700 uppercase mb-3">Serviços Realizados</h4>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const isLavagem = tipoManutencao === 'LAVAGEM';
              const qtd = isLavagem ? 1 : (itensObservados[index]?.quantidade || 0);
              const val = itensObservados[index]?.valorPorUnidade || 0;
              const total = qtd * val;

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-gray-100">

                  <div className="sm:col-span-5">
                    <label className="text-xs text-gray-500 block mb-1">Descrição</label>
                    <div className="relative">
                      <select {...register(`itens.${index}.produtoId`)} className={selectClass + " py-1 text-sm"} disabled={isSubmitting}>
                        <option value="">Selecione...</option>
                        {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>

                  {!isLavagem && (
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Qtd</label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  <div className={isLavagem ? "sm:col-span-4" : "sm:col-span-2"}>
                    <label className="text-xs text-gray-500 block mb-1">Valor {isLavagem ? 'Total' : 'Un.'}</label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`itens.${index}.valorPorUnidade`, { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end items-center gap-2">
                    <span className="text-sm font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      R$ {total.toFixed(2)}
                    </span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 font-bold px-2" disabled={isSubmitting}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })} className="text-xs w-auto" disabled={isSubmitting}>
              + Adicionar Item
            </Button>
            {errors.itens && <p className="text-xs text-red-500 mt-2">{errors.itens.root?.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            {...register("observacoes")}
            className={selectClass + " h-24 resize-none"}
            placeholder="Detalhes sobre o serviço..."
            disabled={isSubmitting}
          />
        </div>

        {errorApi && <p className="text-center text-red-600 bg-red-50 p-3 rounded border border-red-200">{errorApi}</p>}
        {success && <p className="text-center text-green-600 bg-green-50 p-3 rounded border border-green-200">{success}</p>}

        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'Validando...' : 'Serviço registrado!'}
        </Button>
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}

// App Wrapper para o Canvas
export default function App() {
  const mockVeiculos: Veiculo[] = [
    { id: '1', placa: 'ABC-1234', modelo: 'Volvo FH', ultimoKm: 50000 },
    { id: '2', placa: 'XYZ-9999', modelo: 'Scania R450', ultimoKm: 120000 }
  ];
  const mockProdutos: Produto[] = [
    { id: '10', nome: 'Troca de Óleo', tipo: 'SERVICO' },
    { id: '11', nome: 'Filtro de Ar', tipo: 'PECA' },
    { id: '12', nome: 'Mão de Obra', tipo: 'SERVICO' },
    { id: '13', nome: 'Lavagem Completa', tipo: 'OUTRO' }
  ];

  const mockFornecedores: Fornecedor[] = [
    { id: '100', nome: 'Oficina do Tião' },
    { id: '101', nome: 'Lava Jato Central' }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow">
        <FormRegistrarManutencao
          veiculos={mockVeiculos}
          produtos={mockProdutos}
          fornecedores={mockFornecedores}
        />
      </div>
    </div>
  );
}