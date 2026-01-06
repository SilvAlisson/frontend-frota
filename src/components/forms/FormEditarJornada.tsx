import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Truck, User, MapPin, FileText, CheckCircle2 } from 'lucide-react';

// --- SCHEMA (Formulário String-First) ---
// Mantemos tudo como string para compatibilidade total com Inputs HTML e React Hook Form.
// A conversão para números reais acontece apenas no onSubmit.
const editJornadaFormSchema = z.object({
  dataInicio: z.string().min(1, 'Data é obrigatória'),
  horaInicio: z.string().min(1, 'Hora é obrigatória'),
  
  // Validamos se é string não vazia. Se precisar validar se é número, usamos regex ou transform.
  kmInicio: z.string().min(1, 'KM é obrigatório'), 
  
  // Opcionais: Aceitam string vazia (quando usuário limpa o campo) ou undefined
  dataFim: z.string().optional(),
  horaFim: z.string().optional(),
  kmFim: z.string().optional(),
  
  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
  operadorId: z.string().min(1, 'Motorista é obrigatório'),
  observacoes: z.string().optional(),
});

// Tipo inferido: Todos os campos são strings (ou undefined), o que satisfaz o TS do RHF
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditJornadaFormData>({
    resolver: zodResolver(editJornadaFormSchema),
    defaultValues: {
      kmInicio: '',
      kmFim: '',
      observacoes: '',
      dataFim: '',
      horaFim: ''
    }
  });

  // --- STYLES ---
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-white border border-border rounded-xl text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer";
  const sectionTitleStyle = "text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2";

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
        // Filtra apenas usuários que podem dirigir
        setOperadores(usersRes.data.filter((u: any) => ['OPERADOR', 'ENCARREGADO'].includes(u.role)));

        const jornada = jornadaRes.data;
        const inicio = new Date(jornada.dataInicio);
        
        // Popula o formulário convertendo números para strings
        const formData: EditJornadaFormData = {
            veiculoId: jornada.veiculoId,
            operadorId: jornada.operadorId,
            kmInicio: String(jornada.kmInicio), // number -> string
            dataInicio: inicio.toISOString().split('T')[0],
            horaInicio: inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            observacoes: jornada.observacoes || '',
            
            // Campos opcionais
            dataFim: '',
            horaFim: '',
            kmFim: ''
        };

        if (jornada.dataFim) {
            const fim = new Date(jornada.dataFim);
            formData.dataFim = fim.toISOString().split('T')[0];
            formData.horaFim = fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            formData.kmFim = jornada.kmFim !== null ? String(jornada.kmFim) : '';
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

  // --- SUBMIT ---
  const onSubmit = async (data: EditJornadaFormData) => {
    setLoading(true);
    try {
      // 1. CONVERSÃO MANUAL E SEGURA (String -> Number/ISO)
      const dataInicioISO = new Date(`${data.dataInicio}T${data.horaInicio}`).toISOString();
      const kmInicioNum = Number(data.kmInicio);

      let dataFimISO = null;
      let kmFimNum = null;

      if (data.dataFim && data.horaFim) {
        dataFimISO = new Date(`${data.dataFim}T${data.horaFim}`).toISOString();
      }

      if (data.kmFim && data.kmFim.trim() !== '') {
        kmFimNum = Number(data.kmFim);
        
        // Validação Lógica Numérica
        if (!isNaN(kmFimNum) && kmFimNum < kmInicioNum) {
            toast.error('O KM Final não pode ser menor que o Inicial.');
            setLoading(false);
            return;
        }
      }

      const payload = {
        dataInicio: dataInicioISO,
        kmInicio: kmInicioNum,
        dataFim: dataFimISO,
        kmFim: kmFimNum, // Envia number ou null
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

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium">Carregando dados da jornada...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col h-full max-h-[90vh]">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-border bg-gray-50 flex justify-between items-center shrink-0">
        <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Editar Jornada
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Corrija dados de saída, chegada ou veículo incorreto.</p>
        </div>
        <button onClick={onCancelar} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
            ✕
        </button>
      </div>

      {/* BODY SCROLLÁVEL */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <form id="form-editar-jornada" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* SEÇÃO 1: VÍNCULOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelStyle}>Veículo</label>
                    <div className="relative">
                        <select {...register('veiculoId')} className={selectStyle}>
                            {veiculos.map(v => (
                                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                            ))}
                        </select>
                        <Truck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.veiculoId && <span className="text-xs text-red-500">{errors.veiculoId.message}</span>}
                </div>

                <div>
                    <label className={labelStyle}>Motorista Responsável</label>
                    <div className="relative">
                        <select {...register('operadorId')} className={selectStyle}>
                            {operadores.map(op => (
                                <option key={op.id} value={op.id}>{op.nome}</option>
                            ))}
                        </select>
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.operadorId && <span className="text-xs text-red-500">{errors.operadorId.message}</span>}
                </div>
            </div>

            {/* SEÇÃO 2: DADOS CRONOLÓGICOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SAÍDA (Verde) */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <div className={`${sectionTitleStyle} text-emerald-700`}>
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                        Registro de Saída
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700/70 mb-1 block">DATA</label>
                                <Input type="date" {...register('dataInicio')} className="bg-white border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                                {errors.dataInicio && <span className="text-xs text-red-500">{errors.dataInicio.message}</span>}
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700/70 mb-1 block">HORA</label>
                                <Input type="time" {...register('horaInicio')} className="bg-white border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                                {errors.horaInicio && <span className="text-xs text-red-500">{errors.horaInicio.message}</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-emerald-700/70 mb-1 block">KM INICIAL (ODÔMETRO)</label>
                            <div className="relative">
                                {/* type="number" apenas para UX mobile (teclado), mas tratado como string */}
                                <Input type="number" {...register('kmInicio')} className="bg-white border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono font-bold text-emerald-800" />
                                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                            </div>
                            {errors.kmInicio && <span className="text-xs text-red-500">{errors.kmInicio.message}</span>}
                        </div>
                    </div>
                </div>

                {/* CHEGADA (Azul) */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className={`${sectionTitleStyle} text-blue-700`}>
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                        Registro de Chegada <span className="text-[10px] font-normal opacity-70 ml-1">(Opcional)</span>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-blue-700/70 mb-1 block">DATA</label>
                                <Input type="date" {...register('dataFim')} className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-blue-700/70 mb-1 block">HORA</label>
                                <Input type="time" {...register('horaFim')} className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500/20" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-blue-700/70 mb-1 block">KM FINAL</label>
                            <div className="relative">
                                <Input type="number" {...register('kmFim')} className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono font-bold text-blue-800" />
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                            </div>
                            {errors.kmFim && <span className="text-xs text-red-500">{errors.kmFim.message}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* OBSERVAÇÕES */}
            <div>
                <label className={labelStyle}>Motivo da Edição / Observações</label>
                <div className="relative">
                    <textarea 
                        {...register('observacoes')}
                        className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none h-24 transition-all bg-gray-50 focus:bg-white"
                        placeholder="Descreva por que esta jornada está sendo alterada (Ex: Erro de digitação no KM inicial...)"
                    />
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                </div>
            </div>

        </form>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-border bg-gray-50 flex justify-end gap-3 shrink-0">
        <Button type="button" variant="ghost" onClick={onCancelar} disabled={loading}>
            Cancelar
        </Button>
        <Button 
            type="submit" 
            form="form-editar-jornada" 
            variant="primary" 
            isLoading={loading}
            className="px-6 shadow-lg shadow-primary/20"
        >
            Salvar Alterações
        </Button>
      </div>

    </div>
  );
}