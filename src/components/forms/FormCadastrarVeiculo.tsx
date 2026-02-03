import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Truck, Save, AlertCircle, ChevronDown } from 'lucide-react';

// --- CONFIGURAÇÃO DAS CATEGORIAS ---
const CATEGORIAS_VEICULO = ['POLIGUINDASTE', 'VACUO', 'MUNCK', 'LEVE', 'OUTRO'] as const;

// --- SCHEMA ---
const veiculoSchema = z.object({
  placa: z.string()
    .length(7, 'A placa deve ter 7 caracteres')
    .toUpperCase()
    .transform(val => val.trim()),

  modelo: z.string().min(2, 'Modelo é obrigatório'),
  marca: z.string().min(2, 'Marca é obrigatória'),

  ano: z.coerce.number()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser futuro'),

  tipoVeiculo: z.enum(CATEGORIAS_VEICULO),
  tipoCombustivel: z.enum(['DIESEL_S10', 'GASOLINA_COMUM', 'ETANOL', 'GNV']),

  capacidadeTanque: z.coerce.number().min(1, 'Capacidade necessária'),
  kmAtual: z.coerce.number().min(0, 'KM não pode ser negativo'),

  mediaEstimada: z.coerce.number()
    .min(0.1, 'Informe uma média alvo válida (ex: 3.5)'),

  vencimentoCiv: z.string().optional().or(z.literal('')),
  vencimentoCipp: z.string().optional().or(z.literal('')),
});

type VeiculoFormInput = z.input<typeof veiculoSchema>;
type VeiculoFormOutput = z.output<typeof veiculoSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarVeiculo({ onSuccess, onCancelar }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      tipoVeiculo: 'POLIGUINDASTE',
      tipoCombustivel: 'DIESEL_S10',
      kmAtual: 0,
      capacidadeTanque: 0,
      mediaEstimada: 0,
      ano: new Date().getFullYear(),
      placa: '',
      modelo: '',
      marca: '',
      vencimentoCiv: '',
      vencimentoCipp: ''
    },
    mode: 'onBlur'
  });

  const onSubmit = async (data: VeiculoFormOutput) => {
    try {
      // Remove mediaEstimada do envio pois não existe na tabela Veiculo (tratado no backend ou futuro)
      const { mediaEstimada, ...dadosParaEnvio } = data;

      const payload = {
        ...dadosParaEnvio,
        placa: DOMPurify.sanitize(data.placa),
        modelo: DOMPurify.sanitize(data.modelo),
        marca: DOMPurify.sanitize(data.marca),
        vencimentoCiv: data.vencimentoCiv ? new Date(data.vencimentoCiv).toISOString() : null,
        vencimentoCipp: data.vencimentoCipp ? new Date(data.vencimentoCipp).toISOString() : null,
      };

      await api.post('/veiculos', payload);

      toast.success(`Veículo ${data.placa} cadastrado com sucesso!`);
      reset();
      setTimeout(onSuccess, 500);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao cadastrar. Verifique a placa.';
      toast.error(msg);
    }
  };

  // Estilos padronizados
  const labelStyle = "block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background appearance-none";

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Novo Veículo</h3>
          <p className="text-xs text-text-secondary">Preencha os dados técnicos da frota.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Truck className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* SEÇÃO: IDENTIFICAÇÃO */}
            <div className="md:col-span-2 flex items-center gap-2 mb-2 border-b border-border pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full"></span>
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase">Identificação</label>
            </div>

            <div>
              <Input
                label="Placa"
                {...register('placa')}
                placeholder="ABC1D23"
                className="uppercase font-mono tracking-wide font-bold"
                maxLength={7}
                autoFocus
                disabled={isSubmitting}
                error={errors.placa?.message}
              />
            </div>

            <div>
              <Input
                label="Modelo"
                {...register('modelo')}
                placeholder="Ex: Constellation 24.280"
                disabled={isSubmitting}
                error={errors.modelo?.message}
              />
            </div>

            <div>
              <Input
                label="Marca"
                {...register('marca')}
                placeholder="Ex: Volkswagen"
                disabled={isSubmitting}
                error={errors.marca?.message}
              />
            </div>

            <div>
              <Input
                label="Ano Fabricação"
                type="number"
                {...register('ano')}
                placeholder={new Date().getFullYear().toString()}
                disabled={isSubmitting}
                error={errors.ano?.message}
              />
            </div>

            {/* SEÇÃO: DADOS TÉCNICOS */}
            <div className="md:col-span-2 flex items-center gap-2 mt-4 mb-2 border-b border-border pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full"></span>
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase">Dados Técnicos</label>
            </div>

            <div>
              <label className={labelStyle}>Categoria</label>
              <div className="relative">
                <select {...register('tipoVeiculo')} className={selectStyle} disabled={isSubmitting}>
                  <option value="POLIGUINDASTE">Poliguindaste</option>
                  <option value="VACUO">Caminhão Vácuo</option>
                  <option value="MUNCK">Caminhão Munck</option>
                  <option value="LEVE">Veículo Leve</option>
                  <option value="OUTRO">Outro</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.tipoVeiculo && <p className="text-[10px] text-error mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.tipoVeiculo.message}</p>}
            </div>

            <div>
              <label className={labelStyle}>Combustível</label>
              <div className="relative">
                <select {...register('tipoCombustivel')} className={selectStyle} disabled={isSubmitting}>
                  <option value="DIESEL_S10">Diesel S10</option>
                  <option value="GASOLINA_COMUM">Gasolina Comum</option>
                  <option value="ETANOL">Etanol</option>
                  <option value="GNV">GNV</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.tipoCombustivel && <p className="text-[10px] text-error mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.tipoCombustivel.message}</p>}
            </div>

            <div>
              <label className={labelStyle}>Tanque (Litros)</label>
              <div className="relative">
                <Input
                  type="number"
                  {...register('capacidadeTanque')}
                  placeholder="Ex: 270"
                  disabled={isSubmitting}
                  error={errors.capacidadeTanque?.message}
                  containerClassName="!mb-0"
                />
                <span className="absolute right-3 top-3 text-xs text-text-muted font-bold pointer-events-none">L</span>
              </div>
            </div>

            <div>
              <label className={labelStyle}>Média Alvo</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  {...register('mediaEstimada')}
                  placeholder="Ex: 3.5"
                  disabled={isSubmitting}
                  error={errors.mediaEstimada?.message}
                  containerClassName="!mb-0"
                />
                <span className="absolute right-3 top-3 text-xs text-text-muted font-bold pointer-events-none">KM/L</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}>KM Inicial (Odômetro)</label>
              <Input
                type="number"
                {...register('kmAtual')}
                placeholder="0"
                disabled={isSubmitting}
                className="font-mono text-lg"
                error={errors.kmAtual?.message}
              />
              <p className="text-[10px] text-text-muted mt-1 ml-1">Insira o valor exato do painel para o marco zero.</p>
            </div>

            {/* SEÇÃO: DOCUMENTAÇÃO */}
            <div className="md:col-span-2 flex items-center gap-2 mt-4 mb-2 border-b border-border pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full"></span>
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase">Documentação</label>
            </div>

            <div>
              <label className={labelStyle}>Vencimento CIV</label>
              <Input type="date" {...register('vencimentoCiv')} disabled={isSubmitting} />
            </div>

            <div>
              <label className={labelStyle}>Vencimento CIPP</label>
              <Input type="date" {...register('vencimentoCipp')} disabled={isSubmitting} />
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="shadow-button hover:shadow-float px-6"
            icon={<Save className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
          </Button>
        </div>
      </form>
    </div>
  );
}