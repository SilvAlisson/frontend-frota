import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { UserCircle, Loader2, Save, X } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { hapticError } from '../../lib/haptics';

const cnhSchema = z.object({
  cnhNumero: z.string().optional().nullable(),
  cnhCategoria: z.string().optional().nullable(),
  cnhValidade: z.string().optional().nullable(),
});

type CnhFormData = z.infer<typeof cnhSchema>;

interface AbaCnhProps {
  userId: string;
  onClose?: () => void;
}

export function AbaCnh({ userId, onClose }: AbaCnhProps) {
  const queryClient = useQueryClient();

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: async (payload: { userId: string; cnhNumero?: string | null; cnhCategoria?: string | null; cnhValidade?: string | null }) => {
      await api.put(`/users/${payload.userId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cnh', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['rh-kpis'] });
    }
  });

  const onSubmit = async (data: CnhFormData) => {
    try {
      const payload = {
        userId,
        ...data,
        cnhValidade: data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      };
      
      await toast.promise(mutation.mutateAsync(payload), {
        loading: 'Salvando alterações...',
        success: 'Dados da CNH atualizados com sucesso!',
        error: 'Erro ao atualizar CNH.'
      });
      if (onClose) onClose();
    } catch (error) {
      hapticError();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  // Unused photo URL removed

  return (
    <div className="space-y-6 animate-in fade-in relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-primary" /> Carteira Nacional de Habilitação (CNH)
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:bg-surface-hover rounded-full transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

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

        <div className="mt-8 flex justify-end gap-3">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending} className="min-w-[200px]">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
