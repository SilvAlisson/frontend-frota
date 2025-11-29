import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api'; // API Real
import { Button } from '../ui/Button';    // UI Real
import { Input } from '../ui/Input';      // UI Real

// --- LÓGICA DO FORMULÁRIO ---

const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"] as const;

const produtoSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .transform((val) => val.toUpperCase()),

  tipo: z.enum(tiposDeProduto, {
    message: "Selecione um tipo válido",
  }),

  unidadeMedida: z.string()
    .trim()
    .min(1, "Unidade de medida obrigatória"),
});

type ProdutoForm = z.infer<typeof produtoSchema>;

interface FormEditarProdutoProps {
  produtoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarProduto({ produtoId, onSuccess, onCancelar }: FormEditarProdutoProps) {

  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ProdutoForm>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'COMBUSTIVEL',
      unidadeMedida: ''
    }
  });

  // Carregar dados iniciais
  useEffect(() => {
    if (!produtoId) return;

    const fetchProduto = async () => {
      setLoadingData(true);
      try {
        const response = await api.get(`/produto/${produtoId}`);
        const produto = response.data;

        // Verifica se o tipo vindo do banco é válido no nosso enum
        const tipoValido = tiposDeProduto.includes(produto.tipo as any)
          ? (produto.tipo as typeof tiposDeProduto[number])
          : 'OUTRO';

        reset({
          nome: produto.nome || '',
          tipo: tipoValido,
          unidadeMedida: produto.unidadeMedida || 'Litro',
        });

      } catch (err) {
        console.error("Erro ao buscar dados do produto:", err);
        setError('root', { message: 'Falha ao carregar os dados do produto para edição.' });
      } finally {
        setLoadingData(false);
      }
    };

    fetchProduto();
  }, [produtoId, reset, setError]);

  const onSubmit = async (data: ProdutoForm) => {
    setSuccessMsg('');
    try {
      await api.put(`/produto/${produtoId}`, {
        nome: data.nome,
        tipo: data.tipo,
        unidadeMedida: data.unidadeMedida,
      });

      setSuccessMsg('Produto atualizado com sucesso!');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao atualizar produto:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao atualizar produto.' });
      }
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <p className="text-sm text-gray-500">Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">
            Editar Item de Estoque
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Atualize informações de combustíveis ou serviços.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Nome do Produto / Serviço"
            placeholder="Ex: DIESEL S10"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
          />

          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Tipo</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 appearance-none"
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
            {errors.tipo && <p className="mt-1 text-xs text-red-500">{errors.tipo.message}</p>}
          </div>

          <Input
            label="Unidade de Medida"
            placeholder="Ex: Litro"
            {...register('unidadeMedida')}
            error={errors.unidadeMedida?.message}
            disabled={isSubmitting}
          />
        </div>

        {errors.root && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <span>{errors.root.message}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded text-center text-sm font-medium">
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
            {isSubmitting ? 'Salvando...' : 'Alterações salvas!'}
          </Button>
        </div>
      </form>
    </div>
  );
}