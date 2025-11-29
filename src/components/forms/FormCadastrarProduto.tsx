import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- MOCKS & COMPONENTES UI (Para funcionamento isolado) ---

// Simulação da API
const api = {
  post: (url: string, data: any) =>
    new Promise((resolve, reject) => {
      console.log(`POST ${url}`, data);
      setTimeout(() => {
        // Simula sucesso. Para testar erro, descomente a linha do reject
        resolve({ data: { id: 1, ...data } });
        // reject({ response: { data: { error: "Erro simulado na API" } } });
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


// --- CÓDIGO DO FORMULÁRIO (ZOD) ---

// Usamos 'as const' para o TypeScript entender que isso é uma Tupla imutável, 
// permitindo o uso no z.enum()
const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"] as const;

const produtoSchema = z.object({
  nome: z.string()
    .trim() // Remove espaços extras automaticamente
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .transform((val) => val.toUpperCase()), // Zod já entrega em Uppercase para o onSubmit

  // Validação estrita: só aceita valores da lista.
  // CORREÇÃO: Usamos 'invalid_type_error' e 'required_error' ao invés de errorMap direto
  tipo: z.enum(tiposDeProduto, {
    required_error: "Selecione um tipo válido",
    invalid_type_error: "Selecione um tipo válido",
  }),

  unidadeMedida: z.string()
    .trim()
    .min(1, "Unidade de medida obrigatória"),
});

type ProdutoForm = z.infer<typeof produtoSchema>;

interface FormCadastrarProdutoProps {
  onSuccess?: () => void;
  onCancelar?: () => void;
}

export function FormCadastrarProduto({ onSuccess, onCancelar }: FormCadastrarProdutoProps) {

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ProdutoForm>({
    // Sem 'as any': A tipagem agora bate perfeitamente com o schema
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'COMBUSTIVEL',
      unidadeMedida: 'Litro'
    }
  });

  const [successMsg, setSuccessMsg] = useState('');

  const onSubmit = async (data: ProdutoForm) => {
    setSuccessMsg('');
    try {
      await api.post('/produto', {
        nome: data.nome, // Já vem em UPPERCASE graças ao transform do Zod
        tipo: data.tipo,
        unidadeMedida: data.unidadeMedida,
      });

      setSuccessMsg('Produto cadastrado com sucesso!');
      reset();

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar produto:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao cadastrar produto.' });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">
            Novo Item de Estoque
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Registre combustíveis, peças ou serviços.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Nome do Produto / Serviço"
            placeholder="Ex: DIESEL S10, ARLA 32"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
          />

          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Tipo</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 appearance-none"
                {...register('tipo')}
                disabled={isSubmitting}
              >
                {tiposDeProduto.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {/* Ícone da seta do select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.tipo && <p className="mt-1 text-xs text-red-500">{errors.tipo.message}</p>}
          </div>

          <Input
            label="Unidade de Medida"
            placeholder="Ex: Litro, Unidade, Hora"
            {...register('unidadeMedida')}
            error={errors.unidadeMedida?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* FEEDBACK */}
        {errors.root && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <span>{errors.root.message}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded text-center text-sm font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onCancelar}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Salvando Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Componente principal para renderização no Canvas
export default function App() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <FormCadastrarProduto
        onSuccess={() => console.log("Success callback triggered")}
        onCancelar={() => console.log("Cancel callback triggered")}
      />
    </div>
  );
}