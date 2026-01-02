import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

const tipos = ["PECA", "SERVICO", "COMBUSTIVEL", "ADITIVO", "LUBRIFICANTE", "PNEU", "OUTROS"] as const;

// --- SCHEMA (Sincronizado com o Cadastro) ---
const produtoSchema = z.object({
  nome: z.string({ error: "Nome obrigatório" })
    .trim()
    .min(2, { message: "Mínimo 2 letras" })
    .transform((val) => val.toUpperCase()),

  tipo: z.enum(tipos).default('PECA'), // Usando a lista completa de tipos

  unidadeMedida: z.string({ error: "Unidade obrigatória" })
    .trim()
    .min(1, { message: "Ex: UN, L" })
    .transform(val => val.trim().toUpperCase()),

  // Novos campos de estoque
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
  } = useForm<ProdutoFormInput, any, ProdutoFormOutput>({ // [CORREÇÃO: Tipagem]
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'PECA',
      unidadeMedida: '',
      estoqueMinimo: 0,
      estoqueAtual: 0,
      valorReferencia: 0
    },
    mode: 'onBlur' // [CORREÇÃO: UX]
  });

  // --- CARREGAMENTO ---
  useEffect(() => {
    if (!produtoId) return;

    const fetchProduto = async () => {
      setLoadingData(true);
      try {
        const { data } = await api.get(`/produtos/${produtoId}`);

        // Verifica se o tipo existe na lista nova, senão 'OUTROS'
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

    // [ATENÇÃO] Usando a rota no plural para manter padrão REST
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

  // --- ESTILOS ---
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  if (loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary"></div>
        <p className="text-sm text-gray-400 font-medium mt-4 animate-pulse">Carregando item...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Item</h3>
          <p className="text-xs text-gray-500">Atualize dados do catálogo.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <span className="text-xl">📦</span>
        </div>
      </div>

      <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>

        {/* NOME DO ITEM */}
        <div>
          <label className={labelStyle}>Descrição do Item / Serviço</label>
          <Input
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
          <div>
            <label className={labelStyle}>Categoria</label>
            <div className="relative">
              <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                {tipos.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Unidade (UN, L, KG)</label>
            <Input
              {...register('unidadeMedida')}
              placeholder="Ex: UN"
              error={errors.unidadeMedida?.message}
              disabled={isSubmitting}
              className="uppercase text-center font-bold"
              maxLength={4}
            />
          </div>

          {/* [CORREÇÃO: Campos de Estoque Adicionados] */}
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
            <label className={labelStyle}>Estoque Atual</label>
            <Input
              type="number"
              {...register('estoqueAtual')}
              placeholder="0"
              error={errors.estoqueAtual?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 text-gray-500"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-[2] shadow-lg shadow-primary/20"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={<span>💾</span>}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}