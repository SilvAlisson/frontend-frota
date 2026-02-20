import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { Package, Save, Layers, Archive, AlertTriangle, Loader2 } from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 

const tipos = ["PECA", "SERVICO", "COMBUSTIVEL", "ADITIVO", "LUBRIFICANTE", "PNEU", "OUTROS"] as const;

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const produtoSchema = z.object({
  nome: z.string({ error: "Nome obrigatório" })
    .trim()
    .min(2, { message: "Mínimo 2 letras" })
    .transform((val) => val.toUpperCase()),

  tipo: z.enum(tipos).default('PECA'),

  unidadeMedida: z.string({ error: "Unidade obrigatória" })
    .trim()
    .min(1, { message: "Ex: UN, L" })
    .transform(val => val.trim().toUpperCase()),

  estoqueMinimo: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 0, "Mínimo 0"),

  estoqueAtual: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => !isNaN(v) && v >= 0, "Mínimo 0"),

  valorReferencia: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .optional(),
});

type ProdutoFormInput = z.input<typeof produtoSchema>;
type ProdutoFormOutput = z.output<typeof produtoSchema>;

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
    control,
    formState: { errors, isSubmitting }
  } = useForm<ProdutoFormInput, any, ProdutoFormOutput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'PECA',
      unidadeMedida: '',
      estoqueMinimo: 0,
      estoqueAtual: 0,
      valorReferencia: 0
    },
    mode: 'onBlur'
  });

  const tipoSelecionado = useWatch({ control, name: 'tipo' });

  // Mapeia tipos para o Select
  const tipoOptions = useMemo(() => {
    return tipos.map(t => ({
      label: t.replace('_', ' '),
      value: t
    }));
  }, []);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (!produtoId) return;

    let isMounted = true;

    const fetchProduto = async () => {
      try {
        const { data } = await api.get(`/produtos/${produtoId}`);
        if (!isMounted) return;

        const tipoValido = tipos.includes(data.tipo) ? data.tipo : 'OUTROS';

        reset({
          nome: data.nome || '',
          tipo: tipoValido,
          unidadeMedida: data.unidadeMedida || 'UN',
          estoqueMinimo: data.estoqueMinimo || 0,
          estoqueAtual: data.estoqueAtual || 0,
          valorReferencia: data.valorReferencia || 0
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
            toast.error("Falha ao carregar os detalhes do produto.");
            onCancelar();
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchProduto();
    return () => { isMounted = false; };
  }, [produtoId, reset, onCancelar]);

  // --- SUBMISSÃO ---
  const onSubmit = async (data: ProdutoFormOutput) => {
    const payload = {
      ...data,
      nome: DOMPurify.sanitize(data.nome),
      unidadeMedida: DOMPurify.sanitize(data.unidadeMedida)
    };

    const promise = api.put(`/produtos/${produtoId}`, payload);

    toast.promise(promise, {
      loading: 'Guardando alterações...',
      success: () => {
        setTimeout(onSuccess, 500);
        return 'Detalhes do item atualizados com sucesso!';
      },
      error: (err) => {
        return err.response?.data?.error || 'Erro inesperado ao atualizar.';
      }
    });
  };

  const isServico = tipoSelecionado === 'SERVICO';
  const isLocked = isSubmitting || loadingData;

  if (loadingData) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">Consultando Catálogo...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Package className="w-5 h-5" />
            </div>
            Editar Item do Catálogo
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Atualize informações de peças, serviços ou consumíveis.</p>
        </div>
      </div>

      <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit(onSubmit)}>
        
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
                className="uppercase font-black text-primary tracking-wide"
                autoFocus
                disabled={isLocked}
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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                  disabled={isLocked || isServico}
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
                  disabled={isLocked || isServico}
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
            disabled={isLocked}
            className="w-full sm:w-auto font-bold"
          >
            Descartar Alterações
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-button hover:shadow-float-primary px-10 font-black uppercase tracking-tight"
            disabled={isLocked}
          >
            Gravar Edição
          </Button>
        </div>

      </form>
    </div>
  );
}