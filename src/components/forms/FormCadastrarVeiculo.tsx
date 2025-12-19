import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// --- Lista de tipos de frota ---
const tiposDeVeiculo = [
  "POLIGUINDASTE",
  "VACUO",
  "MUNCK",
  "UTILITARIO",
  "OUTRO"
] as const;

const tiposDeCombustivel = [
  "DIESEL_S10",
  "DIESEL_S500",
  "GASOLINA_COMUM",
  "GASOLINA_ADITIVADA",
  "ETANOL",
  "GNV",
  "FLEX",
  "ELETRICO"
] as const;

// --- SCHEMA ZOD V4 (Com Marca e KM) ---
const veiculoSchema = z.object({
  placa: z.string({ error: "A placa é obrigatória" })
    .length(7, { message: "A placa deve ter exatamente 7 caracteres" })
    .transform(val => val.trim().toUpperCase()),

  marca: z.string({ error: "A marca é obrigatória" })
    .min(2, { message: "Marca inválida" })
    .transform(val => val.trim().toUpperCase()),

  modelo: z.string({ error: "O modelo é obrigatório" })
    .min(2, { message: "Modelo muito curto" })
    .transform(val => val.trim().toUpperCase()),

  kmCadastro: z.coerce.number({ error: "KM inicial é obrigatório" })
    .min(0, { message: "KM não pode ser negativo" }),

  ano: z.coerce.number({ error: "Ano inválido" })
    .min(1900, { message: "Ano inválido (mínimo 1900)" })
    .max(new Date().getFullYear() + 1, { message: "Ano não pode ser futuro" }),

  tipoVeiculo: z.enum(tiposDeVeiculo, {
    error: "Selecione o tipo do veículo"
  }),

  tipoCombustivel: z.enum(tiposDeCombustivel, {
    error: "Selecione um combustível válido",
  }).default('DIESEL_S10'),

  capacidadeTanque: z.coerce.number()
    .positive({ message: "Capacidade deve ser positiva" })
    .optional()
    .or(z.literal(0)),

  vencimentoCiv: z.string().optional().or(z.literal('')),
  vencimentoCipp: z.string().optional().or(z.literal('')),
});

type VeiculoFormValues = z.input<typeof veiculoSchema>;

interface FormCadastrarVeiculoProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarVeiculo({ onSuccess, onCancelar }: FormCadastrarVeiculoProps) {

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      marca: '',
      modelo: '',
      kmCadastro: 0,
      ano: new Date().getFullYear(),
      tipoVeiculo: 'POLIGUINDASTE',
      tipoCombustivel: 'DIESEL_S10',
      capacidadeTanque: 0,
      vencimentoCiv: '',
      vencimentoCipp: ''
    },
    mode: 'onBlur'
  });

  // Monitorar Tipo para Lógica Condicional
  const tipoVeiculoSelecionado = watch('tipoVeiculo');
  const isVacuo = tipoVeiculoSelecionado === 'VACUO';

  const onSubmit = async (data: VeiculoFormValues) => {
    // Montagem do Payload
    const payload = {
      placa: DOMPurify.sanitize(data.placa),
      marca: DOMPurify.sanitize(data.marca),
      modelo: DOMPurify.sanitize(data.modelo),
      kmCadastro: data.kmCadastro, // Backend usa isso para criar o histórico inicial
      ano: data.ano,
      tipoVeiculo: data.tipoVeiculo,
      tipoCombustivel: data.tipoCombustivel,

      // Regra de Negócio: Tanque só é relevante para alguns tipos, mas enviamos se preenchido
      capacidadeTanque: isVacuo ? data.capacidadeTanque : (data.capacidadeTanque || 0),

      vencimentoCiv: data.vencimentoCiv ? new Date(data.vencimentoCiv).toISOString() : null,
      vencimentoCipp: data.vencimentoCipp ? new Date(data.vencimentoCipp).toISOString() : null,
    };

    const promise = api.post('/veiculos', payload);

    toast.promise(promise, {
      loading: 'Cadastrando equipamento na frota...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 800);
        return `Equipamento ${response.data.placa} cadastrado!`;
      },
      error: (err) => {
        console.error("Erro ao cadastrar:", err);
        return err.response?.data?.error || 'Falha ao cadastrar. Verifique os dados.';
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-1">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        {/* HEADER VISUAL */}
        <div className="text-center relative mb-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-green-200 to-transparent rounded-full" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600 mb-3 shadow-sm ring-4 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900 tracking-tight">Novo Equipamento</h4>
          <p className="text-xs text-text-secondary mt-1">Preencha os dados básicos e o KM atual.</p>
        </div>

        {/* BLOCO 1: Identificação Básica */}
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-all hover:border-green-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Placa"
              placeholder="ABC1D23"
              {...register('placa')}
              error={errors.placa?.message}
              disabled={isSubmitting}
              maxLength={7}
              className="uppercase font-medium tracking-wide"
              autoFocus
            />

            <Input
              label="Odômetro Inicial (KM)"
              type="number"
              placeholder="0"
              {...register('kmCadastro')}
              error={errors.kmCadastro?.message}
              disabled={isSubmitting}
              className="font-mono text-blue-600"
            />
          </div>
        </div>

        {/* BLOCO 2: Detalhes do Veículo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Input
              label="Marca"
              placeholder="Ex: VOLKS"
              {...register('marca')}
              error={errors.marca?.message}
              disabled={isSubmitting}
              className="uppercase"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Modelo"
              placeholder="Ex: CONSTELLATION 24.280"
              {...register('modelo')}
              error={errors.modelo?.message}
              disabled={isSubmitting}
              className="uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dropdown de Tipos */}
          <div>
            <label className="block mb-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Tipo</label>
            <div className="relative group">
              <select
                className="w-full px-4 py-2.5 text-sm text-text bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm appearance-none cursor-pointer"
                {...register('tipoVeiculo')}
                disabled={isSubmitting}
              >
                {tiposDeVeiculo.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.tipoVeiculo && <p className="mt-1 text-xs text-error">{errors.tipoVeiculo.message}</p>}
          </div>

          <Input
            label="Ano Fab."
            type="number"
            placeholder="2024"
            {...register('ano')}
            error={errors.ano?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* BLOCO 3: Combustível e Tanque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Combustível</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 text-sm text-text bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm appearance-none cursor-pointer"
                {...register('tipoCombustivel')}
                disabled={isSubmitting}
              >
                {tiposDeCombustivel.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {isVacuo && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <Input
                label="Capacidade Tanque (Litros/M³)"
                type="number"
                placeholder="Ex: 15000"
                {...register('capacidadeTanque')}
                error={errors.capacidadeTanque?.message}
                disabled={isSubmitting}
                className="border-blue-200 focus:border-blue-500 bg-blue-50/30"
              />
            </div>
          )}
        </div>

        {/* BLOCO 4: Docs Opcionais */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vencimentos (Opcional)</p>
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

        <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
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
            className="flex-[2] bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Cadastrar
          </Button>
        </div>
      </form>
    </div>
  );
}