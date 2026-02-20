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
            toast.error('Falha ao aceder ao catálogo de serviços.');
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

    // --- REMOVER ---
    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem a certeza? Esta ação removerá o item do catálogo base.')) return;

        setDeletingId(id);
        try {
            await api.delete(`/produtos/${id}`);
            setServicos(prev => prev.filter(p => p.id !== id));
            toast.success('Item removido do catálogo.');
        } catch (err) {
            toast.error('Não é possível remover itens que já tenham sido utilizados em Ordens de Serviço.');
        } finally {
            setDeletingId(null);
        }
    };

    const categoriasOpcoes = [
        { value: 'SERVICO', label: '🛠️ Serviço de Oficina' },
        { value: 'PECA', label: '⚙️ Peça / Componente' },
        { value: 'LAVAGEM', label: '🚿 Lavagem / Estética' },
        { value: 'OUTRO', label: '📦 Outros' }
    ];

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title="Catálogo de Manutenção" 
            className="max-w-5xl"
        >
            {/* AQUI ESTÁ A MAGIA DO SCROLL: 
              Limitamos a altura máxima (max-h) e usamos overflow-y-auto no wrapper interno,
              garantindo que o conteúdo não vaza para cima do header do modal.
            */}
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

                    <div className="p-5 bg-info/10 rounded-3xl border border-info/20 flex gap-4 shadow-sm">
                        <div className="mt-1 shrink-0"><Lightbulb className="w-5 h-5 text-info" /></div>
                        <div>
                            <h5 className="text-info font-black text-[10px] uppercase tracking-[0.2em] mb-1.5">Dica de Ouro</h5>
                            <p className="text-xs text-info/80 font-medium leading-relaxed">
                                Cadastre itens genéricos (ex: "LAVAGEM COMPLETA" ou "MÃO DE OBRA MECÂNICA") para reaproveitá-los em múltiplas faturas.
                            </p>
                        </div>
                    </div>
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
                        <div className="flex flex-col items-center justify-center py-20 text-primary/50 gap-4 bg-surface border border-border/60 rounded-3xl shadow-sm">
                            <Loader2 className="animate-spin w-10 h-10" />
                            <span className="text-xs font-black uppercase tracking-widest animate-pulse">A carregar catálogo...</span>
                        </div>
                    ) : servicos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-text-muted border-2 border-dashed border-border/60 rounded-3xl bg-surface-hover/30 transition-colors hover:border-primary/30">
                            <div className="bg-surface p-5 rounded-full mb-4 shadow-sm">
                                <Box className="w-10 h-10 text-text-muted/50" />
                            </div>
                            <p className="font-black uppercase tracking-widest text-sm text-text-main">Catálogo Vazio</p>
                            <p className="text-xs font-medium mt-1">Utilize o formulário ao lado para registar o primeiro item.</p>
                        </div>
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
                                            item.tipo === 'LAVAGEM' ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20' :
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
                                        onClick={() => handleDelete(item.id)}
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
        </Modal>
    );
}