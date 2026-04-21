import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { toast } from 'sonner';
import { Activity, Plus } from 'lucide-react';
import { useVeiculos } from '../../hooks/useVeiculos';
import { useMemo } from 'react';

const tiposIntervalo = ["KM", "TEMPO"] as const;

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const planoSchema = z.object({
  veiculoId: z.string({ error: "Selecione um veículo" }).min(1, "Veículo obrigatório"),
  descricao: z.string({ error: "Descrição obrigatória" })
    .min(3, "Mínimo 3 letras")
    .transform(val => val.toUpperCase()),
  tipoIntervalo: z.enum(tiposIntervalo, { error: "Tipo inválido" }),

  // Lidando com a conversão de string (input) para number (output)
  valorIntervalo: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 1, "Deve ser maior que zero")
});

type PlanoFormInput = z.input<typeof planoSchema>;
type PlanoFormOutput = z.output<typeof planoSchema>;

interface FormPlanoManutencaoProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormPlanoManutencao({ onSuccess, onCancel }: FormPlanoManutencaoProps) {

  // 📡 DADOS GLOBAIS COM CACHE
  const { data: veiculos = [], isLoading: loadingVeiculos } = useVeiculos();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PlanoFormInput, any, PlanoFormOutput>({
    resolver: zodResolver(planoSchema),
    defaultValues: {
      veiculoId: '',
      descricao: '',
      tipoIntervalo: 'KM',
      valorIntervalo: ''
    },
    mode: 'onBlur'
  });

  const tipoIntervalo = watch('tipoIntervalo');

  // Mapeamento para Select
  const veiculosOptions = useMemo(() => veiculos.map(v => ({
    value: v.id,
    label: `${v.placa} - ${v.modelo}`
  })), [veiculos]);

  const intervaloOptions = useMemo(() => tiposIntervalo.map(t => ({
    value: t,
    label: t === 'KM' ? 'Quilometragem (KM)' : 'Tempo (Meses)'
  })), []);

  // --- CRIAR PLANO ---
  const onSubmit = async (data: PlanoFormOutput) => {
    const promise = api.post('/planos-manutencao', data);

    toast.promise(promise, {
      loading: 'Gravando plano...',
      success: () => {
        reset();
        if (onSuccess) onSuccess();
        return 'Plano de manutenção ativado com sucesso!';
      },
      error: (err) => err.response?.data?.error || 'Ocorreu um erro ao criar o plano.'
    });
  };

  const isLocked = isSubmitting || loadingVeiculos;

  return (
    <form className="space-y-6 pt-4" onSubmit={handleSubmit(onSubmit)}>
      <Select
        label="Veículo Alvo"
        options={veiculosOptions}
        {...register('veiculoId')}
        error={errors.veiculoId?.message}
        disabled={isLocked}
      />

      <Input
        label="Descrição do Serviço"
        placeholder="Ex: TROCA DE ÓLEO DE MOTOR"
        {...register('descricao')}
        error={errors.descricao?.message}
        disabled={isLocked}
        className="uppercase font-bold tracking-wide"
        icon={<Activity className="w-4 h-4 text-text-muted" />}
      />

      <div className="bg-surface-hover/30 p-5 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
          <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">
            Configuração do Ciclo
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Baseado em"
            options={intervaloOptions}
            {...register('tipoIntervalo')}
            disabled={isLocked}
            className="font-bold text-center"
            containerClassName="!mb-0"
          />

          <div className="relative">
            <Input
              label="Intervalo"
              type="number"
              placeholder={tipoIntervalo === 'KM' ? '10000' : '6'}
              {...register('valorIntervalo')}
              error={errors.valorIntervalo?.message}
              disabled={isLocked}
              className="text-center font-mono font-black"
              containerClassName="!mb-0"
            />
            <span className="absolute right-3 top-[32px] text-[9px] font-black text-text-muted pointer-events-none uppercase tracking-widest">
              {tipoIntervalo === 'KM' ? 'KM' : 'MESES'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 text-text-muted" disabled={isLocked}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          className="flex-1 shadow-button hover:shadow-float-primary font-black uppercase tracking-tight"
          disabled={isLocked}
          isLoading={isSubmitting}
          icon={<Plus className="w-5 h-5" />}
        >
          Salvar Plano
        </Button>
      </div>
    </form>
  );
}