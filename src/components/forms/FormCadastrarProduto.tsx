import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

const tipos = ["PECA", "SERVICO", "COMBUSTIVEL", "ADITIVO", "LUBRIFICANTE", "PNEU", "OUTROS"] as const;

// --- SCHEMA ---
const produtoSchema = z.object({
  nome: z.string()
    .min(2, "Nome obrigatório (mín. 2 caracteres)")
    .transform(val => val.trim().toUpperCase()),

  tipo: z.enum(tipos).default('PECA'),

  unidadeMedida: z.string()
    .min(1, "Unidade obrigatória (ex: UN, LT)")
    .transform(val => val.trim().toUpperCase()),

  // Coerce converte input (string do HTML) para number automaticamente
  estoqueMinimo: z.coerce.number().min(0, "Mínimo não pode ser negativo").default(5),
  estoqueAtual: z.coerce.number().min(0, "Estoque não pode ser negativo").default(0),

  // Optional e coerce juntos precisam tratar string vazia caso venha do input
  valorReferencia: z.coerce.number().min(0).optional(),
});

// Tipagem Segura: Input (Formulário) vs Output (Dados Processados)
type FormInput = z.input<typeof produtoSchema>;
type FormOutput = z.output<typeof produtoSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarProduto({ onSuccess, onCancelar }: FormProps) {
  // [CORREÇÃO 1] Uso dos 3 genéricos para resolver o conflito de tipos Input/Output
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      tipo: 'PECA',
      unidadeMedida: 'UN',
      estoqueMinimo: 5,
      estoqueAtual: 0,
      valorReferencia: 0
    },
    mode: 'onBlur' // [CORREÇÃO 2] UX consistente com os outros forms
  });

  const onSubmit = async (data: FormOutput) => {
    const payload = {
      ...data,
      nome: DOMPurify.sanitize(data.nome),
      unidadeMedida: DOMPurify.sanitize(data.unidadeMedida),
    };

    const promise = api.post('/produtos', payload);

    toast.promise(promise, {
      loading: 'Cadastrando item...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 500);
        return `Item "${response.data.nome}" cadastrado!`;
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Erro ao cadastrar produto.';
      }
    });
  };

  // Estilos
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-300">

      {/* Header */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Novo Item</h3>
          <p className="text-xs text-gray-500">Catálogo de Peças e Serviços.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <span className="text-xl">📦</span>
        </div>
      </div>

      {/* [CORREÇÃO 1] handleSubmit agora aceita onSubmit sem 'as any' */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

        <div>
          <label className={labelStyle}>Descrição do Item / Serviço</label>
          <Input
            {...register('nome')}
            placeholder="Ex: FILTRO DE ÓLEO MOTOR"
            error={errors.nome?.message}
            className="uppercase font-medium"
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Tipo / Categoria</label>
            <div className="relative">
              <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                {tipos.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Unidade (UN, L, KG)</label>
            <Input
              {...register('unidadeMedida')}
              placeholder="UN"
              className="uppercase text-center font-bold"
              maxLength={4}
              error={errors.unidadeMedida?.message}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelStyle}>Estoque Mínimo (Alerta)</label>
            <Input
              type="number"
              {...register('estoqueMinimo')}
              placeholder="5"
              error={errors.estoqueMinimo?.message}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelStyle}>Estoque Inicial</label>
            <Input
              type="number"
              {...register('estoqueAtual')}
              placeholder="0"
              error={errors.estoqueAtual?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            className="text-gray-500"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<span>💾</span>}
            className="shadow-lg shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}