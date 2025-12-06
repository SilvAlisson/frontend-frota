import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"] as const;

// --- 1. SCHEMA ZOD V4 (Otimizado) ---
const produtoSchema = z.object({
  nome: z.string({ error: "Nome do item é obrigatório" })
    .trim()
    .min(2, { message: "Nome muito curto (mínimo 2 letras)" })
    .transform((val) => val.toUpperCase()),

  tipo: z.enum(tiposDeProduto, {
    error: "Selecione um tipo válido",
  }),

  unidadeMedida: z.string({ error: "Unidade de medida é obrigatória" })
    .trim()
    .min(1, { message: "Informe a unidade (ex: Litro, Un)" }),
});

type ProdutoFormValues = z.input<typeof produtoSchema>;

interface FormEditarProdutoProps {
  produtoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarProduto({ produtoId, onSuccess, onCancelar }: FormEditarProdutoProps) {

  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'COMBUSTIVEL',
      unidadeMedida: ''
    },
    mode: 'onBlur'
  });

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    if (!produtoId) return;

    const fetchProduto = async () => {
      setLoadingData(true);
      try {
        const { data } = await api.get(`/produto/${produtoId}`);

        // Validação defensiva do tipo vindo do backend
        const tipoValido = tiposDeProduto.includes(data.tipo as any)
          ? (data.tipo as typeof tiposDeProduto[number])
          : 'OUTRO';

        reset({
          nome: data.nome || '',
          tipo: tipoValido,
          unidadeMedida: data.unidadeMedida || 'Litro',
        });

      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        toast.error("Não foi possível carregar os dados do produto.");
        onCancelar(); // Fecha o modal se falhar
      } finally {
        setLoadingData(false);
      }
    };

    fetchProduto();
  }, [produtoId, reset, onCancelar]);

  // --- 2. SUBMISSÃO COM TOAST PROMISE ---
  const onSubmit = async (data: ProdutoFormValues) => {
    const promise = api.put(`/produto/${produtoId}`, data);

    toast.promise(promise, {
      loading: 'Atualizando item...',
      success: () => {
        setTimeout(onSuccess, 800);
        return 'Produto atualizado com sucesso!';
      },
      error: (err) => {
        console.error("Erro ao atualizar:", err);
        return err.response?.data?.error || 'Falha na atualização. Tente novamente.';
      }
    });
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-100 border-t-orange-600"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Buscando informações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-1">
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

        {/* HEADER VISUAL */}
        <div className="text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent rounded-full" />

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mb-4 shadow-sm ring-4 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>

          <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
            Editar Item
          </h4>
          <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
            Atualize as especificações do item de estoque.
          </p>
        </div>

        <div className="space-y-5 px-1">
          <Input
            label="Nome do Produto / Serviço"
            placeholder="Ex: DIESEL S10"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
            autoFocus
            className="uppercase font-medium"
          />

          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Categoria</label>
            <div className="relative group">
              <select
                className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
                {...register('tipo')}
                disabled={isSubmitting}
              >
                {tiposDeProduto.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-orange-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.tipo && <p className="mt-1 text-xs text-error animate-pulse">{errors.tipo.message}</p>}
          </div>

          <Input
            label="Unidade de Medida"
            placeholder="Ex: Litro"
            {...register('unidadeMedida')}
            error={errors.unidadeMedida?.message}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
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
            className="flex-[2] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}