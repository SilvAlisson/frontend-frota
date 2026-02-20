import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { toast } from 'sonner';
import { Package, Save, Layers, Archive, AlertTriangle } from 'lucide-react';

const tipos = ["PECA", "SERVICO", "COMBUSTIVEL", "ADITIVO", "LUBRIFICANTE", "PNEU", "OUTROS"] as const;

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const produtoSchema = z.object({
  nome: z.string()
    .min(2, "Nome obrigatório (mín. 2 caracteres)")
    .transform(val => val.trim().toUpperCase()),

  tipo: z.enum(tipos).default('PECA'),

  unidadeMedida: z.string()
    .min(1, "Obrigatório (ex: UN)")
    .transform(val => val.trim().toUpperCase()),

  estoqueMinimo: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 0, "Mín. 0"),

  estoqueAtual: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 0, "Mín. 0"),

  valorReferencia: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .optional(),
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
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'PECA',
      unidadeMedida: 'UN',
      estoqueMinimo: 5,
      estoqueAtual: 0,
      valorReferencia: 0
    },
    mode: 'onBlur'
  });

  const tipoSelecionado = watch('tipo');

  const onSubmit = async (data: FormOutput) => {
    try {
      const payload = {
        ...data,
        nome: DOMPurify.sanitize(data.nome),
        unidadeMedida: DOMPurify.sanitize(data.unidadeMedida),
      };

      const promise = api.post('/produtos', payload);

      toast.promise(promise, {
        loading: 'A arquivar item...',
        success: (response) => {
          reset();
          setTimeout(onSuccess, 500);
          return `Item "${response.data.nome}" registado com sucesso!`;
        },
        error: (err) => err.response?.data?.error || 'Erro ao cadastrar item.'
      });
    } catch (e) {
      console.error(e);
      toast.error('Erro inesperado ao processar formulário.');
    }
  };

  const tipoOptions = tipos.map(t => ({
    value: t,
    label: t.replace('_', ' ')
  }));

  // Renderização condicional: Serviços não precisam de controle de stock severo
  const isServico = tipoSelecionado === 'SERVICO';

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Package className="w-5 h-5" />
            </div>
            Novo Item do Catálogo
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Gestão de peças, serviços e consumíveis.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">

          {/* SECÇÃO 1: INFORMAÇÕES BÁSICAS */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Identificação</label>
            </div>

            <div>
              <Input
                label="Descrição Técnica"
                {...register('nome')}
                placeholder="Ex: FILTRO DE ÓLEO MOTOR DIESEL"
                error={errors.nome?.message}
                className="uppercase font-black text-primary tracking-wide placeholder:font-normal placeholder:tracking-normal"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Select
                  label="Categoria"
                  options={tipoOptions}
                  icon={<Layers className="w-4 h-4 text-text-muted" />}
                  {...register('tipo')}
                  error={errors.tipo?.message}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Input
                  label="Medida (UN, L, KG, PAR)"
                  {...register('unidadeMedida')}
                  placeholder="UN"
                  className="uppercase text-center font-bold tracking-widest"
                  maxLength={4}
                  error={errors.unidadeMedida?.message}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* SECÇÃO 2: GESTÃO DE STOCK */}
          <section className={`space-y-5 transition-opacity duration-300 ${isServico ? 'opacity-40 grayscale' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Armazém e Stock</label>
              {isServico && <span className="ml-auto text-[10px] font-bold text-text-muted italic">(Ignorado para serviços)</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative group">
                <Input
                  label="Quantidade em Armazém"
                  type="number"
                  icon={<Archive className="w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />}
                  {...register('estoqueAtual')}
                  placeholder="0"
                  error={errors.estoqueAtual?.message}
                  disabled={isSubmitting || isServico}
                  className="font-mono font-bold text-lg text-center"
                />
              </div>

              <div className="relative group">
                <Input
                  label="Alerta de Reposição (Mínimo)"
                  type="number"
                  icon={<AlertTriangle className="w-4 h-4 text-warning-500/70 group-focus-within:text-warning-500 transition-colors" />}
                  {...register('estoqueMinimo')}
                  placeholder="5"
                  error={errors.estoqueMinimo?.message}
                  disabled={isSubmitting || isServico}
                  className="font-mono font-bold text-lg text-center text-warning-600 focus:ring-warning-500/20 focus:border-warning-500"
                  containerClassName={errors.estoqueMinimo ? '' : '[&_input]:border-warning-500/30'}
                />
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="w-full sm:w-auto font-bold"
          >
            Descartar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-button hover:shadow-float-primary px-10 font-black uppercase tracking-tight"
          >
            Registar Item
          </Button>
        </div>

      </form>
    </div>
  );
}