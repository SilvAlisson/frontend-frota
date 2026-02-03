import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Store, Save, Check } from 'lucide-react'; // Ícones novos
import type { Produto } from '../../types';

const tipos = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- SCHEMA ---
const fornecedorSchema = z.object({
  nome: z.string()
    .min(2, "Nome obrigatório (mín. 2 caracteres)")
    .transform(val => val.trim().toUpperCase()),

  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Formato inválido: 00.000.000/0000-00")
  ]).optional().nullable(),

  tipo: z.enum(tipos).default('OUTROS'),

  produtosIds: z.array(z.string()).default([]),
});

type FormInput = z.input<typeof fornecedorSchema>;
type FormOutput = z.output<typeof fornecedorSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ onSuccess, onCancelar }: FormProps) {
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      tipo: 'OUTROS',
      produtosIds: []
    },
    mode: 'onBlur'
  });

  const selectedIds = watch('produtosIds') || [];

  useEffect(() => {
    api.get('/produtos')
      .then(res => setProdutosDisponiveis(res.data))
      .catch(err => console.error("Erro ao carregar produtos", err))
      .finally(() => setLoadingProdutos(false));
  }, []);

  const toggleProduto = (id: string) => {
    const current = selectedIds;
    if (current.includes(id)) {
      setValue('produtosIds', current.filter(item => item !== id));
    } else {
      setValue('produtosIds', [...current, id]);
    }
  };

  const onSubmit = async (data: FormOutput) => {
    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      tipo: data.tipo,
      cnpj: data.cnpj && data.cnpj.trim() !== '' ? DOMPurify.sanitize(data.cnpj) : null,
      produtosIds: data.produtosIds
    };

    const promise = api.post('/fornecedores', payload);

    toast.promise(promise, {
      loading: 'Cadastrando parceiro...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 500);
        return `Parceiro "${response.data.nome}" cadastrado!`;
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Erro ao cadastrar fornecedor.';
      }
    });
  };

  // Classes utilitárias (evitando hardcode)
  const labelStyle = "block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background";

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Novo Parceiro</h3>
          <p className="text-xs text-text-secondary">Cadastro de oficinas e postos.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Store className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* Dados Principais */}
          <div>
            <Input
              label="Razão Social / Nome"
              {...register('nome')}
              placeholder="Ex: AUTO CENTER LTDA"
              error={errors.nome?.message}
              className="uppercase font-medium"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelStyle}>Categoria</label>
              <div className="relative">
                <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                  {tipos.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                {/* Seta customizada via CSS ou ícone absoluto se preferir */}
              </div>
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
            </div>
          </div>

          {/* --- SEÇÃO DE SERVIÇOS OFERECIDOS (CARDÁPIO) --- */}
          <div className="pt-2 border-t border-border">
            <label className={labelStyle}>
              Serviços Disponíveis
              <span className="ml-2 text-[10px] font-normal text-text-muted normal-case">(Clique para marcar o que este local oferece)</span>
            </label>

            <div className="bg-background p-4 rounded-xl border border-border mt-2 min-h-[100px]">
              {loadingProdutos ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : produtosDisponiveis.length === 0 ? (
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
            icon={<Save className="w-4 h-4" />}
            className="shadow-button hover:shadow-float px-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Parceiro'}
          </Button>
        </div>

      </form>
    </div>
  );
}