import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Lista sincronizada com o backend
const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "LAVAGEM", "PECA", "SERVICO", "OUTRO"] as const;

const produtoSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, { error: "Nome deve ter pelo menos 2 caracteres" })
    .transform((val) => val.toUpperCase()),

  tipo: z.enum(tiposDeProduto, {
    error: "Selecione um tipo válido",
  }),

  unidadeMedida: z.string({ error: "Unidade de medida obrigatória" })
    .trim()
    .min(1, { error: "Unidade de medida obrigatória" }),
});

type ProdutoForm = z.infer<typeof produtoSchema>;

interface FormCadastrarProdutoProps {
  onSuccess?: () => void;
  onCancelar?: () => void;
}

export function FormCadastrarProduto({ onSuccess, onCancelar }: FormCadastrarProdutoProps) {

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
      unidadeMedida: 'Litro'
    }
  });

  const [successMsg, setSuccessMsg] = useState('');

  const onSubmit = async (data: ProdutoForm) => {
    setSuccessMsg('');
    try {
      await api.post('/produtos', {
        nome: data.nome,
        tipo: data.tipo,
        unidadeMedida: data.unidadeMedida,
      });

      setSuccessMsg('Produto cadastrado com sucesso!');
      reset();

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar produto:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao cadastrar produto.' });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-card shadow-sm border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900">Novo Item de Estoque</h4>
          <p className="text-sm text-gray-500 mt-1">Registre combustíveis, peças ou serviços.</p>
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

        {errors.root && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
            <span>{errors.root.message}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-success border border-green-200 rounded text-center text-sm font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting} isLoading={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </div>
  );
}