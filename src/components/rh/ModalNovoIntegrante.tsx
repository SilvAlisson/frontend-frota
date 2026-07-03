import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Loader2, UserPlus } from 'lucide-react';

const novoIntegranteSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Deve conter letra e número'),
  role: z.enum(['OPERADOR', 'ENCARREGADO', 'AUXILIAR_OPERACIONAL', 'RH', 'COORDENADOR']),
  matricula: z.string().optional().nullable(),
  cargoId: z.string().optional().nullable(),
  cnhNumero: z.string().optional().nullable(),
  cnhCategoria: z.string().optional().nullable(),
  cnhValidade: z.string().optional().nullable(),
  dataAdmissao: z.string().optional().nullable(),
});

type FormData = z.infer<typeof novoIntegranteSchema>;

interface ModalNovoIntegranteProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cargos: { id: string; nome: string }[];
}

export function ModalNovoIntegrante({ isOpen, onClose, onSuccess, cargos }: ModalNovoIntegranteProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(novoIntegranteSchema),
    defaultValues: { role: 'OPERADOR' }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        cnhValidade: data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
        dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
      };
      await api.post('/users/register', payload);
      toast.success('Integrante contratado com sucesso! QR Code gerado automaticamente.');
      onSuccess();
      onClose();
    } catch (err) {
      // handleApiError já mostra toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Integrante" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="p-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome Completo" {...register('nome')} error={errors.nome?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Senha" type="password" {...register('password')} error={errors.password?.message} />
          <Input label="Matrícula" {...register('matricula')} />

          <div>
            <label className="text-sm font-bold text-text-secondary mb-1.5 block">Função</label>
            <Select
              value={watch('role') || 'OPERADOR'}
              onChange={(e) => setValue('role', e.target.value as any)}
              options={[
                { value: 'OPERADOR', label: 'Operador' },
                { value: 'ENCARREGADO', label: 'Encarregado' },
                { value: 'AUXILIAR_OPERACIONAL', label: 'Auxiliar Operacional' },
                { value: 'RH', label: 'RH' },
                { value: 'COORDENADOR', label: 'Coordenador' },
              ]}
              className="h-11"
            />
            {errors.role && <span className="text-error text-xs mt-1">{errors.role.message}</span>}
          </div>

          <div>
            <label className="text-sm font-bold text-text-secondary mb-1.5 block">Cargo</label>
            <Select
              value={watch('cargoId') || ''}
              onChange={(e) => setValue('cargoId', e.target.value || null)}
              options={[{ value: '', label: 'Sem cargo' }, ...cargos.map(c => ({ value: c.id, label: c.nome }))]}
              className="h-11"
            />
          </div>

          <Input label="Data Admissão" type="date" {...register('dataAdmissao')} />
        </div>

        <div className="border-t border-border/50 pt-4">
          <h4 className="font-bold text-text-main mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Dados da CNH (Opcional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Número CNH" {...register('cnhNumero')} />
            <Input label="Categoria" {...register('cnhCategoria')} />
            <Input label="Validade CNH" type="date" {...register('cnhValidade')} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}>
            {isSubmitting ? 'Contratando...' : 'Contratar Integrante'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
