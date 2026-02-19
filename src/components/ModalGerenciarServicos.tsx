import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Settings, Package, Sparkles, Trash2, Lightbulb, Box } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import type { Produto } from '../types';

const tiposServico = ["SERVICO", "PECA", "LAVAGEM", "OUTRO"] as const;

const servicoSchema = z.object({
    nome: z.string()
        .min(1, { message: "Nome obrigatório" })
        .min(2, { message: "Mínimo 2 caracteres" })
        .transform(val => val.toUpperCase().trim()),

    tipo: z.enum(tiposServico).default('SERVICO'),

    unidadeMedida: z.string()
        .min(1, { message: "Unidade obrigatória" })
        .default('UN'),
});

type ServicoFormInput = z.input<typeof servicoSchema>;

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
    } = useForm<ServicoFormInput>({
        resolver: zodResolver(servicoSchema),
        defaultValues: {
            nome: '',
            tipo: 'SERVICO',
            unidadeMedida: 'UN'
        }
    });

    // --- CARREGAR DADOS ---
    const fetchServicos = async () => {
        try {
            const response = await api.get<Produto[]>('/produtos');
            const filtrados = response.data
                .filter(p => ['SERVICO', 'PECA', 'LAVAGEM', 'OUTRO'].includes(p.tipo))
                .sort((a, b) => a.nome.localeCompare(b.nome));

            setServicos(filtrados);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar catálogo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServicos();
    }, []);

    // --- ADICIONAR ---
    const onSubmit = async (data: ServicoFormInput) => {
        try {
            const response = await api.post('/produtos', data);
            toast.success(`${data.tipo} adicionado!`);

            reset();
            fetchServicos();

            if (onItemAdded) {
                onItemAdded(response.data);
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error('Este item já existe no catálogo.');
            } else {
                toast.error('Erro ao cadastrar item.');
            }
        }
    };

    // --- REMOVER ---
    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza? Isso removerá o item do catálogo permanentemente.')) return;

        setDeletingId(id);
        try {
            await api.delete(`/produtos/${id}`);
            setServicos(prev => prev.filter(p => p.id !== id));
            toast.success('Item removido.');
        } catch (err) {
            toast.error('Não é possível remover itens usados em OS.');
        } finally {
            setDeletingId(null);
        }
    };

    const categoriasOpcoes = [
        { value: 'SERVICO', label: '🛠️ Serviço' },
        { value: 'PECA', label: '⚙️ Peça' },
        { value: 'LAVAGEM', label: '🚿 Lavagem' },
        { value: 'OUTRO', label: '📦 Outro' }
    ];

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title="Catálogo de Manutenção" 
            className="max-w-5xl"
        >
            <div className="flex flex-col md:flex-row gap-6 p-1">

                {/* COLUNA 1: FORMULÁRIO */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <Card padding="default" variant="outline" className="bg-gray-50/50">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" /> Novo Item
                        </h4>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Input
                                label="Nome do Item"
                                placeholder="Ex: TROCA DE PNEU"
                                {...register('nome')}
                                error={errors.nome?.message}
                                className="uppercase bg-white"
                                autoFocus
                            />

                            <Select
                                label="Categoria"
                                options={categoriasOpcoes}
                                {...register('tipo')}
                                error={errors.tipo?.message}
                                className="bg-white"
                            />

                            <Input
                                label="Unidade (Ex: UN, HR, KIT)"
                                placeholder="UN"
                                {...register('unidadeMedida')}
                                error={errors.unidadeMedida?.message}
                                className="uppercase bg-white"
                            />

                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full mt-2"
                            >
                                Adicionar ao Catálogo
                            </Button>
                        </form>
                    </Card>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                        <div className="mt-0.5"><Lightbulb className="w-4 h-4 text-blue-500" /></div>
                        <div>
                            <h5 className="text-blue-700 font-bold text-xs mb-1">Dica Rápida</h5>
                            <p className="text-xs text-blue-600/80 leading-relaxed">
                                Cadastre itens genéricos como "TROCA DE PNEU" para reaproveitar. Evite duplicatas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* COLUNA 2: LISTAGEM */}
                <div className="w-full md:w-2/3 flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 px-1">
                        <Package className="w-4 h-4 text-gray-400" /> Itens Disponíveis ({servicos.length})
                    </h4>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3 bg-gray-50 rounded-2xl">
                            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full" />
                            <span className="text-sm font-medium">Carregando catálogo...</span>
                        </div>
                    ) : servicos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                            <div className="bg-gray-50 p-4 rounded-full mb-3">
                                <Box className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium text-sm">Nenhum item cadastrado no catálogo.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {servicos.map(item => (
                                <Card 
                                    key={item.id} 
                                    padding="sm" 
                                    variant="outline" 
                                    className="group flex items-center justify-between hover:border-primary/30 transition-all"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-lg shrink-0 ${
                                            item.tipo === 'SERVICO' ? 'bg-primary/10 text-primary' :
                                            item.tipo === 'PECA' ? 'bg-orange-50 text-orange-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {item.tipo === 'SERVICO' && <Settings className="w-4 h-4" />}
                                            {item.tipo === 'PECA' && <Package className="w-4 h-4" />}
                                            {item.tipo !== 'SERVICO' && item.tipo !== 'PECA' && <span className="font-bold text-xs">{item.tipo.substring(0, 1)}</span>}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate" title={item.nome}>
                                                {item.nome}
                                            </p>
                                            <p className="text-[10px] text-gray-500 bg-gray-50 px-1.5 rounded inline-block mt-0.5 border border-gray-100 font-medium">
                                                {item.unidadeMedida}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                        className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                                        title="Remover"
                                    >
                                        {deletingId === item.id ? (
                                            <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full" />
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