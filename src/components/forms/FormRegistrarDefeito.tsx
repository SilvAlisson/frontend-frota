import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, Camera, Info, CarFront, Wrench, Zap, CircleDashed } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { handleApiError } from '../../services/errorHandler';
import { api } from '../../services/api';
import { useDefeitos } from '../../hooks/useDefeitos';
import { cn } from '../../lib/utils';

interface FormRegistrarDefeitoProps {
  veiculoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIAS = [
  { id: 'PNEU', label: 'Pneu', icon: CircleDashed },
  { id: 'FREIO', label: 'Freios', icon: AlertTriangle },
  { id: 'MOTOR', label: 'Motor', icon: Wrench },
  { id: 'ILUMINACAO', label: 'Elétrica', icon: Zap },
  { id: 'CARROCERIA', label: 'Funilaria', icon: CarFront },
  { id: 'OLEO', label: 'Fluidos', icon: Info },
  { id: 'OUTRO', label: 'Outros', icon: Info },
];

const defeitoSchema = z.object({
  categoria: z.string({ message: 'Selecione uma categoria válida.' }).min(1, 'A categoria do defeito é obrigatória.'),
  descricao: z.string().max(300, 'A descrição deve ter no máximo 300 caracteres').optional(),
  foto: z.instanceof(File, { message: 'Evidência fotográfica obrigatória.' }),
});

type DefeitoFormData = z.infer<typeof defeitoSchema>;

export function FormRegistrarDefeito({ veiculoId, onSuccess, onCancel }: FormRegistrarDefeitoProps) {
  const { registrarDefeito } = useDefeitos();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DefeitoFormData>({
    resolver: zodResolver(defeitoSchema),
    defaultValues: { descricao: '' }
  });

  const categoriaSelecionada = watch('categoria');
  const descricaoTexto = watch('descricao') || '';

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setValue('foto', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearFoto = () => {
    setValue('foto', undefined as unknown as File, { shouldValidate: true });
    setFotoPreview(null);
  };

  const onSubmit = async (data: DefeitoFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', data.foto);
      const resUpload = await api.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await registrarDefeito.mutateAsync({
        veiculoId,
        categoria: data.categoria,
        descricao: data.descricao || '',
        fotoUrl: resUpload.data.url
      });

      onSuccess();
    } catch (err: any) {
      handleApiError(err, 'Não foi possível enviar o registro de defeito.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in duration-300">
      
      {/* Alerta Tático (Pro-Max) */}
      <div className="bg-warning-500/10 border border-warning-500/20 p-4 rounded-[1.25rem] flex items-start gap-4 text-warning-700 dark:text-warning-500 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 relative z-10">
          <span className="font-black text-sm uppercase tracking-wider">Atenção Imediata</span>
          <p className="text-sm font-medium opacity-90 leading-relaxed">Envie a foto do ocorrido. Em emergências graves com o freio ou motor, entre em contato com a base por telefone imediatamente.</p>
        </div>
      </div>

      {/* Grid de Categorias Touch-Friendly */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <label className="text-sm font-black text-text-main uppercase tracking-widest flex gap-2">Categoria <span className="text-error">*</span></label>
           {errors.categoria && <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-md animate-pulse">{errors.categoria.message}</span>}
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 select-none">
          {CATEGORIAS.map(cat => {
            const Icon = cat.icon || Wrench;
            const isActive = categoriaSelecionada === cat.id;
            return (
              <Button
                key={cat.id}
                type="button"
                variant={isActive ? "danger" : "outline"}
                className={cn(
                  "h-auto py-5 px-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 border",
                  isActive 
                    ? "shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[0.98] border-error" 
                    : "hover:border-primary/40 hover:bg-surface-hover hover:scale-105 active:scale-95 border-border/60"
                )}
                onClick={() => setValue('categoria', cat.id, { shouldValidate: true })}
                aria-pressed={isActive}
              >
                <Icon className={cn("w-7 h-7 transition-colors", isActive && "animate-pulse")} />
                <span className="text-[11px] font-black uppercase tracking-wider text-center leading-none mt-1">{cat.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Evidência (Dropzone UI-Pro) */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <label className="text-sm font-black text-text-main uppercase tracking-widest flex gap-2">Registro Fotográfico <span className="text-error">*</span></label>
            {errors.foto && <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-md animate-pulse">{errors.foto.message}</span>}
         </div>
         
         {fotoPreview ? (
           <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border group bg-black shadow-inner">
              <img src={fotoPreview} alt="Preview Defeito" className="w-full h-full object-contain opacity-90 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-sm transition-all duration-300 pointer-events-none">
                <Button 
                  type="button"
                  variant="primary"
                  onClick={clearFoto}
                  className="pointer-events-auto shadow-float text-sm font-black uppercase tracking-widest px-6"
                >
                   Repetir Foto
                </Button>
              </div>
           </div>
         ) : (
           <label className={cn(
             "w-full h-40 sm:h-48 border-2 border-dashed rounded-2xl bg-surface transition-all flex flex-col items-center justify-center gap-4 cursor-pointer text-text-muted group relative overflow-hidden",
             errors.foto ? "border-error/50 bg-error/5" : "border-primary/20 hover:border-primary/50 hover:bg-primary/5"
           )}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-hover/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={cn(
                "p-4 rounded-full transition-all duration-500 relative z-10",
                errors.foto ? "bg-error/10 text-error animate-bounce" : "bg-primary/10 text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              )}>
                <Camera className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-center px-4 relative z-10 group-hover:text-text-main transition-colors">Abrir Câmera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
           </label>
         )}
      </div>

      {/* Observação (Textarea Pro) */}
      <div className="space-y-4">
        <label htmlFor="defeito-desc" className="text-sm font-black text-text-main uppercase tracking-widest flex gap-2">Detalhamento Visual (Opcional)</label>
        <Textarea 
          id="defeito-desc"
          placeholder="Onde é o desgaste? Faz barulho? Descreva resumidamente..."
          {...register('descricao')}
          rows={3}
          maxLength={300}
          className="text-base sm:text-sm resize-none rounded-xl"
        />
        <div className="text-right text-[10px] uppercase font-bold text-text-muted">
          {descricaoTexto.length} / 300
        </div>
      </div>

      {/* Ações Táticas */}
      <div className="flex gap-4 pt-4 border-t border-border/40">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="flex-1 font-black uppercase tracking-widest mt-2 h-14 bg-surface-hover/50">
           Voltar
        </Button>
        <Button 
          type="submit" 
          isLoading={isSubmitting} 
          className="flex-1 font-black uppercase tracking-widest bg-error hover:bg-error-600 text-white mt-2 h-14 shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
        >
          {isSubmitting ? 'Transmitindo...' : 'Transmitir Defeito'}
        </Button>
      </div>

    </form>
  )
}

