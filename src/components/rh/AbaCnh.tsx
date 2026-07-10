import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { UserCircle, Car, Loader2, Save, UploadCloud, FileCheck } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { uploadToR2 } from '../../services/uploadService';
import { hapticError } from '../../lib/haptics';

const cnhSchema = z.object({
  cnhNumero: z.string().optional().nullable(),
  cnhCategoria: z.string().optional().nullable(),
  cnhValidade: z.string().optional().nullable(),
});

type CnhFormData = z.infer<typeof cnhSchema>;

interface AbaCnhProps {
  userId: string;
}

export function AbaCnh({ userId }: AbaCnhProps) {
  const queryClient = useQueryClient();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-cnh', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CnhFormData>({
    resolver: zodResolver(cnhSchema),
  });

  useEffect(() => {
    if (user) {
      const profile = user.profile || user;
      reset({
        cnhNumero: profile.cnhNumero || '',
        cnhCategoria: profile.cnhCategoria || '',
        cnhValidade: profile.cnhValidade ? profile.cnhValidade.split('T')[0] : '',
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.put(`/users/${userId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cnh', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['rh-kpis'] });
    }
  });

  const onSubmit = async (data: CnhFormData) => {
    try {
      setIsUploading(true);
      let fotoCnhUrl: string | undefined = undefined;

      if (arquivo) {
        try {
          const fileName = `cnh-${Date.now()}-${arquivo.name}`;
          fotoCnhUrl = await uploadToR2(
            arquivo,
            fileName,
            arquivo.type || 'application/octet-stream',
            'documentos'
          );
        } catch {
          hapticError();
          toast.error('Falha no upload da foto da CNH.');
          return;
        }
      }

      const payload = {
        ...data,
        cnhValidade: data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
        ...(fotoCnhUrl ? { fotoCnhUrl } : {})
      };
      
      await toast.promise(mutation.mutateAsync(payload), {
        loading: 'Salvando alterações...',
        success: 'Dados da CNH atualizados com sucesso!',
        error: 'Erro ao atualizar CNH.'
      });
      setArquivo(null); // Clear selected file after successful save
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  // Fallback to get fotoCnhUrl Se estiver no profile ou direto no user
  const fotoAtualUrl = user?.profile?.fotoCnhUrl || user?.fotoCnhUrl;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h3 className="text-xl font-bold text-text-main flex items-center gap-2 mb-6">
        <UserCircle className="w-6 h-6 text-primary" /> Carteira Nacional de Habilitação (CNH)
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-hover p-6 sm:p-8 rounded-[2rem] border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Input
              label="Número do Registro (CNH)"
              placeholder="Ex: 01234567890"
              {...register('cnhNumero')}
              error={errors.cnhNumero?.message}
            />
          </div>
          <div>
            <Select
              label="Categoria"
              placeholder="Selecione..."
              options={[
                { value: 'A', label: 'A (Moto)' },
                { value: 'B', label: 'B (Carro)' },
                { value: 'C', label: 'C (Caminhão)' },
                { value: 'D', label: 'D (Ônibus)' },
                { value: 'E', label: 'E (Carreta)' },
                { value: 'AB', label: 'AB (Moto e Carro)' },
                { value: 'AC', label: 'AC (Moto e Caminhão)' },
                { value: 'AD', label: 'AD (Moto e Ônibus)' },
                { value: 'AE', label: 'AE (Moto e Carreta)' }
              ]}
              {...register('cnhCategoria')}
              error={errors.cnhCategoria?.message}
            />
          </div>
          <div>
            <Input
              label="Data de Validade"
              type="date"
              {...register('cnhValidade')}
              error={errors.cnhValidade?.message}
            />
          </div>
        </div>

        <div className="mt-8 mb-6">
            <label className="text-sm font-bold text-text-secondary mb-1.5 block">Evidência CNH (PDF/Imagem)</label>
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
                  <UploadCloud className="w-8 h-8 text-text-muted group-hover:text-primary transition-colors mb-2" />
                  <span className="font-medium text-text-main">Anexar Arquivo da CNH</span>
                  <span className="text-xs text-text-muted mt-1">Formatos aceitos: PDF, JPG, PNG</span>
                </div>
              )}
            </div>
            
            {fotoAtualUrl && (
              <div className="mt-3 flex justify-start">
                <a href={fotoAtualUrl} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                  <FileCheck className="w-4 h-4" /> Ver Arquivo Atual
                </a>
              </div>
            )}
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={mutation.isPending || isUploading} className="min-w-[200px]">
            {mutation.isPending || isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
