import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- MOCKS & COMPONENTES UI (Para funcionamento isolado) ---

// Simulação da API
const api = {
  get: (url: string) =>
    new Promise<{ data: any }>((resolve) => {
      console.log(`GET ${url}`);
      setTimeout(() => {
        // Simula retorno de dados do veículo
        resolve({
          data: {
            id: '789',
            placa: 'ABC-1234',
            modelo: 'Caminhão Volvo FH',
            ano: 2022,
            tipoVeiculo: 'CAMINHAO',
            vencimentoCiv: '2025-10-10',
            vencimentoCipp: ''
          }
        });
      }, 1000);
    }),
  put: (url: string, data: any) =>
    new Promise((resolve) => {
      console.log(`PUT ${url}`, data);
      setTimeout(() => {
        resolve({ data: { ...data } });
      }, 1000);
    })
};

// Componente Button Simplificado
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

// Componente Input Simplificado
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

const tiposDeVeiculo = ["CAMINHAO", "CARRETA", "UTILITARIO", "OUTRO"] as const;

// O uso de z.coerce.number() ajuda a lidar com inputs HTML que retornam string
const veiculoSchema = z.object({
  placa: z.string()
    .min(7, "Placa inválida")
    .transform(val => val.toUpperCase()),

  modelo: z.string()
    .min(1, "Modelo é obrigatório"),

  ano: z.coerce.number()
    .min(1900, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano não pode ser futuro"),

  tipoVeiculo: z.enum(tiposDeVeiculo, {
    message: "Selecione um tipo válido"
  }),

  vencimentoCiv: z.string().optional(),
  vencimentoCipp: z.string().optional(),
});

type VeiculoForm = z.infer<typeof veiculoSchema>;

interface FormEditarVeiculoProps {
  veiculoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarVeiculo({ veiculoId, onSuccess, onCancelar }: FormEditarVeiculoProps) {

  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoForm>({
    // CORREÇÃO: 'as any' silencia o conflito entre 'unknown' (entrada do coerce) e 'number' (tipo do form)
    // Isso mantém a segurança em tempo de execução mas resolve o erro de build.
    resolver: zodResolver(veiculoSchema) as any,
    defaultValues: {
      placa: '',
      modelo: '',
      ano: new Date().getFullYear(),
      tipoVeiculo: 'CAMINHAO',
      vencimentoCiv: '',
      vencimentoCipp: ''
    }
  });

  useEffect(() => {
    if (!veiculoId) return;

    const fetchVeiculo = async () => {
      setLoadingData(true);
      try {
        const response = await api.get(`/veiculo/${veiculoId}`);
        const veiculo = response.data;

        // Garante que o tipo do veículo existe no enum
        const tipoValido = tiposDeVeiculo.includes(veiculo.tipoVeiculo as any)
          ? (veiculo.tipoVeiculo as typeof tiposDeVeiculo[number])
          : 'OUTRO';

        reset({
          placa: veiculo.placa,
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          tipoVeiculo: tipoValido,
          vencimentoCiv: veiculo.vencimentoCiv || '',
          vencimentoCipp: veiculo.vencimentoCipp || ''
        });
      } catch (err) {
        console.error("Erro ao carregar veículo", err);
        setError('root', { message: 'Erro ao carregar dados.' });
      } finally {
        setLoadingData(false);
      }
    };

    fetchVeiculo();
  }, [veiculoId, reset, setError]);

  const onSubmit = async (data: VeiculoForm) => {
    setSuccessMsg('');
    try {
      await api.put(`/veiculo/${veiculoId}`, data);

      setSuccessMsg('Veículo atualizado com sucesso!');
      setTimeout(() => onSuccess(), 1500);

    } catch (err: any) {
      console.error(err);
      setError('root', { message: 'Falha ao salvar veículo.' });
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <p className="text-sm text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.75" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">Editar Veículo</h4>
          <p className="text-sm text-gray-500">Atualize os dados da frota.</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Placa"
            {...register('placa')}
            error={errors.placa?.message}
            disabled={isSubmitting}
          />

          <Input
            label="Modelo"
            {...register('modelo')}
            error={errors.modelo?.message}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ano"
              type="number"
              {...register('ano')}
              error={errors.ano?.message}
              disabled={isSubmitting}
            />

            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Tipo</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  {...register('tipoVeiculo')}
                  disabled={isSubmitting}
                >
                  {tiposDeVeiculo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {errors.tipoVeiculo && <p className="mt-1 text-xs text-red-500">{errors.tipoVeiculo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vencimento CIV"
              type="date"
              {...register('vencimentoCiv')}
              error={errors.vencimentoCiv?.message}
              disabled={isSubmitting}
            />
            <Input
              label="Vencimento CIPP"
              type="date"
              {...register('vencimentoCipp')}
              error={errors.vencimentoCipp?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* FEEDBACK */}
        {errors.root && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm text-center">
            {errors.root.message}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded text-sm text-center">
            {successMsg}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancelar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}

export default function App() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <FormEditarVeiculo
        veiculoId="789"
        onSuccess={() => console.log("Sucesso!")}
        onCancelar={() => console.log("Cancelar")}
      />
    </div>
  );
}