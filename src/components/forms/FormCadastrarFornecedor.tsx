import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { toast } from 'sonner';
import { Store, Save, Check, Layers, Loader2, Info } from 'lucide-react';
import type { Produto } from '../../types';

const tipos = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- SCHEMA ZOD V4 ---
const fornecedorSchema = z.object({
  nome: z.string()
    .min(2, "Nome obrigatório (mín. 2 caracteres)")
    .transform(val => val.trim().toUpperCase()),
  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Formato: 00.000.000/0000-00")
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
    let isMounted = true;
    api.get('/produtos')
      .then(res => {
        if(isMounted) setProdutosDisponiveis(res.data);
      })
      .catch(err => console.error("Erro ao carregar produtos", err))
      .finally(() => {
        if(isMounted) setLoadingProdutos(false);
      });
      return () => { isMounted = false; }
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
    try {
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
            error: (err) => err.response?.data?.error || 'Erro ao cadastrar fornecedor.'
        });
    } catch(e) {
        console.error(e);
        toast.error('Ocorreu um erro ao processar os dados.');
    }
  };

  // Mapeamento de opções para o Select customizado
  const categoriaOptions = tipos.map(t => ({
      value: t,
      label: t.replace('_', ' ')
  }));

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Store className="w-5 h-5" />
            </div>
            Novo Parceiro
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Cadastro de oficinas, postos e serviços.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">

          <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                  <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Dados Empresariais</label>
              </div>

              <div>
                <Input
                  label="Razão Social / Nome Fantasia"
                  {...register('nome')}
                  placeholder="Ex: AUTO CENTER LTDA"
                  error={errors.nome?.message}
                  className="uppercase font-black text-primary tracking-wide placeholder:font-normal placeholder:tracking-normal"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Select 
                        label="Categoria Operacional"
                        options={categoriaOptions}
                        {...register('tipo')}
                        disabled={isSubmitting}
                        error={errors.tipo?.message as string}
                    />
                </div>

                <div>
                  <Input
                    label="CNPJ (Opcional)"
                    {...register('cnpj')}
                    placeholder="00.000.000/0000-00"
                    error={errors.cnpj?.message}
                    disabled={isSubmitting}
                    className="font-mono text-sm tracking-wider"
                  />
                </div>
              </div>
          </div>

          {/* --- SEÇÃO DE SERVIÇOS OFERECIDOS (CARDÁPIO) --- */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
                        <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Catálogo de Serviços</label>
                    </div>
                    <p className="text-[11px] text-text-secondary font-medium italic flex items-center gap-1">
                        <Info className="w-3 h-3"/> Clique para selecionar o que este local oferece.
                    </p>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold border border-primary/20">
                    {selectedIds.length} Selecionados
                </div>
            </div>

            <div className="bg-surface-hover/20 p-5 rounded-2xl border border-border/60 min-h-[120px] shadow-inner">
              {loadingProdutos ? (
                <div className="flex flex-col items-center justify-center py-6 h-full gap-3 text-primary/60">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">A carregar catálogo...</span>
                </div>
              ) : produtosDisponiveis.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 h-full opacity-60">
                   <Layers className="w-8 h-8 text-text-muted mb-2" />
                   <p className="text-sm font-bold text-text-main">Nenhum serviço ou produto cadastrado.</p>
                   <p className="text-xs text-text-secondary mt-1">Vá em Cadastro de Produtos para criar opções.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {produtosDisponiveis.map(prod => {
                    const isSelected = selectedIds.includes(prod.id);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProduto(prod.id)}
                        disabled={isSubmitting}
                        className={`
                          text-xs px-4 py-2 rounded-xl border-2 transition-all font-bold flex items-center gap-2 shadow-sm
                          hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
                          ${isSelected
                            ? 'bg-primary border-primary text-white shadow-md hover:bg-primary-hover'
                            : 'bg-surface border-border/60 text-text-secondary hover:border-primary/40 hover:text-text-main'}
                        `}
                      >
                        <div className={`flex items-center justify-center w-4 h-4 rounded-full border ${isSelected ? 'border-white/30 bg-white/20' : 'border-text-muted/40'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        {prod.nome}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-text-muted mt-3 ml-1 uppercase tracking-wider opacity-60">
              * O preenchimento correto evita erros na abertura de Ordens de Serviço.
            </p>
          </div>
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
            Salvar Parceiro
          </Button>
        </div>

      </form>
    </div>
  );
}