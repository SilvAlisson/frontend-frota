import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Settings, Package, Sparkles, Trash2, Lightbulb, Box, Loader2, Droplets, Grid } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import { ConfirmModal } from './ui/ConfirmModal';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import type { Produto } from '../types';

const tiposServico = ["SERVICO", "PECA", "LAVAGEM", "OUTRO"] as const;

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const servicoSchema = z.object({
  nome: z.string({ error: "Nome obrigatório" })
    .min(2, { message: "Mínimo 2 caracteres" })
    .transform(val => val.toUpperCase().trim()),

  tipo: z.enum(tiposServico).default('SERVICO'),

  unidadeMedida: z.string({ error: "Unidade obrigatória" })
    .min(1, { message: "Ex: UN, HR" })
    .transform(val => val.toUpperCase().trim())
    .default('UN'),
});

type ServicoFormInput = z.input<typeof servicoSchema>;
type ServicoFormOutput = z.output<typeof servicoSchema>;

interface ModalGerenciarServicosProps {
  onClose: () => void;
  onItemAdded?: (novoItem: Produto) => void;
}

export function ModalGerenciarServicos({ onClose, onItemAdded }: ModalGerenciarServicosProps) {
  const [servicos, setServicos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DO MODAL DE EXCLUSÃO ---
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ServicoFormInput, any, ServicoFormOutput>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: '',
      tipo: 'SERVICO',
      unidadeMedida: 'UN'
    },
    mode: 'onBlur'
  });

  // --- CARREGAR DADOS ---
  const fetchServicos = async () => {
    setLoading(true);
    try {
      const response = await api.get<Produto[]>('/produtos');
      const filtrados = response.data
        .filter(p => ['SERVICO', 'PECA', 'LAVAGEM', 'OUTRO'].includes(p.tipo))
        .sort((a, b) => a.nome.localeCompare(b.nome));

      setServicos(filtrados);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao Acessar ao catálogo de serviços.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  // --- ADICIONAR ---
  const onSubmit = async (data: ServicoFormOutput) => {
    try {
      const response = await api.post('/produtos', data);
      toast.success(`Catálogo atualizado com sucesso!`);

      reset();
      fetchServicos();

      if (onItemAdded) {
        onItemAdded(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('Este item já existe no catálogo.');
      } else {
        toast.error('Ocorreu um erro ao registar o item.');
      }
    }
  };

  // --- REMOVER (NOVA LÓGICA SEM WINDOW.CONFIRM) ---
  const executeDelete = async () => {
    if (!itemToDelete) return;
    
    setDeletingId(itemToDelete);
    try {
      await api.delete(`/produtos/${itemToDelete}`);
      setServicos(prev => prev.filter(p => p.id !== itemToDelete));
      toast.success('Item removido do catálogo.');
    } catch (err) {
      toast.error('Não é possível remover itens que já tenham sido utilizados em Ordens de Serviço.');
    } finally {
      setDeletingId(null);
      setItemToDelete(null); // Fecha o modal
    }
  };

  const categoriasOpcoes = [
    { value: 'SERVICO', label: 'ðŸ› ï¸ Serviço de Oficina' },
    { value: 'PECA', label: 'âš™ï¸ Peça / Componente' },
    { value: 'LAVAGEM', label: 'ðŸš¿ Lavagem / Estética' },
    { value: 'OUTRO', label: 'ðŸ“¦ Outros' }
  ];

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title="Catálogo de Manutenção" 
      className="max-w-5xl"
    >
      <div className="flex flex-col md:flex-row gap-8 p-2 max-h-[75vh] overflow-y-auto custom-scrollbar">

        {/* COLUNA 1: FORMULÁRIO */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 h-fit shrink-0 md:sticky md:top-0">
          <Card padding="default" className="bg-surface-hover/30 border border-border/60 shadow-sm rounded-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em]">
                Registar Novo Item
              </h4>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Descrição do Serviço / Peça"
                placeholder="Ex: TROCA DE ÓLEO"
                {...register('nome')}
                error={errors.nome?.message}
                className="uppercase font-bold tracking-wide"
                autoFocus
                disabled={isSubmitting}
              />

              <Select
                label="Categoria"
                options={categoriasOpcoes}
                {...register('tipo')}
                error={errors.tipo?.message}
                disabled={isSubmitting}
              />

              <div className="relative">
                <Input
                  label="Unidade de Medida"
                  placeholder="UN"
                  {...register('unidadeMedida')}
                  error={errors.unidadeMedida?.message}
                  className="uppercase font-mono font-bold text-center tracking-widest"
                  maxLength={4}
                  disabled={isSubmitting}
                  containerClassName="!mb-0"
                />
                <span className="absolute right-4 top-[34px] text-[9px] font-black text-text-muted pointer-events-none uppercase tracking-widest">
                  EX: UN, HR
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full shadow-button hover:shadow-float-primary mt-2 py-5 font-black uppercase tracking-widest"
              >
                Adicionar ao Catálogo
              </Button>
            </form>
          </Card>

          {/* ✨ O NOVO CALLOUT EM AÇÃO */}
          <Callout variant="info" title="Dica de Ouro" icon={Lightbulb}>
            Cadastre itens genéricos (ex: "LAVAGEM COMPLETA" ou "MÃO DE OBRA MECÂNICA") para reaproveitá-los em múltiplas faturas.
          </Callout>
        </div>

        {/* COLUNA 2: LISTAGEM */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2 border-b border-border/50 pb-2">
            <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
              <Grid className="w-4 h-4 text-text-muted" /> Itens Disponíveis
            </h4>
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-xs shadow-inner border border-primary/20">
              {servicos.length}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-[74px] w-full rounded-2xl border border-border/40" />
              ))}
            </div>
          ) : servicos.length === 0 ? (
            /* ✨ O NOVO EMPTY STATE EM AÇÃO */
            <EmptyState 
              icon={Box} 
              title="Catálogo Vazio" 
              description="Utilize o formulário ao lado para registar o primeiro item." 
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
              {servicos.map(item => (
                <Card 
                  key={item.id} 
                  padding="sm" 
                  className="group flex items-center justify-between border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 bg-surface h-full"
                >
                  <div className="flex items-center gap-4 overflow-hidden py-1 pl-1">
                    <div className={`p-2.5 rounded-xl shrink-0 shadow-inner ${
                      item.tipo === 'SERVICO' ? 'bg-primary/10 text-primary border border-primary/20' :
                      item.tipo === 'PECA' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      item.tipo === 'LAVAGEM' ? 'bg-info/10 text-info border border-info/20' :
                      'bg-surface-hover border border-border text-text-secondary'
                    }`}>
                      {item.tipo === 'SERVICO' && <Settings className="w-4 h-4" />}
                      {item.tipo === 'PECA' && <Package className="w-4 h-4" />}
                      {item.tipo === 'LAVAGEM' && <Droplets className="w-4 h-4" />}
                      {item.tipo !== 'SERVICO' && item.tipo !== 'PECA' && item.tipo !== 'LAVAGEM' && <span className="font-black text-xs px-1">{item.tipo.substring(0, 1)}</span>}
                    </div>

                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="font-black text-text-main text-sm truncate tracking-tight" title={item.nome}>
                        {item.nome}
                      </p>
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
                        Unidade: <span className="bg-surface-hover px-1.5 py-0.5 rounded border border-border/60 text-text-main font-mono">{item.unidadeMedida}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setItemToDelete(item.id)} // âš ï¸ Aciona o Modal
                    disabled={deletingId === item.id}
                    className="h-10 w-10 text-text-muted hover:text-white hover:bg-error opacity-100 lg:opacity-0 group-hover:opacity-100 shrink-0 transition-all rounded-xl ml-2 shadow-sm"
                    title="Remover Item"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* ✨ O NOSSO CONFIRM MODAL (Substitui o window.confirm) */}
      <ConfirmModal 
        isOpen={!!itemToDelete}
        onCancel={() => setItemToDelete(null)}
        onConfirm={executeDelete}
        title="Excluir Item do Catálogo"
        description="Tem certeza de que deseja remover este item? Esta ação é irreversível e o item não estará mais disponível para novas faturas."
        variant="danger"
        confirmLabel="Sim, Excluir"
      />
    </Modal>
  );
}



