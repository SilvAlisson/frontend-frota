import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Store, Save, Check, ChevronDown } from 'lucide-react';
import type { Produto } from '../../types';

const tiposFornecedor = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- SCHEMA ---
const fornecedorSchema = z.object({
  nome: z.string({ error: 'O Nome é obrigatório.' })
    .min(2, { message: 'Mínimo de 2 caracteres.' })
    .transform(val => val.trim().toUpperCase()),

  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
      message: "Formato: 00.000.000/0000-00"
    })
  ]).optional().nullable(),

  tipo: z.enum(tiposFornecedor, { error: "Selecione um tipo válido" })
    .default('OUTROS'),

  produtosIds: z.array(z.string()).default([]),
});

type FornecedorInput = z.input<typeof fornecedorSchema>;
type FornecedorOutput = z.output<typeof fornecedorSchema>;

interface Props {
  fornecedorId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarFornecedor({ fornecedorId, onSuccess, onCancelar }: Props) {
  const [loadingData, setLoadingData] = useState(true);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FornecedorInput, any, FornecedorOutput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { nome: '', cnpj: '', tipo: 'OUTROS', produtosIds: [] },
    mode: 'onBlur'
  });

  const selectedIds = watch('produtosIds') || [];

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (!fornecedorId) return;

    const carregarTudo = async () => {
      try {
        const [resProdutos, resFornecedor] = await Promise.all([
          api.get('/produtos'),
          api.get(`/fornecedores/${fornecedorId}`)
        ]);

        setProdutosDisponiveis(resProdutos.data);

        const data = resFornecedor.data;
        const tipoValido = tiposFornecedor.includes(data.tipo) ? data.tipo : 'OUTROS';

        const idsExistentes = data.produtosOferecidos
          ? data.produtosOferecidos.map((p: any) => p.id)
          : [];

        reset({
          nome: data.nome || '',
          cnpj: data.cnpj || '',
          tipo: tipoValido,
          produtosIds: idsExistentes
        });

      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados.');
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };

    carregarTudo();
  }, [fornecedorId, reset, onCancelar]);

  const toggleProduto = (id: string) => {
    const current = selectedIds;
    if (current.includes(id)) {
      setValue('produtosIds', current.filter(item => item !== id));
    } else {
      setValue('produtosIds', [...current, id]);
    }
  };

  const onSubmit = async (data: FornecedorOutput) => {
    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      cnpj: data.cnpj && data.cnpj.trim() !== '' ? DOMPurify.sanitize(data.cnpj) : null,
      tipo: data.tipo,
      produtosIds: data.produtosIds
    };

    const promise = api.put(`/fornecedores/${fornecedorId}`, payload);

    toast.promise(promise, {
      loading: 'Atualizando cadastro...',
      success: () => {
        setTimeout(onSuccess, 500);
        return 'Parceiro atualizado!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao atualizar.';
      }
    });
  };

  // Estilos padronizados
  const labelStyle = "block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background appearance-none";

  if (loadingData) {
    return (
      <div className="bg-surface rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary"></div>
        <p className="text-sm text-text-muted font-medium mt-4 animate-pulse">Buscando informações...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Editar Parceiro</h3>
          <p className="text-xs text-text-secondary">Atualize os dados e serviços.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Store className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* Nome */}
          <div>
            <Input
              label="Razão Social / Nome"
              {...register('nome')}
              placeholder="Ex: AUTO CENTER LTDA"
              error={errors.nome?.message}
              disabled={isSubmitting}
              className="uppercase font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelStyle}>Categoria</label>
              <div className="relative">
                <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                  {tiposFornecedor.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.tipo && <p className="text-[10px] text-error mt-1 ml-1">{errors.tipo.message}</p>}
            </div>

            <div>
              <label className={labelStyle}>CNPJ (Opcional)</label>
              <Input
                {...register('cnpj')}
                placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message}
                disabled={isSubmitting}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-text-muted pl-1 mt-1">Formato: XX.XXX.XXX/XXXX-XX</p>
            </div>
          </div>

          {/* SERVIÇOS OFERECIDOS */}
          <div className="pt-2 border-t border-border">
            <label className={labelStyle}>
              Serviços Oferecidos
              <span className="ml-2 text-[10px] font-normal text-text-muted normal-case">(Clique para marcar o que este local oferece)</span>
            </label>

            <div className="bg-background p-4 rounded-xl border border-border mt-2 min-h-[100px]">
              {produtosDisponiveis.length === 0 ? (
                <p className="text-xs text-error text-center py-2">Nenhum produto cadastrado no sistema.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {produtosDisponiveis.map(prod => {
                    const isSelected = selectedIds.includes(prod.id);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProduto(prod.id)}
                        disabled={isSubmitting}
                        className={`
                          text-xs px-3 py-1.5 rounded-full border transition-all font-medium flex items-center gap-1.5
                          ${isSelected
                            ? 'bg-primary border-primary text-white shadow-md hover:bg-primary-hover'
                            : 'bg-surface border-border text-text-secondary hover:border-primary/50 hover:text-primary'}
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {prod.nome}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[10px] text-text-muted mt-2 ml-1">
              * Isso filtrará automaticamente os formulários de manutenção para evitar erros.
            </p>
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
            isLoading={isSubmitting}
            className="shadow-button hover:shadow-float px-6"
            disabled={isSubmitting}
            icon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Parceiro'}
          </Button>
        </div>

      </form>
    </div>
  );
}