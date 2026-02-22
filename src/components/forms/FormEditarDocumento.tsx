import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FileText, Save, Calendar, Tag } from 'lucide-react';

const editDocumentoSchema = z.object({
  titulo: z.string().min(3, "O título precisa ter pelo menos 3 letras"),
  categoria: z.enum(['CRLV', 'CIV', 'CIPP', 'TACOGRAFO', 'LAUDO_CHAPA', 'MANUTENCAO', 'OUTROS', 'LICENCA_AMBIENTAL', 'AST', 'ATRP']),
  descricao: z.string().optional(),
  dataValidade: z.string().optional().nullable(),
});

type EditDocumentoFormData = z.infer<typeof editDocumentoSchema>;

interface FormEditarDocumentoProps {
  documentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormEditarDocumento({ documentoId, onSuccess, onCancel }: FormEditarDocumentoProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<EditDocumentoFormData>({
    resolver: zodResolver(editDocumentoSchema),
  });

  const categoriaWatch = watch('categoria');
  const showValidade = !['LICENCA_AMBIENTAL', 'AST'].includes(categoriaWatch);

  useEffect(() => {
    async function carregarDocumento() {
      try {
        // Traz as informações atuais do documento para pré-preencher o form
        const response = await api.get(`/documentos-legais/${documentoId}`);
        const doc = response.data;
        
        reset({
          titulo: doc.titulo,
          categoria: doc.categoria,
          descricao: doc.descricao || '',
          dataValidade: doc.dataValidade ? new Date(doc.dataValidade).toISOString().split('T')[0] : null,
        });
      } catch (err) {
        toast.error("Erro ao carregar dados do documento.");
        onCancel();
      }
    }
    carregarDocumento();
  }, [documentoId, reset, onCancel]);

  const mutation = useMutation({
    mutationFn: async (dados: EditDocumentoFormData) => {
      // Se a categoria for permanente, forçamos a validade para null
      if (!showValidade) dados.dataValidade = null;
      
      const payload = {
        ...dados,
        dataValidade: dados.dataValidade ? new Date(dados.dataValidade + 'T12:00:00.000Z').toISOString() : null,
      };

      await api.put(`/documentos-legais/${documentoId}`, payload);
    },
    onSuccess: () => {
      toast.success("Documento atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['documentos-legais'] });
      onSuccess();
    },
    onError: () => {
      toast.error("Falha ao atualizar o documento.");
    }
  });

  const CATEGORIAS_OPTIONS = [
    { value: 'CRLV', label: 'CRLV' },
    { value: 'CIV', label: 'CIV' },
    { value: 'CIPP', label: 'CIPP' },
    { value: 'TACOGRAFO', label: 'Tacógrafo' },
    { value: 'LAUDO_CHAPA', label: 'Laudo de Chapa' },
    { value: 'MANUTENCAO', label: 'Manutenção / Revisão' },
    { value: 'LICENCA_AMBIENTAL', label: 'Licença Ambiental (Sem Validade)' },
    { value: 'AST', label: 'AST - Segurança (Sem Validade)' },
    { value: 'ATRP', label: 'ATRP' },
    { value: 'OUTROS', label: 'Outros Ficheiros' },
  ];

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input 
            label="Título do Documento" 
            icon={<FileText className="w-4 h-4 text-text-muted" />}
            {...register('titulo')} 
            error={errors.titulo?.message} 
          />
        </div>
        
        <Select 
          label="Categoria / Tipo" 
          options={CATEGORIAS_OPTIONS} 
          icon={<Tag className="w-4 h-4" />}
          {...register('categoria')} 
          error={errors.categoria?.message} 
        />
        
        {showValidade ? (
          <Input 
            label="Nova Data de Validade" 
            type="date" 
            icon={<Calendar className="w-4 h-4 text-text-muted" />}
            {...register('dataValidade')} 
            error={errors.dataValidade?.message} 
          />
        ) : (
          <div className="flex flex-col justify-center bg-success/10 border border-success/20 rounded-xl p-3 h-[72px] mt-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-success">Validade</span>
            <span className="text-sm font-bold text-success/80">Registo Permanente</span>
          </div>
        )}

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary ml-1">Observações (Opcional)</label>
          <textarea 
            {...register('descricao')} 
            className="w-full bg-surface border border-border/60 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-sm min-h-[80px]"
            placeholder="Anotações internas sobre este documento..."
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border/60">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting || mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />} isLoading={isSubmitting || mutation.isPending} className="shadow-button">
          Gravar Alterações
        </Button>
      </div>
    </form>
  );
}