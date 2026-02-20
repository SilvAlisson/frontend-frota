import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Save, AlertTriangle, Gauge, Truck, Fuel, Activity, Calendar, Loader2, Info } from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 

// --- UTILS ---
import { formatKmVisual, parseDecimal } from '../../utils';

const tiposDeVeiculo = ["POLIGUINDASTE", "VACUO", "MUNCK", "UTILITARIO", "LEVE", "OUTRO"] as const;
const tiposDeCombustivel = ["DIESEL_S10", "GASOLINA_COMUM", "ETANOL", "GNV"] as const;
const statusVeiculo = ["ATIVO", "EM_MANUTENCAO", "INATIVO"] as const;

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const veiculoSchema = z.object({
  placa: z.string({ error: "Placa obrigatória" })
    .length(8, { message: "Placa deve ter 7 caracteres + hífen" })
    .transform(val => val.trim().toUpperCase()),

  marca: z.string({ error: "Marca é obrigatória" }).min(2, { message: "Preencha a marca" }),
  modelo: z.string({ error: "Modelo é obrigatório" }).min(1, { message: "Preencha o modelo" }),

  ano: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 1900 && v <= new Date().getFullYear() + 1, "Ano inválido"),

  tipoVeiculo: z.enum(tiposDeVeiculo),
  tipoCombustivel: z.enum(tiposDeCombustivel).default('DIESEL_S10'),
  
  capacidadeTanque: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v > 0, "Inválido").optional(),
  
  status: z.enum(statusVeiculo).default('ATIVO'),

  // O KM vem como string formatada no visual, transformamos antes do submit
  ultimoKm: z.string().min(1, "KM é obrigatório"),

  vencimentoCiv: z.string().optional().nullable(),
  vencimentoCipp: z.string().optional().nullable(),
});

type VeiculoFormInput = z.input<typeof veiculoSchema>;
type VeiculoFormOutput = z.output<typeof veiculoSchema>;

interface FormEditarVeiculoProps {
  veiculoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarVeiculo({ veiculoId, onSuccess, onCancelar }: FormEditarVeiculoProps) {
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({ 
    resolver: zodResolver(veiculoSchema),
    mode: 'onBlur'
  });

  // Opções para Selects Mapeadas para legibilidade
  const tipoVeiculoOptions = useMemo(() => tiposDeVeiculo.map(t => ({ 
      label: t === 'OUTRO' ? 'Outro' : t === 'LEVE' ? 'Veículo Leve' : t === 'VACUO' ? 'Caminhão Vácuo' : t === 'MUNCK' ? 'Caminhão Munck' : t === 'UTILITARIO' ? 'Utilitário' : 'Poliguindaste', 
      value: t 
  })), []);
  
  const combustivelOptions = useMemo(() => tiposDeCombustivel.map(t => ({ 
      label: t === 'DIESEL_S10' ? 'Diesel S10' : t === 'GASOLINA_COMUM' ? 'Gasolina Comum' : t === 'ETANOL' ? 'Etanol' : 'Gás Natural (GNV)', 
      value: t 
  })), []);
  
  const statusOptions = useMemo(() => [
    { label: '🟢 Ativo (Em Operação)', value: 'ATIVO' },
    { label: '🔧 Em Manutenção (Oficina)', value: 'EM_MANUTENCAO' },
    { label: '🔴 Inativo (Baixado/Vendido)', value: 'INATIVO' }
  ], []);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (!veiculoId) return;
    
    let isMounted = true;
    
    const fetchVeiculo = async () => {
      setLoadingData(true);
      try {
        const { data: veiculo } = await api.get(`/veiculos/${veiculoId}`);
        if (!isMounted) return;

        const tipoVeiculoSafe = tiposDeVeiculo.includes(veiculo.tipoVeiculo as any) ? veiculo.tipoVeiculo : 'OUTRO';
        const tipoCombustivelSafe = tiposDeCombustivel.includes(veiculo.tipoCombustivel as any) ? veiculo.tipoCombustivel : 'DIESEL_S10';
        
        // Garante que a placa entra formatada com hífen no formulário caso venha sem do backend
        let placaFormatada = veiculo.placa || '';
        if (placaFormatada.length === 7 && !placaFormatada.includes('-')) {
            placaFormatada = `${placaFormatada.substring(0, 3)}-${placaFormatada.substring(3)}`;
        }

        reset({
          placa: placaFormatada,
          marca: veiculo.marca || '',
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          tipoVeiculo: (tipoVeiculoSafe as any),
          tipoCombustivel: (tipoCombustivelSafe as any),
          capacidadeTanque: veiculo.capacidadeTanque || 0,
          status: veiculo.status || 'ATIVO',
          ultimoKm: formatKmVisual(veiculo.ultimoKm),
          vencimentoCiv: veiculo.vencimentoCiv ? new Date(veiculo.vencimentoCiv).toISOString().split('T')[0] : '',
          vencimentoCipp: veiculo.vencimentoCipp ? new Date(veiculo.vencimentoCipp).toISOString().split('T')[0] : ''
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
            toast.error('Erro ao aceder à ficha do veículo.');
            onCancelar();
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };
    fetchVeiculo();
    
    return () => { isMounted = false; };
  }, [veiculoId, reset, onCancelar]);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("ultimoKm", formatKmVisual(e.target.value));
  };

  const onSubmit = async (data: VeiculoFormOutput) => {
    const formatarDataIsoSegura = (dateStr: string | null | undefined) => {
      if (!dateStr) return null;
      return new Date(`${dateStr}T12:00:00`).toISOString();
    };

    const payload = {
      ...data,
      placa: data.placa.replace('-', ''), // Removemos o hífen antes de enviar para DB
      vencimentoCiv: formatarDataIsoSegura(data.vencimentoCiv),
      vencimentoCipp: formatarDataIsoSegura(data.vencimentoCipp),
      capacidadeTanque: data.capacidadeTanque || null,
      tipoVeiculo: data.tipoVeiculo || null,
      kmAtual: parseDecimal(data.ultimoKm) 
    };

    try {
      await api.put(`/veiculos/${veiculoId}`, payload);
      toast.success('Registo do Veículo atualizado com sucesso!');
      onSuccess();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.error || 'Falha ao salvar as alterações. Verifique os dados.';
      toast.error(msg);
    }
  };

  if (loadingData) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">A abrir Registo do Veículo...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Truck className="w-5 h-5" />
            </div>
            Editar Veículo
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Atualize especificações técnicas e operacionais da frota.</p>
        </div>
      </div>

      <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit(onSubmit)}>

        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">

          {/* SECÇÃO 1: IDENTIFICAÇÃO */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Identificação Principal</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative group">
                <Input
                  label="Matrícula / Placa (Imutável)"
                  {...register('placa')}
                  disabled
                  className="bg-surface-hover/50 text-text-muted cursor-not-allowed font-mono text-xl text-center font-black uppercase border-border/60 tracking-widest"
                />
              </div>
              <Input
                label="Marca"
                placeholder="Ex: Mercedes-Benz"
                {...register('marca')}
                error={errors.marca?.message}
                disabled={isSubmitting}
                className="font-bold text-text-main"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Modelo"
                {...register('modelo')}
                error={errors.modelo?.message}
                disabled={isSubmitting}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ano Fabrico"
                  type="number"
                  {...register('ano')}
                  error={errors.ano?.message}
                  disabled={isSubmitting}
                  className="text-center font-mono font-bold"
                />
                <Select
                  label="Categoria"
                  options={tipoVeiculoOptions}
                  icon={<Truck className="w-4 h-4 text-text-muted"/>}
                  {...register('tipoVeiculo')}
                  error={errors.tipoVeiculo?.message}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* --- ÁREA DE CORREÇÃO DE ODÔMETRO (DESTAQUE VISUAL) --- */}
          <section className="bg-warning-500/5 p-6 rounded-2xl border border-warning-500/20 shadow-sm relative overflow-hidden group hover:border-warning-500/40 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle className="w-32 h-32 text-warning-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-warning-500/20">
                  <div className="bg-warning-500/20 p-1.5 rounded-lg shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-warning-600" />
                  </div>
                  <h4 className="text-[11px] font-black text-warning-700 uppercase tracking-widest">
                    Ajuste Manual de Quilometragem
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative group">
                        <Input
                            {...register('ultimoKm')}
                            onChange={(e) => { register('ultimoKm').onChange(e); handleKmChange(e); }}
                            className="bg-surface border-warning-500/40 focus:border-warning-500 focus:ring-warning-500/20 font-mono text-2xl font-black text-warning-600 tracking-wider h-14 pr-12 shadow-sm"
                            placeholder="0"
                            disabled={isSubmitting}
                            error={errors.ultimoKm?.message}
                            containerClassName="!mb-0"
                        />
                        <Gauge className="absolute right-4 top-4 w-6 h-6 text-warning-500/60 group-focus-within:text-warning-500 transition-colors pointer-events-none" />
                    </div>
                    
                    <p className="text-[10px] text-warning-700 leading-relaxed font-medium">
                        <strong className="block mb-1">Cuidado: Área sensível!</strong> 
                        Altere este valor apenas para corrigir discrepâncias graves inseridas pelos operadores (ex: 300.000 em vez de 30.000). Isto irá sobreescrever a base e forçar este novo KM como "Marco Zero" para as próximas viagens.
                    </p>
                </div>
            </div>
          </section>

          {/* SECÇÃO 3: ESPECIFICAÇÕES E STATUS */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Especificações Técnicas</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Combustível"
                options={combustivelOptions}
                icon={<Fuel className="w-4 h-4 text-text-muted"/>}
                {...register('tipoCombustivel')}
                error={errors.tipoCombustivel?.message}
                disabled={isSubmitting}
              />
              <div className="relative">
                <Input
                    label="Capacidade do Tanque"
                    type="number"
                    {...register('capacidadeTanque')}
                    error={errors.capacidadeTanque?.message}
                    disabled={isSubmitting}
                    className="font-mono font-bold pr-14"
                />
                <span className="absolute right-4 top-10 text-[10px] text-text-muted font-bold pointer-events-none tracking-widest">LITROS</span>
              </div>
            </div>

            <div className="pt-2">
              <Select
                label="Status Operacional"
                options={statusOptions}
                icon={<Activity className="w-4 h-4 text-text-muted"/>}
                {...register('status')}
                error={errors.status?.message}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-text-muted mt-1.5 ml-1 font-medium flex items-center gap-1">
                <Info className="w-3 h-3" /> Veículos marcados como "Inativo" não aparecerão na lista para os motoristas iniciarem viagens.
              </p>
            </div>
          </section>

          {/* SECÇÃO 4: DOCUMENTAÇÃO */}
          <section className="space-y-5 pt-2">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Prazos e Licenças</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Validade do CIV"
                type="date"
                icon={<Calendar className="w-4 h-4 text-primary/70"/>}
                {...register('vencimentoCiv')}
                error={errors.vencimentoCiv?.message}
                disabled={isSubmitting}
              />
              <Input
                label="Validade do CIPP"
                type="date"
                icon={<Calendar className="w-4 h-4 text-primary/70"/>}
                {...register('vencimentoCipp')}
                error={errors.vencimentoCipp?.message}
                disabled={isSubmitting}
              />
            </div>
          </section>

        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto font-bold"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Descartar Alterações
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto shadow-button hover:shadow-float-primary px-10 font-black uppercase tracking-tight"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={<Save className="w-4 h-4"/>}
          >
            Gravar Veículo
          </Button>
        </div>

      </form>
    </div>
  );
}