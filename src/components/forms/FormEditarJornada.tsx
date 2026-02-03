import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Truck, User, Clock, CheckCircle2, Calendar, FileText, ChevronDown, Save } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- UTILS ---
import { formatKmVisual, parseKmInteligente } from '../../utils';

// --- SCHEMA ---
const editJornadaFormSchema = z.object({
  dataInicio: z.string().min(1, 'Data é obrigatória'),
  horaInicio: z.string().min(1, 'Hora é obrigatória'),
  kmInicio: z.string().min(1, 'KM é obrigatório'),

  dataFim: z.string().nullish(),
  horaFim: z.string().nullish(),
  kmFim: z.string().nullish(),

  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
  operadorId: z.string().min(1, 'Motorista é obrigatório'),
  observacoes: z.string().nullish(),
});

type EditJornadaFormData = z.infer<typeof editJornadaFormSchema>;

interface FormEditarJornadaProps {
  jornadaId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarJornada({ jornadaId, onSuccess, onCancelar }: FormEditarJornadaProps) {
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [ultimoKmVeiculo, setUltimoKmVeiculo] = useState<number>(0);

  const { 
    register, handleSubmit, reset, setValue, watch, 
    formState: { errors, isSubmitting } 
  } = useForm<EditJornadaFormData>({
    resolver: zodResolver(editJornadaFormSchema),
    defaultValues: {
      kmInicio: '', kmFim: '', observacoes: '',
      dataFim: '', horaFim: ''
    }
  });

  const veiculoSelecionadoId = watch('veiculoId');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [veiculosRes, usersRes, jornadaRes] = await Promise.all([
          api.get('/veiculos'),
          api.get('/users'),
          api.get(`/jornadas/${jornadaId}`)
        ]);

        setVeiculos(veiculosRes.data);
        setOperadores(usersRes.data.filter((u: any) => ['OPERADOR', 'ENCARREGADO'].includes(u.role)));

        const jornada = jornadaRes.data;
        const inicio = new Date(jornada.dataInicio);

        const formData: EditJornadaFormData = {
          veiculoId: jornada.veiculoId,
          operadorId: jornada.operadorId,
          kmInicio: formatKmVisual(jornada.kmInicio),
          dataInicio: inicio.toISOString().split('T')[0],
          horaInicio: inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          observacoes: jornada.observacoes || '',
          dataFim: '',
          horaFim: '',
          kmFim: ''
        };

        if (jornada.dataFim) {
          const fim = new Date(jornada.dataFim);
          formData.dataFim = fim.toISOString().split('T')[0];
          formData.horaFim = fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          formData.kmFim = jornada.kmFim !== null ? formatKmVisual(jornada.kmFim) : '';
        }

        reset(formData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        toast.error("Erro ao carregar dados da jornada.");
        onCancelar();
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [jornadaId, reset, onCancelar]);

  useEffect(() => {
    if (veiculos.length > 0 && veiculoSelecionadoId) {
      const veiculo = veiculos.find((v: any) => v.id === veiculoSelecionadoId);
      if (veiculo) setUltimoKmVeiculo(veiculo.ultimoKm || 0);
    }
  }, [veiculoSelecionadoId, veiculos]);

  const onSubmit = async (data: EditJornadaFormData) => {
    setLoading(true);
    try {
      const dataInicioISO = new Date(`${data.dataInicio}T${data.horaInicio}`).toISOString();
      const kmInicioNum = parseKmInteligente(data.kmInicio, ultimoKmVeiculo);

      let dataFimISO = null;
      let kmFimNum = null;

      if (data.dataFim && data.horaFim) {
        dataFimISO = new Date(`${data.dataFim}T${data.horaFim}`).toISOString();
      }

      if (data.kmFim && data.kmFim.trim() !== '') {
        kmFimNum = parseKmInteligente(data.kmFim, kmInicioNum);
        if (!isNaN(kmFimNum) && kmFimNum < kmInicioNum) {
          toast.error(`Erro: KM Final (${kmFimNum}) não pode ser menor que Inicial (${kmInicioNum}).`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        dataInicio: dataInicioISO,
        kmInicio: kmInicioNum,
        dataFim: dataFimISO,
        kmFim: kmFimNum,
        veiculoId: data.veiculoId,
        operadorId: data.operadorId,
        observacoes: data.observacoes
      };

      await api.put(`/jornadas/${jornadaId}`, payload);
      toast.success('Jornada atualizada com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = isSubmitting || loading;
  const labelStyle = "flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background appearance-none";

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-surface rounded-xl border border-border">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-text-muted font-medium animate-pulse">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">
      
      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Editar Jornada</h3>
          <p className="text-xs text-text-secondary">Corrija dados de saída, chegada ou veículo incorreto.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Truck className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

          {/* 1. VÍNCULOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelStyle}><Truck className="w-3 h-3"/> Veículo</label>
              <div className="relative">
                <select className={selectStyle} {...register('veiculoId')} disabled={isLocked}>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.veiculoId && <p className="text-[10px] text-error mt-1 ml-1">{errors.veiculoId.message}</p>}
            </div>

            <div>
              <label className={labelStyle}><User className="w-3 h-3"/> Motorista</label>
              <div className="relative">
                <select className={selectStyle} {...register('operadorId')} disabled={isLocked}>
                  {operadores.map(op => <option key={op.id} value={op.id}>{op.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.operadorId && <p className="text-[10px] text-error mt-1 ml-1">{errors.operadorId.message}</p>}
            </div>
          </div>

          {/* 2. DADOS DE SAÍDA (VERDE) */}
          <div className="bg-success/5 p-4 rounded-xl border border-success/20">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-success">
              <div className="w-1.5 h-4 bg-success rounded-full" /> Registro de Saída
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="DATA"
                  type="date"
                  icon={<Calendar className="w-4 h-4 text-success"/>}
                  {...register('dataInicio')}
                  error={errors.dataInicio?.message}
                  disabled={isLocked}
                  className="border-success/30 focus:border-success focus:ring-success/20"
                />
                <Input
                  label="HORA"
                  type="time"
                  icon={<Clock className="w-4 h-4 text-success"/>}
                  {...register('horaInicio')}
                  error={errors.horaInicio?.message}
                  disabled={isLocked}
                  className="border-success/30 focus:border-success focus:ring-success/20"
                />
              </div>
              <Input
                label="KM INICIAL (ODÔMETRO)"
                {...register('kmInicio')}
                onChange={(e) => setValue("kmInicio", formatKmVisual(e.target.value))}
                error={errors.kmInicio?.message}
                disabled={isLocked}
                className="border-success/30 focus:border-success focus:ring-success/20 font-mono font-bold text-success-hover"
              />
            </div>
          </div>

          {/* 3. DADOS DE CHEGADA (AZUL) */}
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-primary">
              <div className="w-1.5 h-4 bg-primary rounded-full" /> 
              Registro de Chegada <span className="text-[10px] font-normal opacity-70 ml-1">(Opcional)</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="DATA"
                  type="date"
                  icon={<Calendar className="w-4 h-4 text-primary"/>}
                  {...register('dataFim')}
                  disabled={isLocked}
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                />
                <Input
                  label="HORA"
                  type="time"
                  icon={<Clock className="w-4 h-4 text-primary"/>}
                  {...register('horaFim')}
                  disabled={isLocked}
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                />
              </div>
              <Input
                label="KM FINAL"
                icon={<CheckCircle2 className="w-4 h-4 text-primary"/>}
                {...register('kmFim')}
                onChange={(e) => setValue("kmFim", formatKmVisual(e.target.value))}
                error={errors.kmFim?.message}
                disabled={isLocked}
                className="border-primary/30 focus:border-primary focus:ring-primary/20 font-mono font-bold text-primary"
              />
            </div>
          </div>

          {/* 4. OBSERVAÇÕES */}
          <div className="relative">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1">
              Motivo da Edição / Observações
            </label>
            <div className="relative">
              <textarea
                {...register('observacoes')}
                disabled={isLocked}
                className="w-full p-3 pl-10 border border-border rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none h-24 transition-all bg-surface text-text-main"
                placeholder="Descreva por que esta jornada está sendo alterada..."
              />
              <FileText className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onCancelar} disabled={isLocked}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={isLocked} 
            disabled={isLocked}
            className="px-6 shadow-button hover:shadow-float"
            icon={<Save className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}