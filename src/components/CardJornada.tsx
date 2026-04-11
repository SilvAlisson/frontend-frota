import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ConfirmModal } from './ui/ConfirmModal';
import { Modal } from './ui/Modal';
import { toast } from 'sonner';
import { Image as ImageIcon, Edit, Save, X, Trash2, Camera, AlertCircle, PlayCircle, CheckCircle2 } from 'lucide-react';
import type { Jornada } from '../types';

// --- Schema de Edição ---
const editSchema = z.object({
  kmInicio: z.coerce.number().min(1, "KM Inicial inválido"),
  kmFim: z.coerce.number().nullable().optional(),
  dataInicio: z.string().min(1, "Data Início obrigatória"),
  dataFim: z.string().nullable().optional(),
});

type EditFormData = z.input<typeof editSchema>;

interface CardJornadaProps {
  jornada: Jornada;
  mode: 'GESTOR' | 'HISTORICO';
  onUpdate: () => void;
}

export function CardJornada({ jornada, mode, onUpdate }: CardJornadaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);
  
  // ✨ Estados para os Modais de UI Elite
  const [deletingId, setDeletingId] = useState<boolean>(false);
  const [forceFinishModal, setForceFinishModal] = useState<boolean>(false);
  const [kmFimManual, setKmFimManual] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      kmInicio: jornada.kmInicio,
      kmFim: jornada.kmFim,
      dataInicio: new Date(jornada.dataInicio).toISOString().slice(0, 16),
      dataFim: jornada.dataFim ? new Date(jornada.dataFim).toISOString().slice(0, 16) : null
    }
  });

  const onSaveEdit = async (data: EditFormData) => {
    try {
      const payload = {
        kmInicio: data.kmInicio,
        kmFim: data.kmFim || null,
        dataInicio: new Date(data.dataInicio).toISOString(),
        dataFim: data.dataFim ? new Date(data.dataFim).toISOString() : null,
      };

      await api.put(`/jornadas/${jornada.id}`, payload);

      toast.success("Jornada corrigida com sucesso!");
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao editar jornada.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/jornadas/${jornada.id}`);
      toast.success("Registro excluído permanentemente.");
      setDeletingId(false);
      onUpdate();
    } catch (err) {
      toast.error("Erro ao excluir.");
      setDeletingId(false);
    }
  };

  const handleForceFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmFimManual || isNaN(Number(kmFimManual))) {
        toast.error("Insira um KM válido.");
        return;
    }
    
    const toastId = toast.loading("Encerrando rota...");
    try {
      await api.put(`/jornadas/finalizar/${jornada.id}`, {
        kmFim: parseFloat(kmFimManual),
        observacoes: "Finalizado manualmente pelo Gestor"
      });
      toast.dismiss(toastId);
      toast.success("Jornada finalizada com sucesso!");
      setForceFinishModal(false);
      onUpdate();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erro ao finalizar a rota.");
    }
  };

  // ✨ Variações semânticas para o Modo Escuro e Claro
  const statusColor = jornada.dataFim 
    ? 'border-l-4 border-l-success' 
    : 'border-l-4 border-l-info';

  return (
    <>
      <div className={`bg-surface rounded-2xl shadow-sm border border-border/60 p-5 hover:shadow-md transition-all duration-300 group ${statusColor}`}>

        {/* HEADER: Motorista e Veículo */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center font-black text-text-muted border border-border/50 shadow-inner">
              {jornada.operador?.nome?.trim().charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h4 className="font-black text-text-main tracking-tight leading-none mb-1.5">
                {jornada.operador?.nome || 'Operador não identificado'}
              </h4>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="bg-surface-hover/80 px-2 py-0.5 rounded-md font-mono font-bold border border-border/60 tracking-widest uppercase">
                  {jornada.veiculo?.placa || 'Sem placa'}
                </span>
                <span className="font-medium truncate max-w-[120px]">
                  {jornada.veiculo?.modelo || 'Veículo desc.'}
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação (Gestor) */}
          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            {!isEditing ? (
              <>
                <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => setIsEditing(true)} title="Editar Dados">
                  <Edit className="w-4 h-4" />
                </Button>
                {mode === 'GESTOR' && (
                  <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-xl" onClick={() => setDeletingId(true)} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            ) : (
              <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl bg-surface-hover/50" onClick={() => setIsEditing(false)} title="Cancelar Edição">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* BODY: Formulário de Edição ou Visualização */}
        {isEditing ? (
          <form onSubmit={handleSubmit(onSaveEdit)} className="space-y-4 bg-surface-hover/30 p-4 rounded-xl border border-border/60 animate-in fade-in zoom-in-95 duration-200 shadow-inner">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Saída (Data/Hora)" type="datetime-local" {...register('dataInicio')} error={errors.dataInicio?.message} containerClassName="!mb-0" className="text-xs" />
              <Input label="KM Inicial" type="number" {...register('kmInicio')} error={errors.kmInicio?.message} containerClassName="!mb-0" className="font-mono text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Chegada (Data/Hora)" type="datetime-local" {...register('dataFim')} containerClassName="!mb-0" className="text-xs" />
              <Input label="KM Final" type="number" {...register('kmFim')} containerClassName="!mb-0" className="font-mono text-xs" />
            </div>
            <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full h-10 text-xs font-bold shadow-sm" isLoading={isSubmitting}>
                  <Save className="w-4 h-4" /> Salvar Correção
                </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm relative">
            {/* Linha conectora de design */}
            <div className="absolute top-1/2 left-[20%] right-[20%] h-px border-t border-dashed border-border/80 -translate-y-1/2 -z-10 hidden sm:block"></div>

            {/* Bloco Início */}
            <div className="space-y-1.5 bg-surface p-3 rounded-xl border border-border/40 relative z-10">
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <PlayCircle className="w-3 h-3 text-info" /> Ponto de Partida
              </p>
              <p className="font-medium text-text-main text-xs">
                {new Date(jornada.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <span className="font-mono font-black text-text-main text-sm">{jornada.kmInicio.toLocaleString()} km</span>
                {jornada.fotoInicioUrl && (
                  <button onClick={() => setImageModal(jornada.fotoInicioUrl!)} className="text-info hover:text-info/80 transition-colors ml-auto" title="Ver foto do painel">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bloco Fim */}
            <div className="space-y-1.5 bg-surface p-3 rounded-xl border border-border/40 relative z-10">
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] flex items-center gap-1.5 justify-end">
                 Ponto de Chegada <CheckCircle2 className="w-3 h-3 text-success" /> 
              </p>
              {jornada.dataFim ? (
                <>
                  <p className="font-medium text-text-main text-xs text-right">
                    {new Date(jornada.dataFim).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                    {jornada.fotoFimUrl && (
                      <button onClick={() => setImageModal(jornada.fotoFimUrl!)} className="text-success hover:text-success/80 transition-colors mr-auto" title="Ver foto do painel final">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                    <span className="font-mono font-black text-text-main text-sm">{jornada.kmFim?.toLocaleString()} km</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-end gap-2 pt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-info/10 text-info border border-info/20 animate-pulse shadow-sm">
                    Em Rota Atual
                  </span>
                  {mode === 'GESTOR' && (
                    <button onClick={() => setForceFinishModal(true)} className="text-[10px] text-error font-bold hover:underline underline-offset-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Encerrar Manual
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rodapé: KM Rodados */}
        {jornada.kmFim && !isEditing && (
          <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-center bg-surface-hover/30 px-3 py-2 -mx-2 -mb-2 rounded-b-xl">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Distância Total Percorrida</span>
            <span className="text-sm font-mono font-black text-success">
              {jornada.kmFim - jornada.kmInicio} km
            </span>
          </div>
        )}
      </div>

      {/* ✨ VISUALIZADOR DE FOTOS PADRONIZADO E CHIQUE */}
      {imageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300" onClick={() => setImageModal(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <button className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white hover:text-error bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-all z-50 shadow-lg cursor-pointer" onClick={() => setImageModal(null)}>
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <img src={imageModal} alt="Comprovante de Odómetro" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()} />
            <p className="text-white/60 mt-6 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-4 h-4"/> Registro do Painel
            </p>
          </div>
        </div>
      )}

      {/* ✨ MODAIS SUBSTITUTOS DOS ALERTAS NATIVOS */}
      <ConfirmModal 
        isOpen={deletingId}
        onCancel={() => setDeletingId(false)}
        onConfirm={handleDelete}
        title="Excluir Jornada"
        description="Tem certeza que deseja excluir esta viagem dos Registros globais da empresa? A quilometragem do veículo será afetada."
        variant="danger"
        confirmLabel="Sim, Excluir Viagem"
      />

      <Modal
        isOpen={forceFinishModal}
        onClose={() => setForceFinishModal(false)}
        title="Encerramento Manual de Rota"
      >
         <form onSubmit={handleForceFinish} className="space-y-6">
            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex gap-3 text-warning-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">A jornada começou com <strong className="font-mono">{jornada.kmInicio} km</strong>. Insira a quilometragem exata marcada no painel neste momento.</p>
            </div>
            <Input 
                label="Odómetro Final (KM)" 
                type="number" 
                placeholder="Ex: 15400"
                value={kmFimManual}
                onChange={(e) => setKmFimManual(e.target.value)}
                autoFocus
                className="font-mono font-black text-lg text-primary"
            />
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" onClick={() => setForceFinishModal(false)} type="button">Cancelar</Button>
                <Button variant="primary" type="submit">Gravar Odómetro</Button>
            </div>
         </form>
      </Modal>
    </>
  );
}


