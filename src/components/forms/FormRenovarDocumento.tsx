import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { useRenovarDocumento } from '../../hooks/useDocumentosLegais';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { FileText, RefreshCcw, UploadCloud, Loader2 } from 'lucide-react';
import { uploadToR2 } from '../../services/uploadService';

const renovarDocumentoSchema = z.object({
  titulo: z.string().min(3, "O título precisa ter pelo menos 3 letras"),
  arquivoUrl: z.string({ error: "É necessário anexar um arquivo" }).url("Faça o upload do novo arquivo"),
  descricao: z.string().optional(),
  dataValidade: z.string().optional().nullable(),
});

type RenovarDocumentoFormData = z.infer<typeof renovarDocumentoSchema>;

interface FormRenovarDocumentoProps {
  documentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormRenovarDocumento({ documentoId, onSuccess, onCancel }: FormRenovarDocumentoProps) {
  const [docOriginal, setDocOriginal] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { mutateAsync: renovar, isPending: isSaving } = useRenovarDocumento();

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<RenovarDocumentoFormData>({
    resolver: zodResolver(renovarDocumentoSchema),
  });

  const arquivoUrlWatch = watch('arquivoUrl');

  useEffect(() => {
    async function carregarDocumento() {
      try {
        const response = await api.get(`/documentos-legais/${documentoId}`);
        const doc = response.data;
        setDocOriginal(doc);

        reset({
          titulo: `[RENOVAÇÃO] ${doc.titulo}`,
          descricao: '',
          dataValidade: null,
          arquivoUrl: ''
        });
      } catch (err) {
        toast.error("Erro ao carregar dados do documento.");
        onCancel();
      }
    }
    carregarDocumento();
  }, [documentoId, reset, onCancel]);

  // Função simulada de upload da Skill anterior
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `documentos-renovacao-${crypto.randomUUID()}.${fileExt}`;
      const publicUrlString = await uploadToR2(file, fileName, file.type || 'application/octet-stream');

      setValue('arquivoUrl', publicUrlString, { shouldValidate: true });
      toast.success('Novo arquivo anexado com sucesso na nuvem!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fazer upload do arquivo para o Supabase.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (dados: RenovarDocumentoFormData) => {
    try {
      await renovar({ id: documentoId, dados });
      onSuccess();
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  if (!docOriginal) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const showValidade = !['LICENCA_AMBIENTAL', 'AST'].includes(docOriginal.categoria);
  const isFormLocked = isSubmitting || isSaving || isUploading;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ALERTA DE ARQUIVAMENTO */}
      <div className="bg-warning-500/10 border border-warning-500/30 p-4 rounded-2xl flex items-start gap-3">
        <RefreshCcw className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-sm font-black text-warning-700 tracking-tight">O documento original será arquivado</h5>
          <p className="text-xs text-warning-700/80 font-medium mt-1 leading-relaxed">
            Ao confirmar a renovação, a versão atual de <strong className="font-black text-warning-800">{docOriginal.titulo}</strong> constará como Arquivada no Histórico de Renovações e deixará de disparar alertas. Este novo documento assumirá a vigência.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 bg-background/50 border border-border/60 p-5 rounded-2xl border-dashed">
            <label className="text-xs font-black text-text-main uppercase tracking-widest mb-3 block">Novo Arquivo Digital</label>
            {!arquivoUrlWatch ? (
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-border/80 border-dashed rounded-xl cursor-pointer bg-surface hover:bg-surface-hover hover:border-primary/50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-text-muted mb-3" />
                    )}
                    <p className="text-sm text-text-main font-bold">
                      {isUploading ? 'Enviando arquivo...' : 'Clique para enviar o novo PDF/Imagem'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">PDF, JPG ou PNG (Máx. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">Arquivo anexado</p>
                    <p className="text-xs text-primary font-medium tracking-wide">Pronto para envio</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" className="text-error" onClick={() => setValue('arquivoUrl', '')}>
                  Remover
                </Button>
              </div>
            )}
            {errors.arquivoUrl && <p className="text-error text-[11px] font-bold mt-2 flex items-center gap-1">❌ {errors.arquivoUrl.message}</p>}
          </div>

          <div className="md:col-span-2">
            <Input
              label="Título do Novo Documento"
              icon={<FileText className="w-4 h-4 text-text-muted" />}
              {...register('titulo')}
              error={errors.titulo?.message}
              disabled={isFormLocked}
            />
          </div>

          {showValidade ? (
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="dataValidade"
                render={({ field }) => (
                  <DatePicker
                    label="Nova Data de Validade"
                    placeholder="Sem validade"
                    date={field.value ? new Date(`${field.value}T12:00:00`) : undefined}
                    onChange={(newDate) => {
                      field.onChange(newDate ? newDate.toISOString().split('T')[0] : '');
                    }}
                    error={errors.dataValidade?.message}
                    disabled={isFormLocked}
                  />
                )}
              />
            </div>
          ) : null}

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary ml-1">Observações (Opcional)</label>
            <textarea
              {...register('descricao')}
              disabled={isFormLocked}
              className="w-full bg-surface border border-border/60 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-sm min-h-[80px]"
              placeholder="Ex: Pagamento do novo exercício realizado..."
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border/60">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isFormLocked}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" icon={<RefreshCcw className="w-4 h-4" />} isLoading={isSaving} className="shadow-button group" disabled={isFormLocked}>
            <span className="group-hover:scale-105 transition-transform duration-300">Confirmar Renovação</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
