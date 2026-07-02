import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAso } from '../../hooks/useAso';
import type { AsoForm } from '../../hooks/useAso';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { HeartPulse, UploadCloud, Loader2, Trash2, Calendar, FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { uploadToR2 } from '../../services/uploadService';
import { toast } from 'sonner';
import { DateHelper } from '../../lib/dateHelper';
import { useModalStore } from '../../hooks/useModalStore';

const ASO_LABELS: Record<string, string> = {
  'ADMISSIONAL': 'Admissional',
  'PERIODICO': 'Periódico',
  'MUDANCA_RISCO': 'Mudança de Risco',
  'RETORNO_TRABALHO': 'Retorno ao Trabalho',
  'DEMISSIONAL': 'Demissional'
};

const asoFormSchema = z.object({
  tipo: z.enum(['ADMISSIONAL', 'PERIODICO', 'MUDANCA_RISCO', 'RETORNO_TRABALHO', 'DEMISSIONAL'], { required_error: 'Selecione o tipo de ASO' }),
  dataRealizacao: z.string().min(1, 'Data de realização é obrigatória'),
  dataVencimento: z.string().optional(),
  resultado: z.enum(['APTO', 'INAPTO'], { required_error: 'Selecione o resultado' }),
  medico: z.string().optional(),
  crm: z.string().optional(),
});

type AsoFormData = z.infer<typeof asoFormSchema>;

interface AbaAsoProps {
  userId: string;
}

export function AbaAso({ userId }: AbaAsoProps) {
  const { listarQuery, criarMutation, deletarMutation } = useAso(userId);
  const { data: asos, isLoading } = listarQuery;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { openModal, closeModal } = useModalStore();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AsoFormData>({
    resolver: zodResolver(asoFormSchema),
    defaultValues: { resultado: 'APTO' }
  });

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (data: AsoFormData) => {
    try {
      setIsUploading(true);
      let comprovanteUrl = undefined;

      if (arquivo) {
        toast.loading('Fazendo upload do comprovante...', { id: 'upload-aso' });
        comprovanteUrl = await uploadToR2(arquivo, 'asos');
        toast.success('Upload concluído!', { id: 'upload-aso' });
      }

      await toast.promise(criarMutation.mutateAsync({
        ...data,
        userId,
        comprovanteUrl,
        dataVencimento: data.dataVencimento || null,
      } as any), {
        loading: 'Registrando ASO...',
        success: 'ASO registrado com sucesso!',
        error: 'Erro ao registrar ASO'
      });

      reset();
      setArquivo(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.dismiss('upload-aso');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusInfo = (vencimento: string | null | undefined) => {
    if (!vencimento) return { label: 'Válido', color: 'text-success', bg: 'bg-success/10' };
    const [year, month, day] = vencimento.split('T')[0].split('-').map(Number);
    const vencUTC = Date.UTC(year, month - 1, day);
    const now = new Date();
    const hojeUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.ceil((vencUTC - hojeUTC) / (1000 * 3600 * 24));

    if (days < 0) return { label: 'Vencido', color: 'text-error', bg: 'bg-error/10' };
    if (days < 30) return { label: 'Expira Brevemente', color: 'text-warning-600', bg: 'bg-warning-500/10' };
    return { label: 'Válido', color: 'text-success', bg: 'bg-success/10' };
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-primary" /> Histórico de ASOs
        </h3>
        <Button onClick={() => setIsFormOpen(!isFormOpen)} variant={isFormOpen ? "secondary" : "primary"}>
          {isFormOpen ? 'Cancelar' : 'Registrar Novo ASO'}
        </Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-hover p-6 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-bold text-text-secondary mb-1.5 block">Tipo de ASO</label>
              <select {...register('tipo')} className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                <option value="">Selecione...</option>
                <option value="ADMISSIONAL">Admissional</option>
                <option value="PERIODICO">Periódico</option>
                <option value="MUDANCA_RISCO">Mudança de Risco</option>
                <option value="RETORNO_TRABALHO">Retorno ao Trabalho</option>
                <option value="DEMISSIONAL">Demissional</option>
              </select>
              {errors.tipo && <span className="text-error text-xs font-medium mt-1">{errors.tipo.message}</span>}
            </div>
            
            <div>
              <label className="text-sm font-bold text-text-secondary mb-1.5 block">Data de Realização</label>
              <Input type="date" {...register('dataRealizacao')} />
              {errors.dataRealizacao && <span className="text-error text-xs font-medium mt-1">{errors.dataRealizacao.message}</span>}
            </div>

            <div>
              <label className="text-sm font-bold text-text-secondary mb-1.5 block">Data de Vencimento</label>
              <Input type="date" {...register('dataVencimento')} />
            </div>

            <div>
              <label className="text-sm font-bold text-text-secondary mb-1.5 block">Resultado</label>
              <select {...register('resultado')} className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                <option value="APTO">Apto</option>
                <option value="INAPTO">Inapto</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-text-secondary mb-1.5 block">Médico Coordenador</label>
              <Input placeholder="Nome do Médico" {...register('medico')} />
            </div>

            <div>
              <label className="text-sm font-bold text-text-secondary mb-1.5 block">CRM</label>
              <Input placeholder="CRM do Médico" {...register('crm')} />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-bold text-text-secondary mb-1.5 block">Comprovante ASO (PDF/Imagem)</label>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center cursor-pointer hover:bg-primary/5 transition-colors group"
            >
              {arquivo ? (
                <div className="flex flex-col items-center">
                  <FileCheck className="w-8 h-8 text-primary mb-2" />
                  <span className="font-medium text-text-main">{arquivo.name}</span>
                  <span className="text-xs text-text-muted mt-1">Clique para trocar de arquivo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-8 h-8 text-primary/50 group-hover:text-primary mb-2 transition-colors" />
                  <span className="font-bold text-text-main">Clique para selecionar o comprovante</span>
                  <span className="text-xs text-text-muted mt-1">PDF, JPG, PNG (Max. 5MB)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isUploading || criarMutation.isPending}>
              {isUploading || criarMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar ASO'}
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {asos && asos.length > 0 ? asos.map((aso) => {
          const status = getStatusInfo(aso.dataVencimento);
          return (
            <div key={aso.id} className="bg-surface rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${aso.resultado === 'APTO' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main text-lg">{ASO_LABELS[aso.tipo] || aso.tipo}</h4>
                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Realizado: {DateHelper.getCompleta(aso.dataRealizacao)}
                      </span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${status.bg} ${status.color} border-current/20`}>
                    {status.label}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-text-secondary"><strong className="text-text-main">Resultado:</strong> {aso.resultado}</p>
                  {aso.medico && <p className="text-sm text-text-secondary"><strong className="text-text-main">Médico:</strong> {aso.medico} {aso.crm ? `(CRM: ${aso.crm})` : ''}</p>}
                  {aso.dataVencimento && <p className="text-sm text-text-secondary"><strong className="text-text-main">Vencimento:</strong> {DateHelper.getCompleta(aso.dataVencimento)}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                {aso.comprovanteUrl ? (
                  <a href={aso.comprovanteUrl} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                    <FileCheck className="w-4 h-4" /> Ver Comprovante
                  </a>
                ) : (
                  <span className="text-text-muted text-sm italic">Sem comprovante</span>
                )}
                
                <button 
                  onClick={() => {
                    const modalId = openModal('CONFIRM', {
                      title: 'Excluir ASO',
                      description: 'Tem certeza que deseja excluir este ASO?',
                      variant: 'danger',
                      confirmLabel: 'Sim, Excluir',
                      onConfirm: async () => {
                        try {
                          await deletarMutation.mutateAsync(aso.id);
                        } finally {
                          closeModal(modalId);
                        }
                      }
                    });
                  }}
                  className="text-error/70 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-error/5 hover:bg-error/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full">
            <EmptyState
              icon={HeartPulse}
              title="Nenhum ASO registrado"
              description="Registre o primeiro ASO deste integrante clicando no botão acima."
            />
          </div>
        )}
      </div>
    </div>
  );
}
