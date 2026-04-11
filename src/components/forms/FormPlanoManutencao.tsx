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
import { Modal } from '../ui/Modal';
import { FormRegistrarManutencao } from './FormRegistrarManutencao';

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

export function FormPlanoManutencao() {
  
  // 📡 DADOS GLOBAIS COM CACHE
  const { data: veiculos = [], isLoading: loadingVeiculos } = useVeiculos();

  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [planoParaExecutar, setPlanoParaExecutar] = useState<PlanoManutencao | null>(null);

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
      valorIntervalo: '' // O form inicia vazio para não confundir o usuário
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
      toast.error("Erro ao carregar os planos de manutenção.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchPlanos(); }, []);

  // --- CRIAR PLANO ---
  const onSubmit = async (data: PlanoFormOutput) => {
    const promise = api.post('/planos-manutencao', data);

    toast.promise(promise, {
      loading: 'Gravando plano...',
      success: () => {
        reset();
        fetchPlanos(); 
        return 'Plano de manutenção ativado com sucesso!';
      },
      error: (err) => err.response?.data?.error || 'Ocorreu um erro ao criar o plano.'
    });
  };

  // --- DELETAR PLANO ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este plano de manutenção? Esta ação apagará os alertas futuros.")) return;

    setDeletingId(id);
    try {
      await api.delete(`/planos-manutencao/${id}`);
      setPlanos(prev => prev.filter(p => p.id !== id)); 
      toast.success("Plano desativado e removido.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao tentar remover o plano.");
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in fade-in zoom-in-95 duration-300">

      {/* COLUNA 1: FORMULÁRIO (Sticky) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-surface p-6 sm:p-8 rounded-2xl shadow-float border border-border/60 h-fit lg:sticky lg:top-6">
        <div className="flex items-center gap-4 mb-6 border-b border-border/60 pb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-black text-text-main tracking-tight leading-none">Novo Plano</h4>
            <p className="text-xs text-text-secondary font-medium mt-1">Configure alertas automáticos.</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          
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
            icon={<Activity className="w-4 h-4 text-text-muted"/>}
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

          <Button
            type="submit"
            variant="primary"
            className="w-full shadow-button hover:shadow-float-primary py-6 font-black uppercase tracking-tight"
            disabled={isLocked}
            isLoading={isSubmitting}
            icon={<Plus className="w-5 h-5" />}
          >
            Registrar Plano
          </Button>
        </form>
      </div>

      {/* COLUNA 2: LISTA (Scrollável) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[500px] bg-surface rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        
        <div className="bg-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex items-center justify-between shrink-0">
          <h4 className="text-lg font-black text-text-main flex items-center gap-3 tracking-tight">
            Planos Ativos
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs border border-primary/20 shadow-inner">
              {planos.length}
            </span>
          </h4>
        </div>

        {loadingList ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-60 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">Procurando planos...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4 custom-scrollbar">
            {planos.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-3xl bg-background/30 min-h-[300px] group hover:border-primary/40 transition-colors">
                <div className="p-5 bg-surface rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Activity className="w-10 h-10 text-text-muted/40 group-hover:text-primary/60" />
                </div>
                <p className="text-sm font-black text-text-secondary uppercase tracking-widest">Nenhum plano configurado</p>
                <p className="text-xs text-text-muted mt-2 font-medium">Utilize o formulário ao lado para criar regras de manutenção preventivas.</p>
              </div>
            )}

            {planos.map(plano => (
              <div key={plano.id} className="bg-background p-5 rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
                {/* Faixa Lateral Colorida */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${plano.tipoIntervalo === 'KM' ? 'bg-sky-500' : 'bg-emerald-500'}`} />

                <div className="flex justify-between items-start pl-4 py-1">
                  <div className="flex-1">
                    <h5 className="font-black text-text-main uppercase tracking-tight">{plano.descricao}</h5>
                    <p className="text-xs text-text-secondary font-bold mt-1.5 flex items-center gap-2">
                      <span className="bg-surface px-2 py-1 rounded-md text-text-main border border-border/60 font-mono shadow-sm">
                        {plano.veiculo?.placa || 'N/A'}
                      </span>
                      <span className="text-border/80">•</span>
                      <span className="opacity-80">{plano.veiculo?.modelo || 'Veículo Removido'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => setPlanoParaExecutar(plano)}
                      className="h-9 px-3 text-xs font-black tracking-widest shadow-sm"
                      icon={<Wrench className="w-4 h-4" />}
                    >
                      Lançar OS
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(plano.id)}
                      isLoading={deletingId === plano.id}
                      className="!p-2 h-9 w-9 text-text-muted hover:text-white hover:bg-error rounded-xl transition-colors shadow-sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      title="Desativar Plano"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center pl-4 pt-4 border-t border-border/50 gap-4">
                  
                  {/* Badge de Regra */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Frequência:</span>
                    <span className="text-sm font-black text-text-main bg-surface px-3 py-1 rounded-lg border border-border/60 flex items-center gap-1.5 shadow-sm">
                      {plano.tipoIntervalo === 'KM' ? <Gauge className="w-3.5 h-3.5 text-sky-500" /> : <Calendar className="w-3.5 h-3.5 text-emerald-500" />}
                      {plano.valorIntervalo.toLocaleString('pt-BR')} <span className="text-[10px] text-text-muted">{plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}</span>
                    </span>
                  </div>

                  {/* Badge de Próxima Manutenção */}
                  {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Alvo:</span>
                      <span className="text-sm font-black text-sky-700 bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20 shadow-sm flex items-center gap-1">
                        {plano.kmProximaManutencao.toLocaleString('pt-BR')} <span className="text-[10px] opacity-70">KM</span>
                      </span>
                    </div>
                  )}
                  {plano.tipoIntervalo === 'TEMPO' && plano.dataProximaManutencao && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Alvo:</span>
                      <span className="text-sm font-black text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 shadow-sm flex items-center gap-1">
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

      {/* Modal Lançar OS do Plano */}
      <Modal
        isOpen={!!planoParaExecutar}
        onClose={() => setPlanoParaExecutar(null)}
        title="Executar Plano de Manutenção"
        className="max-w-4xl"
      >
        {planoParaExecutar && (
          <div className="h-[75vh] min-h-[500px] flex flex-col">
            <FormRegistrarManutencao
              planoManutencaoId={planoParaExecutar.id}
              veiculoIdPreSelecionado={planoParaExecutar.veiculoId}
              onSuccess={() => {
                setPlanoParaExecutar(null);
                fetchPlanos(); 
              }}
              onClose={() => setPlanoParaExecutar(null)}
            />
          </div>
        )}
      </Modal>

    </div>
  );
}


