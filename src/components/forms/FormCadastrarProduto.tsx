import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Tipos de Produto (do schema.prisma)
const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"];

// 1. Schema Zod
const produtoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  tipo: z.string().min(1, "Selecione o tipo"),
  unidadeMedida: z.string().min(1, "Unidade de medida obrigatória"),
});

type ProdutoForm = z.infer<typeof produtoSchema>;

interface FormCadastrarProdutoProps {
  onSuccess: () => void; // callback de sucesso (atualiza lista, fecha modal/tab)
  onCancelar: () => void;
}

export function FormCadastrarProduto({ onSuccess, onCancelar }: FormCadastrarProdutoProps) {

  // 2. React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ProdutoForm>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: '',
      tipo: 'COMBUSTIVEL',
      unidadeMedida: 'Litro'
    }
  });

  const [successMsg, setSuccessMsg] = useState('');

  // 3. Submit
  const onSubmit = async (data: ProdutoForm) => {
    setSuccessMsg('');
    try {
      // A api global já tem a baseURL e interceptors do token
      await api.post('/produto', {
        nome: data.nome.toUpperCase(), // Normalização simples
        tipo: data.tipo,
        unidadeMedida: data.unidadeMedida,
      });

      setSuccessMsg('Produto cadastrado com sucesso!');
      reset(); // Limpa campos

      // Aguarda um pouco para o integrante ver a mensagem antes de fechar
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar produto:", err);
      // Erro vindo do backend (ex: Nome duplicado)
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao cadastrar produto.' });
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Novo Item de Estoque
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          Registre combustíveis, peças ou serviços.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome do Produto / Serviço"
          placeholder="Ex: DIESEL S10, ARLA 32"
          {...register('nome')}
          error={errors.nome?.message}
          disabled={isSubmitting}
        />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
              {...register('tipo')}
              disabled={isSubmitting}
            >
              {tiposDeProduto.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.tipo && <p className="mt-1 text-xs text-error">{errors.tipo.message}</p>}
        </div>

        <Input
          label="Unidade de Medida"
          placeholder="Ex: Litro, Unidade, Hora"
          {...register('unidadeMedida')}
          error={errors.unidadeMedida?.message}
          disabled={isSubmitting}
        />
      </div>

      {/* FEEDBACK */}
      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{errors.root.message}</span>
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
          {isSubmitting ? 'Registrando...' : 'Salvando Produto'}
        </Button>
      </div>
    </form>
  );
}