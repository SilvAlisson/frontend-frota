import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- ZOD V4 SCHEMA ---
const fornecedorSchema = z.object({
  nome: z.string().min(1, { error: 'O Nome é obrigatório.' }),
  cnpj: z.union([z.string().optional(), z.literal('')]),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface Props {
  fornecedorId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarFornecedor({ fornecedorId, onSuccess, onCancelar }: Props) {
  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { nome: '', cnpj: '' }
  });

  useEffect(() => {
    if (!fornecedorId) return;

    api.get(`/fornecedor/${fornecedorId}`)
      .then(res => {
        reset({
          nome: res.data.nome || '',
          cnpj: res.data.cnpj || ''
        });
        setLoadingData(false);
      })
      .catch(() => {
        setError('root', { message: 'Erro ao carregar dados do fornecedor.' });
        setLoadingData(false);
      });
  }, [fornecedorId, reset, setError]);

  const onSubmit = async (data: FornecedorFormData) => {
    setSuccessMsg('');
    try {
      await api.put(`/fornecedor/${fornecedorId}`, {
        nome: DOMPurify.sanitize(data.nome),
        cnpj: data.cnpj && data.cnpj.trim() !== '' ? DOMPurify.sanitize(data.cnpj) : null,
      });

      setSuccessMsg('Fornecedor atualizado com sucesso!');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setError('root', { message: err.response?.data?.error || 'Falha ao atualizar.' });
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">Carregando dados...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Editar Fornecedor
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          Atualize os dados cadastrais do parceiro.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome"
          placeholder="Nome do estabelecimento"
          {...register('nome')}
          error={errors.nome?.message}
          disabled={isSubmitting}
        />
        <Input
          label="CNPJ (Opcional)"
          placeholder="00.000.000/0000-00"
          {...register('cnpj')}
          error={errors.cnpj?.message}
          disabled={isSubmitting}
        />
      </div>

      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{errors.root.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onCancelar}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}