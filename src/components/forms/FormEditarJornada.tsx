import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Truck, User, CheckCircle2, FileText, Save, MapPin, Flag, Loader2 } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 

// --- UTILS ---
import { formatKmVisual, parseKmInteligente } from '../../utils';

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const editJornadaFormSchema = z.object({
  dataInicio: z.string().min(1, 'Data obrigatória'),
  horaInicio: z.string().min(1, 'Hora obrigatória'),
  kmInicio: z.string().min(1, 'KM inicial obrigatório'),

  dataFim: z.string().optional().nullable(),
  horaFim: z.string().optional().nullable(),
  kmFim: z.string().optional().nullable(),

  veiculoId: z.string().min(1, 'Selecione o veículo'),
  operadorId: z.string().min(1, 'Selecione o motorista'),
  observacoes: z.string().optional().nullable(),
});

type EditJornadaFormInput = z.input<typeof editJornadaFormSchema>;
type EditJornadaFormOutput = z.output<typeof editJornadaFormSchema>;

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
  } = useForm<EditJornadaFormInput, any, EditJornadaFormOutput>({
    resolver: zodResolver(editJornadaFormSchema),
    defaultValues: {
      kmInicio: '', kmFim: '', observacoes: '',
      dataFim: '', horaFim: ''
    },
    mode: 'onBlur'
  });

  const veiculoSelecionadoId = watch('veiculoId');

  const veiculosOptions = useMemo(() => veiculos.map(v => ({ 
    value: v.id, 
    label: `${v.placa} - ${v.modelo}` 
  })), [veiculos]);

  const operadoresOptions = useMemo(() => operadores.map(op => ({ 
    value: op.id, 
    label: op.nome 
  })), [operadores]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [veiculosRes, usersRes, jornadaRes] = await Promise.all([
          api.get('/veiculos'),
          api.get('/users'),
          api.get(`/jornadas/${jornadaId}`)
        ]);

        if (!isMounted) return;

        setVeiculos(veiculosRes.data);
        setOperadores(usersRes.data.filter((u: any) => ['OPERADOR', 'ENCARREGADO'].includes(u.role)));

        const jornada = jornadaRes.data;
        const inicio = new Date(jornada.dataInicio);

        const formData: EditJornadaFormInput = {
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
        if (isMounted) {
            toast.error("Falha ao carregar o registo da jornada.");
            onCancelar();
        }
      } finally {
        if (isMounted) setFetching(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [jornadaId, reset, onCancelar]);

  useEffect(() => {
    if (veiculos.length > 0 && veiculoSelecionadoId) {
      const veiculo = veiculos.find((v: any) => v.id === veiculoSelecionadoId);
      if (veiculo) setUltimoKmVeiculo(veiculo.ultimoKm || 0);
    }
  }, [veiculoSelecionadoId, veiculos]);

  const onSubmit = async (data: EditJornadaFormOutput) => {
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
          toast.error(`Inconsistência Operacional: KM de Chegada (${kmFimNum.toLocaleString()}) não pode ser inferior ao KM de Saída (${kmInicioNum.toLocaleString()}).`);
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
      toast.success('Jornada retificada com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Ocorreu um erro ao gravar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = isSubmitting || loading;

  if (fetching) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">A carregar detalhes da operação...</p>
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
            Retificar Jornada
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Ajustes manuais no histórico de viagens.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 space-y-8 custom-scrollbar">

          {/* 1. VÍNCULOS */}
          <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                  <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Vínculos de Frota</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select 
                  label="Veículo Utilizado" 
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2. DADOS DE SAÍDA (VERDE) */}
              <div className="bg-success/5 p-6 rounded-2xl border border-success/20 shadow-sm relative overflow-hidden group hover:border-success/40 transition-colors">
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <MapPin className="w-32 h-32 text-success" />
                </div>
                
                <div className="relative z-10">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2 text-success">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" /> Partida (Origem)
                    </div>
                    
                    <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Data da Saída"
                          type="date"
                          {...register('dataInicio')}
                          error={errors.dataInicio?.message}
                          disabled={isLocked}
                          className="border-success/30 focus:border-success focus:ring-success/20 font-medium"
                          containerClassName="!mb-0"
                        />
                        <Input
                          label="Hora exata"
                          type="time"
                          {...register('horaInicio')}
                          error={errors.horaInicio?.message}
                          disabled={isLocked}
                          className="border-success/30 focus:border-success focus:ring-success/20 font-medium"
                          containerClassName="!mb-0"
                        />
                    </div>
                    <Input
                        label="KM do Painel (Odômetro)"
                        {...register('kmInicio')}
                        onChange={(e) => setValue("kmInicio", formatKmVisual(e.target.value))}
                        error={errors.kmInicio?.message}
                        disabled={isLocked}
                        className="border-success/30 focus:border-success focus:ring-success/20 font-mono font-black text-xl text-success-hover h-12"
                    />
                    </div>
                </div>
              </div>

              {/* 3. DADOS DE CHEGADA (AZUL) */}
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <Flag className="w-32 h-32 text-primary" />
                </div>

                <div className="relative z-10">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-5 flex items-center justify-between text-primary">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Chegada (Destino)
                        </div>
                        <span className="text-[9px] bg-primary/10 px-2 py-0.5 rounded text-primary">Opcional se a viagem estiver em andamento</span>
                    </div>

                    <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Data do Retorno"
                          type="date"
                          {...register('dataFim')}
                          disabled={isLocked}
                          className="border-primary/30 focus:border-primary focus:ring-primary/20 font-medium"
                          containerClassName="!mb-0"
                        />
                        <Input
                          label="Hora exata"
                          type="time"
                          {...register('horaFim')}
                          disabled={isLocked}
                          className="border-primary/30 focus:border-primary focus:ring-primary/20 font-medium"
                          containerClassName="!mb-0"
                        />
                    </div>
                    <Input
                        label="KM Final de Fecho"
                        {...register('kmFim')}
                        onChange={(e) => setValue("kmFim", formatKmVisual(e.target.value))}
                        error={errors.kmFim?.message}
                        disabled={isLocked}
                        className="border-primary/30 focus:border-primary focus:ring-primary/20 font-mono font-black text-xl text-primary h-12"
                    />
                    </div>
                </div>
              </div>
          </div>

          {/* 4. OBSERVAÇÕES */}
          <div className="pt-2">
             <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider ml-1 mb-1.5">
               <FileText className="w-3.5 h-3.5" /> Motivo da Edição / Justificativa
             </label>
             <textarea
               {...register('observacoes')}
               disabled={isLocked}
               className="w-full px-4 py-3 text-sm text-text-main bg-surface border border-border/60 rounded-xl transition-all duration-300 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-text-muted disabled:bg-background/50 disabled:cursor-not-allowed resize-none shadow-sm h-24"
               placeholder="Ex: O motorista inseriu 150000 em vez de 15000. Registo corrigido manualmente por validação."
             />
          </div>

        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 border-t border-border/60 bg-surface-hover/30 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button 
             type="button" 
             variant="ghost" 
             onClick={onCancelar} 
             disabled={isLocked}
             className="w-full sm:w-auto font-bold"
          >
            Descartar Alterações
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            isLoading={isLocked} 
            disabled={isLocked}
            className="w-full sm:w-auto shadow-button hover:shadow-float-primary px-10 font-black uppercase tracking-tight"
            icon={<Save className="w-4 h-4" />}
          >
            Salvar Correção
          </Button>
        </div>
      </form>
    </div>
  );
}