import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Package, Save } from 'lucide-react'; // Ícones Lucide

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

  estoqueMinimo: z.coerce.number().min(0, "Mínimo não pode ser negativo").default(5),
  estoqueAtual: z.coerce.number().min(0, "Estoque não pode ser negativo").default(0),

  valorReferencia: z.coerce.number().min(0).optional(),
});

type FormInput = z.input<typeof produtoSchema>;
type FormOutput = z.output<typeof produtoSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarProduto({ onSuccess, onCancelar }: FormProps) {
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
    mode: 'onBlur'
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

  // Classes utilitárias (evitando hardcode)
  const labelStyle = "block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background";

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* Header */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Novo Item</h3>
          <p className="text-xs text-text-secondary">Catálogo de Peças e Serviços.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Package className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* Nome */}
          <div>
            <Input
              label="Descrição do Item / Serviço"
              {...register('nome')}
              placeholder="Ex: FILTRO DE ÓLEO MOTOR"
              error={errors.nome?.message}
              className="uppercase font-medium"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tipo */}
            <div>
              <label className={labelStyle}>Tipo / Categoria</label>
              <div className="relative">
                <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                  {tipos.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Unidade */}
            <div>
              <Input
                label="Unidade (UN, L, KG)"
                {...register('unidadeMedida')}
                placeholder="UN"
                className="uppercase text-center font-bold"
                maxLength={4}
                error={errors.unidadeMedida?.message}
                disabled={isSubmitting}
              />
            </div>

            {/* Estoque Mínimo */}
            <div>
              <Input
                label="Estoque Mínimo (Alerta)"
                type="number"
                {...register('estoqueMinimo')}
                placeholder="5"
                error={errors.estoqueMinimo?.message}
                disabled={isSubmitting}
              />
            </div>

            {/* Estoque Atual */}
            <div>
              <Input
                label="Estoque Inicial"
                type="number"
                {...register('estoqueAtual')}
                placeholder="0"
                error={errors.estoqueAtual?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            className="shadow-button hover:shadow-float px-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Item'}
          </Button>
        </div>

      </form>
    </div>
  );
}