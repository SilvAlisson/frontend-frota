import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 
import { toast } from 'sonner';
import { Trash2, Calendar, Gauge, Wrench, Plus, Activity, Loader2 } from 'lucide-react';
import type { PlanoManutencao } from '../../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../../hooks/useVeiculos';

const tiposIntervalo = ["KM", "TEMPO"] as const;

// --- SCHEMA ---
const planoSchema = z.object({
  veiculoId: z.string({ error: "Selecione um veículo" }).min(1, "Veículo obrigatório"),
  descricao: z.string({ error: "Descrição obrigatória" })
    .min(3, "Mínimo 3 letras")
    .transform(val => val.toUpperCase()),
  tipoIntervalo: z.enum(tiposIntervalo, { error: "Tipo inválido" }),
  valorIntervalo: z.coerce.number({ error: "Informe o intervalo" })
    .min(1, "Deve ser maior que zero"),
});

type PlanoFormInput = z.input<typeof planoSchema>;
type PlanoFormOutput = z.output<typeof planoSchema>;

// ✂️ Removemos "veiculos" das propriedades (Prop Drilling Aniquilado!)
export function FormPlanoManutencao() {
  
  // 📡 DADOS GLOBAIS COM CACHE
  const { data: veiculos = [], isLoading: loadingVeiculos } = useVeiculos();

  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      valorIntervalo: '' as any // Hack para iniciar vazio visualmente
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

  // --- FETCH PLANOS ---
  const fetchPlanos = async () => {
    setLoadingList(true);
    try {
      const response = await api.get<PlanoManutencao[]>('/planos-manutencao');
      setPlanos(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar planos de manutenção.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchPlanos(); }, []);

  // --- CRIAR PLANO ---
  const onSubmit = async (data: PlanoFormOutput) => {
    const promise = api.post('/planos-manutencao', data);

    toast.promise(promise, {
      loading: 'Salvando plano...',
      success: () => {
        reset();
        fetchPlanos(); 
        return 'Plano criado com sucesso!';
      },
      error: (err) => err.response?.data?.error || 'Erro ao criar o plano.'
    });
  };

  // --- DELETAR PLANO ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este plano de manutenção?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/planos-manutencao/${id}`);
      setPlanos(prev => prev.filter(p => p.id !== id)); 
      toast.success("Plano removido.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover plano.");
      fetchPlanos(); 
    } finally {
      setDeletingId(null);
    }
  };

  // --- HELPERS VISUAIS ---
  const formatarDataSegura = (dataStr: string | null | undefined) => {
    if (!dataStr) return '--/--/----';
    try {
      return new Date(dataStr.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch {
      return 'Data Inválida';
    }
  };

  const isLocked = isSubmitting || loadingVeiculos;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* COLUNA 1: FORMULÁRIO (Sticky) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-surface p-6 rounded-xl shadow-lg border border-border h-fit sticky top-6">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-text-main leading-tight">Novo Plano</h4>
            <p className="text-xs text-text-secondary">Configurar alertas automáticos.</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          <Select
            label="Veículo Alvo"
            options={veiculosOptions}
            {...register('veiculoId')}
            error={errors.veiculoId?.message}
            disabled={isLocked}
          />

          <Input
            label="Descrição do Serviço"
            placeholder="Ex: TROCA DE ÓLEO"
            {...register('descricao')}
            error={errors.descricao?.message}
            disabled={isLocked}
            className="uppercase"
            icon={<Activity className="w-4 h-4 text-text-muted"/>}
          />

          <div className="bg-surface-hover/50 p-4 rounded-xl border border-border">
            <label className="block text-xs font-bold text-text-secondary uppercase mb-3 text-center">
              Configuração do Ciclo
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo"
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
                  className="text-center font-mono"
                  containerClassName="!mb-0"
                />
                <span className="absolute right-3 top-[34px] text-[10px] font-bold text-text-muted pointer-events-none uppercase">
                  {tipoIntervalo === 'KM' ? 'KM' : 'MESES'}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full shadow-lg shadow-primary/20"
            disabled={isLocked}
            isLoading={isSubmitting}
            icon={<Plus className="w-4 h-4" />}
          >
            Criar Plano
          </Button>
        </form>
      </div>

      {/* COLUNA 2: LISTA (Scrollável) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-text-main flex items-center gap-2">
            Planos Ativos
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs border border-primary/20">
              {planos.length}
            </span>
          </h4>
        </div>

        {loadingList ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-text-muted">Carregando...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4 custom-scrollbar">
            {planos.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-surface min-h-[300px]">
                <Activity className="w-12 h-12 text-text-muted/50 mb-2" />
                <p className="text-text-secondary text-sm font-medium">Nenhum plano configurado.</p>
                <p className="text-text-muted text-xs mt-1">Utilize o formulário ao lado para criar regras.</p>
              </div>
            )}

            {planos.map(plano => (
              <div key={plano.id} className="bg-surface p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all relative group overflow-hidden">
                {/* Faixa Lateral Colorida */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${plano.tipoIntervalo === 'KM' ? 'bg-sky-500' : 'bg-emerald-500'}`} />

                <div className="flex justify-between items-start pl-3">
                  <div>
                    <h5 className="font-bold text-text-main">{plano.descricao}</h5>
                    <p className="text-xs text-text-secondary font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="bg-surface-hover px-1.5 py-0.5 rounded text-text-main border border-border font-mono">
                        {plano.veiculo?.placa || 'N/A'}
                      </span>
                      <span className="text-border">•</span>
                      <span>{plano.veiculo?.modelo || 'Veículo Removido'}</span>
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(plano.id)}
                    isLoading={deletingId === plano.id}
                    className="!p-1.5 h-8 w-8 text-text-muted hover:text-error hover:bg-error/10 rounded-full"
                    icon={<Trash2 className="w-4 h-4" />}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between pl-3 pt-3 border-t border-border/50">
                  {/* Badge de Regra */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Ciclo:</span>
                    <span className="text-sm font-bold text-text-main bg-surface-hover px-2 py-0.5 rounded border border-border flex items-center gap-1">
                      {plano.tipoIntervalo === 'KM' ? <Gauge className="w-3 h-3 text-sky-500" /> : <Calendar className="w-3 h-3 text-emerald-500" />}
                      {plano.valorIntervalo.toLocaleString('pt-BR')} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
                    </span>
                  </div>

                  {/* Badge de Próxima Manutenção */}
                  {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted font-bold uppercase mr-2">Próxima:</span>
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-100">
                        {plano.kmProximaManutencao.toLocaleString('pt-BR')} <span className="text-[10px]">KM</span>
                      </span>
                    </div>
                  )}
                  {plano.tipoIntervalo === 'TEMPO' && (
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted font-bold uppercase mr-2">Próxima:</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                        {formatarDataSegura(plano.dataProximaManutencao)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}