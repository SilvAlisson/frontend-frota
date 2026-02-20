import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { formatarPlaca } from '../../lib/formatters';

// --- COMPONENTES ELITE ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 
import { toast } from 'sonner';
import { Truck, Save } from 'lucide-react';

// --- CONFIGURAÇÃO DAS CATEGORIAS ---
const CATEGORIAS_VEICULO = ['POLIGUINDASTE', 'VACUO', 'MUNCK', 'LEVE', 'OUTRO'] as const;
const TIPOS_COMBUSTIVEL = ['DIESEL_S10', 'GASOLINA_COMUM', 'ETANOL', 'GNV'] as const;

// --- SCHEMA ZOD V4 ---
const veiculoSchema = z.object({
  placa: z.string()
    .min(7, 'A placa deve estar completa')
    .toUpperCase()
    .transform(val => val.trim()),

  modelo: z.string().min(2, 'Modelo é obrigatório'),
  marca: z.string().min(2, 'Marca é obrigatória'),

  ano: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 1900 && v <= new Date().getFullYear() + 1, 'Ano inválido'),

  tipoVeiculo: z.enum(CATEGORIAS_VEICULO),
  tipoCombustivel: z.enum(TIPOS_COMBUSTIVEL),

  capacidadeTanque: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 1, 'Capacidade necessária'),

  kmAtual: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 0, 'KM não pode ser negativo'),

  mediaEstimada: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 0.1, 'Informe uma média alvo válida (ex: 3.5)'),

  vencimentoCiv: z.string().optional().nullable(),
  vencimentoCipp: z.string().optional().nullable(),
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
    setValue,
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
      const { mediaEstimada, ...dadosParaEnvio } = data;

      const payload = {
        ...dadosParaEnvio,
        // Limpamos o hífen da placa antes de enviar para garantir consistência
        placa: DOMPurify.sanitize(data.placa.replace('-', '')),
        modelo: DOMPurify.sanitize(data.modelo),
        marca: DOMPurify.sanitize(data.marca),
        vencimentoCiv: data.vencimentoCiv ? new Date(data.vencimentoCiv).toISOString() : null,
        vencimentoCipp: data.vencimentoCipp ? new Date(data.vencimentoCipp).toISOString() : null,
      };

      await api.post('/veiculos', payload);

      toast.success(`Veículo ${payload.placa} cadastrado com sucesso!`);
      reset();
      setTimeout(onSuccess, 500);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao cadastrar. Verifique a placa.';
      toast.error(msg);
    }
  };

  const labelStyle = "block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1";

  // Mapeamentos para os selects customizados
  const categoriaOptions = CATEGORIAS_VEICULO.map(c => ({
      value: c,
      label: c === 'OUTRO' ? 'Outro' : c === 'LEVE' ? 'Veículo Leve' : c === 'VACUO' ? 'Caminhão Vácuo' : c === 'MUNCK' ? 'Caminhão Munck' : 'Poliguindaste'
  }));

  const combustivelOptions = TIPOS_COMBUSTIVEL.map(c => ({
      value: c,
      label: c === 'DIESEL_S10' ? 'Diesel S10' : c === 'GASOLINA_COMUM' ? 'Gasolina Comum' : c === 'ETANOL' ? 'Etanol' : 'Gás Natural (GNV)'
  }));

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Truck className="w-5 h-5" />
            </div>
            Novo Veículo
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Preencha os dados técnicos da frota.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* SEÇÃO: IDENTIFICAÇÃO */}
            <div className="md:col-span-2 flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Identificação</label>
            </div>

            <div className="relative group">
              <Input
                label="Placa do Veículo"
                {...register('placa', {
                  onChange: (e) => {
                    const formatado = formatarPlaca(e.target.value);
                    setValue('placa', formatado);
                  }
                })}
                placeholder="ABC-1234"
                className="uppercase font-mono text-xl font-black tracking-widest text-center focus:ring-primary/30 focus:border-primary transition-all group-focus-within:bg-primary/5"
                maxLength={8}
                autoFocus
                disabled={isSubmitting}
                error={errors.placa?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Marca"
                {...register('marca')}
                placeholder="Ex: Scania"
                disabled={isSubmitting}
                error={errors.marca?.message}
                className="font-bold text-text-main"
              />
              <Input
                label="Ano"
                type="number"
                {...register('ano')}
                placeholder="2024"
                disabled={isSubmitting}
                error={errors.ano?.message}
                className="text-center font-mono font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Modelo Completo"
                {...register('modelo')}
                placeholder="Ex: Constellation 24.280"
                disabled={isSubmitting}
                error={errors.modelo?.message}
              />
            </div>

            {/* SEÇÃO: DADOS TÉCNICOS */}
            <div className="md:col-span-2 flex items-center gap-2 mt-4 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Dados Técnicos</label>
            </div>

            <div>
              <Select
                label="Categoria Operacional"
                options={categoriaOptions}
                {...register('tipoVeiculo')}
                disabled={isSubmitting}
                error={errors.tipoVeiculo?.message}
              />
            </div>

            <div>
              <Select
                label="Tipo de Combustível"
                options={combustivelOptions}
                {...register('tipoCombustivel')}
                disabled={isSubmitting}
                error={errors.tipoCombustivel?.message}
              />
            </div>

            <div className="relative">
              <label className={labelStyle}>Capacidade do Tanque</label>
              <div className="relative">
                <Input
                  type="number"
                  {...register('capacidadeTanque')}
                  placeholder="Ex: 270"
                  disabled={isSubmitting}
                  error={errors.capacidadeTanque?.message}
                  containerClassName="!mb-0"
                  className="font-mono font-bold pr-14"
                />
                <span className="absolute right-4 top-3 text-[10px] text-text-muted font-bold pointer-events-none tracking-widest">LITROS</span>
              </div>
            </div>

            <div className="relative">
              <label className={labelStyle}>Média Alvo de Consumo</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  {...register('mediaEstimada')}
                  placeholder="Ex: 3.5"
                  disabled={isSubmitting}
                  error={errors.mediaEstimada?.message}
                  containerClassName="!mb-0"
                  className="font-mono font-bold pr-14 text-amber-600"
                />
                <span className="absolute right-4 top-3 text-[10px] text-text-muted font-bold pointer-events-none tracking-widest">KM/L</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}>KM Inicial (Odômetro de Entrada)</label>
              <Input
                type="number"
                {...register('kmAtual')}
                placeholder="0"
                disabled={isSubmitting}
                className="font-mono text-xl tracking-tight text-primary font-black bg-primary/5 border-primary/20 focus:border-primary focus:ring-primary/30"
                error={errors.kmAtual?.message}
              />
              <p className="text-[11px] font-bold text-text-secondary mt-1.5 opacity-80">
                Insira o valor exato que consta no painel hoje para definir o "Marco Zero" da telemetria.
              </p>
            </div>

            {/* SEÇÃO: DOCUMENTAÇÃO */}
            <div className="md:col-span-2 flex items-center gap-2 mt-4 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Documentação Regulatória</label>
            </div>

            <div>
              <Input 
                label="Vencimento CIV" 
                type="date" 
                {...register('vencimentoCiv')} 
                disabled={isSubmitting} 
                className="text-text-secondary cursor-pointer" 
              />
            </div>

            <div>
              <Input 
                label="Vencimento CIPP" 
                type="date" 
                {...register('vencimentoCipp')} 
                disabled={isSubmitting} 
                className="text-text-secondary cursor-pointer" 
              />
            </div>

          </div>
        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="w-full sm:w-auto font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto px-10 shadow-button hover:shadow-float-primary font-black uppercase tracking-tight"
          >
            Salvar Veículo
          </Button>
        </div>
      </form>
    </div>
  );
}