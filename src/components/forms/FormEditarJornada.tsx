import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Truck, User, Clock, CheckCircle2, Calendar, FileText } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

// --- UTILS ---
import { formatKmVisual, parseKmInteligente } from '../../utils';

// --- SCHEMA ZOD V4 ---
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
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [ultimoKmVeiculo, setUltimoKmVeiculo] = useState<number>(0);

  // Form Setup
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

  // --- DATA FETCHING ---
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

        // Prepara dados iniciais
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

  // Atualiza referência de KM do veículo
  useEffect(() => {
    if (veiculos.length > 0 && veiculoSelecionadoId) {
      const veiculo = veiculos.find((v: any) => v.id === veiculoSelecionadoId);
      if (veiculo) setUltimoKmVeiculo(veiculo.ultimoKm || 0);
    }
  }, [veiculoSelecionadoId, veiculos]);

  // --- SUBMIT ---
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

      // ✅ REMOVIDO: atualizarOdometroVeiculo (Backend agora decide automaticamente)
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

  // --- HELPERS PARA SELECT ---
  const veiculosOptions = useMemo(() => 
    veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
    [veiculos]
  );

  const operadoresOptions = useMemo(() => 
    operadores.map(op => ({ value: op.id, label: op.nome })),
    [operadores]
  );

  const isLocked = isSubmitting || loading;

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white rounded-2xl">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* HEADER */}
      <div className="px-6 pt-6 pb-2 border-b border-gray-100 shrink-0">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" /> Editar Jornada
        </h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">Corrija dados de saída, chegada ou veículo incorreto.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

          {/* 1. VÍNCULOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Veículo"
              options={veiculosOptions}
              icon={<Truck className="w-4 h-4"/>}
              {...register('veiculoId')}
              error={errors.veiculoId?.message}
              disabled={isLocked}
            />
            <Select
              label="Motorista Responsável"
              options={operadoresOptions}
              icon={<User className="w-4 h-4"/>}
              {...register('operadorId')}
              error={errors.operadorId?.message}
              disabled={isLocked}
            />
          </div>

          {/* 2. DADOS DE SAÍDA (VERDE) */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-emerald-700">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" /> Registro de Saída
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="DATA"
                  type="date"
                  icon={<Calendar className="w-4 h-4 text-emerald-400"/>}
                  {...register('dataInicio')}
                  error={errors.dataInicio?.message}
                  disabled={isLocked}
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <Input
                  label="HORA"
                  type="time"
                  icon={<Clock className="w-4 h-4 text-emerald-400"/>}
                  {...register('horaInicio')}
                  error={errors.horaInicio?.message}
                  disabled={isLocked}
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <Input
                label="KM INICIAL (ODÔMETRO)"
                {...register('kmInicio')}
                onChange={(e) => setValue("kmInicio", formatKmVisual(e.target.value))}
                error={errors.kmInicio?.message}
                disabled={isLocked}
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* 3. DADOS DE CHEGADA (AZUL) */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-blue-700">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full" /> 
              Registro de Chegada <span className="text-[10px] font-normal opacity-70 ml-1">(Opcional)</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="DATA"
                  type="date"
                  icon={<Calendar className="w-4 h-4 text-blue-400"/>}
                  {...register('dataFim')}
                  disabled={isLocked}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <Input
                  label="HORA"
                  type="time"
                  icon={<Clock className="w-4 h-4 text-blue-400"/>}
                  {...register('horaFim')}
                  disabled={isLocked}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <Input
                label="KM FINAL"
                icon={<CheckCircle2 className="w-4 h-4 text-blue-400"/>}
                {...register('kmFim')}
                onChange={(e) => setValue("kmFim", formatKmVisual(e.target.value))}
                error={errors.kmFim?.message}
                disabled={isLocked}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono font-bold text-blue-800"
              />
            </div>
          </div>

          {/* 4. OBSERVAÇÕES */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Motivo da Edição / Observações
            </label>
            <div className="relative">
              <textarea
                {...register('observacoes')}
                disabled={isLocked}
                className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none h-24 transition-all bg-gray-50 focus:bg-white"
                placeholder="Descreva por que esta jornada está sendo alterada..."
              />
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onCancelar} disabled={isLocked}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={isLocked} 
            disabled={isLocked}
            className="px-6 shadow-lg shadow-primary/20"
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}