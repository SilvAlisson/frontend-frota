import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { UserCircle, Car, Loader2, Save } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

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
      reset({
        cnhNumero: user.cnhNumero || '',
        cnhCategoria: user.cnhCategoria || '',
        cnhValidade: user.cnhValidade ? user.cnhValidade.split('T')[0] : '',
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
    const payload = {
      ...data,
      cnhValidade: data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
    };
    
    await toast.promise(mutation.mutateAsync(payload), {
      loading: 'Salvando alterações...',
      success: 'Dados da CNH atualizados com sucesso!',
      error: 'Erro ao atualizar CNH.'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

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
            <label className="text-sm font-bold text-text-secondary mb-1.5 block">Categoria</label>
            <select
              {...register('cnhCategoria')}
              className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Selecione...</option>
              <option value="A">A (Moto)</option>
              <option value="B">B (Carro)</option>
              <option value="C">C (Caminhão)</option>
              <option value="D">D (Ônibus)</option>
              <option value="E">E (Carreta)</option>
              <option value="AB">AB (Moto e Carro)</option>
              <option value="AC">AC (Moto e Caminhão)</option>
              <option value="AD">AD (Moto e Ônibus)</option>
              <option value="AE">AE (Moto e Carreta)</option>
            </select>
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

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={mutation.isPending} className="min-w-[200px]">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
