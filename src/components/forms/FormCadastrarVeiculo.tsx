import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// --- ATUALIZAÇÃO 1: Novos Tipos de Equipamento ---
const tiposDeVeiculo = ["POLIGUINDASTE", "VACUO", "MUNCK", "UTILITARIO", "OUTRO"] as const;
const tiposDeCombustivel = ["DIESEL_S10", "GASOLINA_COMUM", "ETANOL", "GNV"] as const;

// --- 1. SCHEMA ZOD V4 ---
const veiculoSchema = z.object({
  placa: z.string({ error: "A placa é obrigatória" })
    .length(7, { message: "A placa deve ter exatamente 7 caracteres" })
    .transform(val => val.trim().toUpperCase()),

  modelo: z.string({ error: "O modelo é obrigatório" })
    .min(2, { message: "Modelo muito curto" }),

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
    watch, // Importado para monitorar o tipo
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      modelo: '',
      ano: new Date().getFullYear(),
      tipoVeiculo: 'POLIGUINDASTE', // Default ajustado para um dos novos tipos
      tipoCombustivel: 'DIESEL_S10',
      capacidadeTanque: 0,
      vencimentoCiv: '',
      vencimentoCipp: ''
    },
    mode: 'onBlur'
  });

  // --- ATUALIZAÇÃO 2: Monitorar Tipo para Lógica Condicional ---
  const tipoVeiculoSelecionado = watch('tipoVeiculo');
  const isVacuo = tipoVeiculoSelecionado === 'VACUO';

  const onSubmit = async (data: VeiculoFormValues) => {

    // Tratamento dos dados antes do envio
    const payload = {
      placa: DOMPurify.sanitize(data.placa),
      modelo: DOMPurify.sanitize(data.modelo),
      ano: data.ano,
      tipoVeiculo: data.tipoVeiculo,
      tipoCombustivel: data.tipoCombustivel,

      // Lógica de Negócio: Se não for Vácuo, o tanque é nulo/zero
      capacidadeTanque: isVacuo ? data.capacidadeTanque : null,

      vencimentoCiv: data.vencimentoCiv ? new Date(data.vencimentoCiv).toISOString() : null,
      vencimentoCipp: data.vencimentoCipp ? new Date(data.vencimentoCipp).toISOString() : null,
    };

    const promise = api.post('/veiculo', payload);

    toast.promise(promise, {
      loading: 'Cadastrando equipamento na frota...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 800);
        return `Equipamento ${response.data.placa} cadastrado com sucesso!`;
      },
      error: (err) => {
        console.error("Erro ao cadastrar:", err);
        return err.response?.data?.error || 'Falha ao cadastrar veículo. Verifique os dados.';
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-1">
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

        {/* HEADER VISUAL */}
        <div className="text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-green-200 to-transparent rounded-full" />

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-600 mb-4 shadow-sm ring-4 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>

          <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
            Novo Equipamento
          </h4>
          <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
            Cadastre Poliguindastes, Caminhões Vácuo e Muncks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
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
            label="Modelo"
            placeholder="Ex: VW Constellation 24.280"
            {...register('modelo')}
            error={errors.modelo?.message}
            disabled={isSubmitting}
          />

          {/* Dropdown de Tipos (Atualizado) */}
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo de Equipamento</label>
            <div className="relative group">
              <select
                className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
                {...register('tipoVeiculo')}
                disabled={isSubmitting}
              >
                <option value="">Selecione...</option>
                {tiposDeVeiculo.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-green-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.tipoVeiculo && <p className="mt-1 text-xs text-error animate-pulse">{errors.tipoVeiculo.message}</p>}
          </div>

          <Input
            label="Ano de Fabricação"
            type="number"
            placeholder="2024"
            {...register('ano')}
            error={errors.ano?.message}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1 mt-2">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Combustível</label>
            <div className="relative group">
              <select
                className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
                {...register('tipoCombustivel')}
                disabled={isSubmitting}
              >
                {tiposDeCombustivel.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-green-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.tipoCombustivel && <p className="mt-1 text-xs text-error animate-pulse">{errors.tipoCombustivel.message}</p>}
          </div>

          {/* ATUALIZAÇÃO 3: Input de Tanque Condicional (Só aparece para Vácuo) */}
          {isVacuo && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <Input
                label="Capacidade do Tanque (Litros/M³)"
                type="number"
                placeholder="Ex: 15000"
                {...register('capacidadeTanque')}
                error={errors.capacidadeTanque?.message}
                disabled={isSubmitting}
                className="border-blue-200 focus:border-blue-500 bg-blue-50/30"
              />
              <p className="text-[10px] text-blue-600 mt-1 ml-1 font-medium">* Obrigatório para equipamentos de vácuo</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 mt-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Documentação (Opcional)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-colors hover:border-green-100">
            <Input
              label="Vencimento CIV"
              type="date"
              {...register('vencimentoCiv')}
              error={errors.vencimentoCiv?.message}
              disabled={isSubmitting}
              className="bg-white"
            />
            <Input
              label="Vencimento CIPP"
              type="date"
              {...register('vencimentoCipp')}
              error={errors.vencimentoCipp?.message}
              disabled={isSubmitting}
              className="bg-white"
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
            className="flex-[2] shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Cadastrar Equipamento'}
          </Button>
        </div>
      </form>
    </div>
  );
}