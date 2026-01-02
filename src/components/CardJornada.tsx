import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import type { Jornada } from '../types';

// --- Ícones (Inline para não depender de lib externa) ---
const IconImage = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IconSave = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;

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
  mode: 'GESTOR' | 'HISTORICO'; // No futuro podemos adicionar 'OPERADOR' aqui
  onUpdate: () => void; // Callback para recarregar a lista pai
}

export function CardJornada({ jornada, mode, onUpdate }: CardJornadaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      kmInicio: jornada.kmInicio,
      kmFim: jornada.kmFim,
      dataInicio: new Date(jornada.dataInicio).toISOString().slice(0, 16), // Format for datetime-local
      dataFim: jornada.dataFim ? new Date(jornada.dataFim).toISOString().slice(0, 16) : null
    }
  });

  // Função para Salvar Edição
  const onSaveEdit = async (data: EditFormData) => {
    try {
      const payload = {
        kmInicio: data.kmInicio,
        kmFim: data.kmFim || null,
        dataInicio: new Date(data.dataInicio).toISOString(),
        dataFim: data.dataFim ? new Date(data.dataFim).toISOString() : null,
      };

      // Chama a rota de UPDATE (verifique se user.routes.ts tem PUT /jornadas/:id)
      await api.put(`/jornadas/${jornada.id}`, payload);
      
      toast.success("Jornada corrigida com sucesso!");
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao editar jornada.");
    }
  };

  // Função para Excluir
  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja EXCLUIR este registro permanentemente?")) return;
    try {
      await api.delete(`/jornadas/${jornada.id}`);
      toast.success("Registro excluído.");
      onUpdate();
    } catch (err) {
      toast.error("Erro ao excluir.");
    }
  };

  // Função para Finalizar Manualmente (Apenas Gestor e se estiver aberta)
  const handleForceFinish = async () => {
    const kmFimManual = prompt(`A jornada iniciou com ${jornada.kmInicio} KM. Qual o KM Final?`);
    if (!kmFimManual) return;
    
    try {
      await api.put(`/jornadas/finalizar/${jornada.id}`, { 
        kmFim: parseFloat(kmFimManual),
        observacoes: "Finalizado manualmente pelo Gestor"
      });
      toast.success("Jornada finalizada.");
      onUpdate();
    } catch (err) {
      toast.error("Erro ao finalizar.");
    }
  };

  const statusColor = jornada.dataFim ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500';

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all ${statusColor}`}>
        
        {/* HEADER: Motorista e Veículo */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
              {jornada.operador.nome.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{jornada.operador.nome}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700 font-bold border border-gray-200">
                  {jornada.veiculo.placa}
                </span>
                <span>{jornada.veiculo.modelo}</span>
              </div>
            </div>
          </div>

          {/* Botoes de Ação (Apenas Gestor) */}
          <div className="flex gap-1">
            {!isEditing ? (
              <>
                 <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600" onClick={() => setIsEditing(true)} title="Editar Dados">
                   <IconEdit />
                 </Button>
                 {mode === 'GESTOR' && (
                   <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600" onClick={handleDelete} title="Excluir">
                     <IconTrash />
                   </Button>
                 )}
              </>
            ) : (
              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600" onClick={() => setIsEditing(false)} title="Cancelar Edição">
                <IconX />
              </Button>
            )}
          </div>
        </div>

        {/* BODY: Formulário de Edição ou Visualização */}
        {isEditing ? (
          <form onSubmit={handleSubmit(onSaveEdit)} className="space-y-3 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Início (Data/Hora)" type="datetime-local" {...register('dataInicio')} error={errors.dataInicio?.message} />
              <Input label="KM Inicial" type="number" {...register('kmInicio')} error={errors.kmInicio?.message} />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Input label="Fim (Data/Hora)" type="datetime-local" {...register('dataFim')} />
              <Input label="KM Final" type="number" {...register('kmFim')} />
            </div>

            <Button type="submit" variant="primary" className="w-full h-8 text-xs" isLoading={isSubmitting}>
              <IconSave /> Salvar Correção
            </Button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Bloco Início */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase">Saída</p>
              <p className="font-medium text-gray-700">
                {new Date(jornada.dataInicio).toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{jornada.kmInicio.toLocaleString()} km</span>
                {jornada.fotoInicioUrl && (
                  <button onClick={() => setImageModal(jornada.fotoInicioUrl!)} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 underline">
                    <IconImage /> Ver Foto
                  </button>
                )}
              </div>
            </div>

            {/* Bloco Fim */}
            <div className="space-y-1 text-right">
              <p className="text-xs text-gray-400 font-bold uppercase">Chegada</p>
              {jornada.dataFim ? (
                <>
                  <p className="font-medium text-gray-700">
                    {new Date(jornada.dataFim).toLocaleString('pt-BR')}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                     {jornada.fotoFimUrl && (
                      <button onClick={() => setImageModal(jornada.fotoFimUrl!)} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 underline">
                        <IconImage /> Ver Foto
                      </button>
                    )}
                    <span className="font-bold text-gray-900">{jornada.kmFim?.toLocaleString()} km</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-end gap-2">
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                     Em Rota
                   </span>
                   {mode === 'GESTOR' && (
                     <button onClick={handleForceFinish} className="text-xs text-red-500 hover:underline">
                       Finalizar Manualmente
                     </button>
                   )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rodapé: KM Rodados */}
        {jornada.kmFim && !isEditing && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">Distância Percorrida</span>
            <span className="text-sm font-bold text-green-600">
              {jornada.kmFim - jornada.kmInicio} km
            </span>
          </div>
        )}
      </div>

      {/* Modal Simples de Imagem (Zoom) */}
      {imageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setImageModal(null)}>
          <div className="relative max-w-3xl w-full bg-white rounded-lg overflow-hidden shadow-2xl">
            <button className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70" onClick={() => setImageModal(null)}>
              <IconX />
            </button>
            <img src={imageModal} alt="Comprovante" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </>
  );
}