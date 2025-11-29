import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- MOCKS & COMPONENTES UI ---

// Mock de dados iniciais
const MOCK_VEICULOS = [
  { id: '1', placa: 'ABC-1234', modelo: 'Volvo FH 540' },
  { id: '2', placa: 'XYZ-9876', modelo: 'Scania R450' },
  { id: '3', placa: 'DEF-5555', modelo: 'Mercedes Actros' }
];

const MOCK_PLANOS = [
  {
    id: '101',
    descricao: 'TROCA DE ÓLEO MOTOR',
    tipoIntervalo: 'KM',
    valorIntervalo: 20000,
    veiculoId: '1',
    kmProximaManutencao: 154000,
    veiculo: { placa: 'ABC-1234', modelo: 'Volvo FH 540' }
  },
  {
    id: '102',
    descricao: 'REVISÃO FREIOS',
    tipoIntervalo: 'TEMPO',
    valorIntervalo: 6,
    veiculoId: '2',
    dataProximaManutencao: '2024-05-20',
    veiculo: { placa: 'XYZ-9876', modelo: 'Scania R450' }
  }
];

const api = {
  get: (url: string) =>
    new Promise<{ data: any }>((resolve) => {
      console.log(`GET ${url}`);
      setTimeout(() => {
        if (url.includes('planos')) {
          resolve({ data: MOCK_PLANOS });
        } else {
          resolve({ data: {} });
        }
      }, 800);
    }),
  post: (url: string, data: any) =>
    new Promise((resolve) => {
      console.log(`POST ${url}`, data);
      setTimeout(() => {
        resolve({ data: { id: Math.random().toString(), ...data } });
      }, 1000);
    }),
  delete: (url: string) =>
    new Promise((resolve) => {
      console.log(`DELETE ${url}`);
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    })
};

// Componente Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}
const Button = ({ variant = 'primary', isLoading, className = '', children, disabled, ...props }: ButtonProps) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 disabled:bg-orange-300",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Carregando...
        </span>
      ) : children}
    </button>
  );
};

// Componente Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block mb-1.5 text-sm font-medium text-gray-700">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-4 py-2 text-gray-900 bg-white border rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
        } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = 'Input';


// --- LÓGICA DO FORMULÁRIO ---

// Tipos auxiliares para a lista
interface Plano {
  id: string;
  descricao: string;
  tipoIntervalo: 'KM' | 'TEMPO';
  valorIntervalo: number;
  kmProximaManutencao?: number | null;
  dataProximaManutencao?: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
}

const tiposIntervalo = ["KM", "TEMPO"] as const;

const planoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),

  descricao: z.string()
    .min(3, "Descrição deve ter no mínimo 3 caracteres")
    .transform(val => val.toUpperCase()),

  tipoIntervalo: z.enum(tiposIntervalo, {
    message: "Selecione um tipo válido"
  }),

  // Correção principal: z.coerce.number()
  valorIntervalo: z.coerce.number()
    .min(1, "O intervalo deve ser maior que 0"),
});

type PlanoForm = z.infer<typeof planoSchema>;

// Props opcionais para rodar isolado ou integrado
interface FormPlanoManutencaoProps {
  veiculos?: any[];
}

export function FormPlanoManutencao({ veiculos = MOCK_VEICULOS }: FormPlanoManutencaoProps) {

  // Estados
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PlanoForm>({
    resolver: zodResolver(planoSchema) as any,
    defaultValues: {
      veiculoId: '',
      descricao: '',
      tipoIntervalo: 'KM',
      valorIntervalo: 0
    }
  });

  // Observar para mudar o placeholder
  const tipoIntervalo = watch('tipoIntervalo');

  // Fetch lista mockada
  const fetchPlanos = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/planos-manutencao');
      // Cast forçado pois sabemos a estrutura do mock
      setPlanos(response.data as Plano[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  const onSubmit = async (data: PlanoForm) => {
    setSuccessMsg('');
    try {
      await api.post('/plano-manutencao', {
        ...data,
        // Simulando dados que viriam do backend para atualizar a lista localmente
        veiculo: veiculos.find(v => v.id === data.veiculoId) || { placa: '???', modelo: '???' }
      });

      setSuccessMsg('Plano criado com sucesso!');
      reset();

      // Atualiza lista
      await fetchPlanos();

      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err: any) {
      console.error("Erro ao criar plano:", err);
      setError('root', { message: 'Falha ao criar o plano.' });
    }
  };

  const handleDelete = async (id: string) => {
    // No ambiente real usaria window.confirm, aqui simulamos direto
    // if (!window.confirm("Tem certeza?")) return;

    try {
      await api.delete(`/plano-manutencao/${id}`);
      setPlanos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Coluna 1: Formulário */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
        <div className="text-center md:text-left mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.703-.077 1.543.313 2.837 1.728 2.939 3.327.042.66-.188 1.348-.68 1.838M10.5 5a2.25 2.25 0 00-2.25 2.25 2.25 2.25 0 002.25 2.25m0 0l2.171 2.172M6 20.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">
            Plano Preventivo
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Configure regras de manutenção.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Veículo</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 appearance-none"
                {...register('veiculoId')}
                disabled={isSubmitting}
              >
                <option value="">Selecione um veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.veiculoId && <p className="mt-1 text-xs text-red-500">{errors.veiculoId.message}</p>}
          </div>

          <Input
            label="Descrição do Plano"
            placeholder="Ex: Troca de Óleo"
            {...register('descricao')}
            error={errors.descricao?.message}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Tipo Intervalo</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 appearance-none"
                  {...register('tipoIntervalo')}
                  disabled={isSubmitting}
                >
                  {tiposIntervalo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <Input
              label="Valor"
              type="number"
              placeholder={tipoIntervalo === 'KM' ? 'Ex: 10000' : 'Ex: 6'}
              {...register('valorIntervalo')}
              error={errors.valorIntervalo?.message}
              disabled={isSubmitting}
            />
          </div>

          {errors.root && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {errors.root.message}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm text-center">
              {successMsg}
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
          </Button>
        </form>
      </div>

      {/* Coluna 2: Lista */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            Planos Ativos
          </h4>
          <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
            {planos.length}
          </span>
        </div>

        {loadingList && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}

        <div className="space-y-3 h-[500px] overflow-y-auto pr-2">
          {!loadingList && planos.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">Nenhum plano criado.</p>
            </div>
          )}

          {planos.map(plano => (
            <div key={plano.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-bold text-gray-800">{plano.descricao}</h5>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    {plano.veiculo.placa} • {plano.veiculo.modelo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(plano.id)}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  title="Apagar Plano"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
                  </svg>
                </button>
              </div>

              <div className="bg-orange-50 p-2 rounded text-sm text-orange-900 mb-2 inline-block">
                <span className="font-bold">Regra:</span> A cada {plano.valorIntervalo} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
              </div>

              {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                <div className="block mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit">
                  Próxima: {plano.kmProximaManutencao} KM
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// App Container para o Canvas
export default function App() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <FormPlanoManutencao />
      </div>
    </div>
  );
}