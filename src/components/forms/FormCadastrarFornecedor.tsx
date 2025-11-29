import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// 1. Schema Híbrido (Validação robusta + Tipagem correta)
const fornecedorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  // Aceita string opcional OU string vazia (para funcionar com o reset/defaultValues sem 'as any')
  cnpj: z.union([z.string().optional(), z.literal('')]),
});

// Inferência de tipo automática do Zod
type FornecedorForm = z.infer<typeof fornecedorSchema>;

interface FormEditarFornecedorProps {
  fornecedorId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarFornecedor({ fornecedorId, onSuccess, onCancelar }: FormEditarFornecedorProps) {

  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // 2. React Hook Form (Sem 'as any' graças ao schema ajustado)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FornecedorForm>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '' // Valor inicial compatível com z.literal('')
    }
  });

  // 3. Carregar dados para Edição
  useEffect(() => {
    if (!fornecedorId) return;

    const fetchFornecedor = async () => {
      setLoadingData(true);
      try {
        const response = await api.get(`/fornecedor/${fornecedorId}`);
        const fornecedor = response.data;

        // Atualiza o formulário. Se cnpj vier null do banco, converte para ''
        reset({
          nome: fornecedor.nome || '',
          cnpj: fornecedor.cnpj || '',
        });

      } catch (err) {
        console.error("Erro ao buscar dados do fornecedor:", err);
        setError('root', { message: 'Falha ao carregar os dados do fornecedor.' });
      } finally {
        setLoadingData(false);
      }
    };

    fetchFornecedor();
  }, [fornecedorId, reset, setError]);

  // 4. Submit (Lógica de Edição PUT)
  const onSubmit = async (data: FornecedorForm) => {
    setSuccessMsg('');
    try {
      await api.put(`/fornecedor/${fornecedorId}`, {
        nome: DOMPurify.sanitize(data.nome),
        // Se a string for vazia, envia null para o banco
        cnpj: data.cnpj && data.cnpj.trim() !== '' ? DOMPurify.sanitize(data.cnpj) : null,
      });

      setSuccessMsg('Fornecedor atualizado com sucesso!');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao atualizar fornecedor:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao atualizar fornecedor.' });
      }
    }
  };

  // Loading State
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

      <div className="text-center">
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
          label="Nome do Fornecedor"
          placeholder="Ex: Posto Matriz"
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
        <div className="p-3 bg-red-50 text-error border border-red-200 rounded text-center text-sm">
          {errors.root.message}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 text-success border border-green-200 rounded text-center text-sm font-medium">
          {successMsg}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={isSubmitting}
          onClick={onCancelar}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}