import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { Package, Save } from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 

const tipos = ["PECA", "SERVICO", "COMBUSTIVEL", "ADITIVO", "LUBRIFICANTE", "PNEU", "OUTROS"] as const;

// --- SCHEMA ---
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

  estoqueMinimo: z.coerce.number().min(0, "Mínimo inválido").default(0),
  estoqueAtual: z.coerce.number().min(0, "Estoque inválido").default(0),
  valorReferencia: z.coerce.number().min(0, "Valor inválido").optional(),
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

  // Mapeia tipos para o Select
  const tipoOptions = useMemo(() => {
    return tipos.map(t => ({
      label: t.replace('_', ' '),
      value: t
    }));
  }, []);

  // --- CARREGAMENTO ---
  useEffect(() => {
    if (!produtoId) return;

    const fetchProduto = async () => {
      setLoadingData(true);
      try {
        const { data } = await api.get(`/produtos/${produtoId}`);

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
        toast.error("Erro ao carregar produto.");
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };

    fetchProduto();
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
      loading: 'Atualizando...',
      success: () => {
        setTimeout(onSuccess, 500);
        return 'Item atualizado!';
      },
      error: (err) => {
        return err.response?.data?.error || 'Erro ao atualizar.';
      }
    });
  };

  if (loadingData) {
    return (
      <div className="bg-surface rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary"></div>
        <p className="text-sm text-text-muted font-medium mt-4 animate-pulse">Carregando item...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Editar Item</h3>
          <p className="text-xs text-text-secondary">Atualize dados do catálogo.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Package className="w-5 h-5" />
        </div>
      </div>

      <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleSubmit(onSubmit)}>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* NOME DO ITEM */}
          <div>
            <Input
              label="Descrição do Item / Serviço"
              {...register('nome')}
              placeholder="Ex: FILTRO DE ÓLEO MOTOR"
              error={errors.nome?.message}
              disabled={isSubmitting}
              className="uppercase font-medium"
              autoFocus
            />
          </div>

          {/* GRID TIPO E UNIDADE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Categoria"
              options={tipoOptions}
              {...register('tipo')}
              error={errors.tipo?.message}
              disabled={isSubmitting}
            />

            <Input
              label="Unidade (UN, L, KG)"
              {...register('unidadeMedida')}
              placeholder="Ex: UN"
              error={errors.unidadeMedida?.message}
              disabled={isSubmitting}
              className="uppercase text-center font-bold"
              maxLength={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border">
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

             <div>
               <Input
                 label="Estoque Atual"
                 type="number"
                 {...register('estoqueAtual')}
                 placeholder="0"
                 error={errors.estoqueAtual?.message}
                 disabled={isSubmitting}
               />
             </div>
          </div>
        </div>

        {/* FOOTER */}
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
            className="shadow-button hover:shadow-float px-6"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={<Save className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}