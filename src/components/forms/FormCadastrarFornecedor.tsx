import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api'; // <--- Usar a instância global
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const fornecedorSchema = z.object({
  nome: z.string().min(1, 'O Nome é obrigatório.'),
  cnpj: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FormCadastrarFornecedorProps {
  // Token removido, não é necessário
  onFornecedorAdicionado: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ onFornecedorAdicionado, onCancelar }: FormCadastrarFornecedorProps) {

  const {
    register,
    handleSubmit,
    setError, // Importante para definir erros do backend
    formState: { errors, isSubmitting } // Usar isSubmitting nativo
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema) as any,
    defaultValues: { nome: '', cnpj: '' }
  });

  const [successMsg, setSuccessMsg] = useState('');

  const onSubmit = async (data: FornecedorFormData) => {
    setSuccessMsg('');
    try {
      // Usa a api global que já injeta o token automaticamente
      await api.post('/fornecedor', {
        nome: DOMPurify.sanitize(data.nome),
        cnpj: data.cnpj ? DOMPurify.sanitize(data.cnpj) : null,
      });

      setSuccessMsg('Fornecedor cadastrado com sucesso!');

      setTimeout(() => {
        onFornecedorAdicionado();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar fornecedor:", err);
      if (err.response?.data?.error) {
        // Define o erro no formulário
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao cadastrar fornecedor.' });
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">Novo Fornecedor</h4>
        <p className="text-sm text-text-secondary mt-1">Cadastre um posto ou oficina parceira.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome do Fornecedor"
          placeholder="Ex: Posto Quarto de Milha"
          disabled={isSubmitting}
          {...register('nome')}
          error={errors.nome?.message}
        />
        <Input
          label="CNPJ (Opcional)"
          placeholder="00.000.000/0000-00"
          disabled={isSubmitting}
          {...register('cnpj')}
          error={errors.cnpj?.message}
        />
      </div>

      {errors.root && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm text-center">
          {errors.root.message}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm text-center">
          {successMsg}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
        </Button>
      </div>
    </form>
  );
}