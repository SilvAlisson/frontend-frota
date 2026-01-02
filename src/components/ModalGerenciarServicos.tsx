import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import { X, Wrench, Settings, Package, Sparkles, Trash2, Lightbulb, Box } from 'lucide-react';
import type { Produto } from '../types';

// Tipos focados em manutenção
// 'as const' permite que o Zod infira os literais exatos
const tiposServico = ["SERVICO", "PECA", "LAVAGEM", "OUTRO"] as const;

const servicoSchema = z.object({
    nome: z.string()
        .min(1, { message: "Nome obrigatório" })
        .min(2, { message: "Mínimo 2 caracteres" })
        .transform(val => val.toUpperCase().trim()),

    // Sintaxe limpa: enum simples + default
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-background shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="p-2 bg-primary/10 text-primary rounded-lg">
                                <Wrench className="w-5 h-5" />
                            </span>
                            Catálogo de Manutenção
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 ml-1">Gerencie os serviços e peças disponíveis.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* COLUNA 1: FORMULÁRIO */}
                    <div className="w-full md:w-1/3 p-6 bg-white border-r border-border overflow-y-auto">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" /> Novo Item
                        </h4>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Input
                                label="Nome do Item"
                                placeholder="Ex: TROCA DE PNEU"
                                {...register('nome')}
                                error={errors.nome?.message}
                                className="uppercase"
                                autoFocus
                            />

                            <div>
                                <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">Categoria</label>
                                <select
                                    {...register('tipo')}
                                    className="w-full h-11 px-3 bg-white border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                                >
                                    <option value="SERVICO">🛠️ Serviço</option>
                                    <option value="PECA">⚙️ Peça</option>
                                    <option value="LAVAGEM">🚿 Lavagem</option>
                                    <option value="OUTRO">📦 Outro</option>
                                </select>
                            </div>

                            <Input
                                label="Unidade (Ex: UN, HR, KIT)"
                                placeholder="UN"
                                {...register('unidadeMedida')}
                                error={errors.unidadeMedida?.message}
                                className="uppercase"
                            />

                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full mt-2"
                                variant="primary"
                            >
                                Adicionar ao Catálogo
                            </Button>
                        </form>

                        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <h5 className="text-primary font-bold text-xs mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" /> Dica Rápida
                            </h5>
                            <p className="text-xs text-primary/80 leading-relaxed">
                                Cadastre itens genéricos como "TROCA DE PNEU". Evite duplicatas.
                            </p>
                        </div>
                    </div>

                    {/* COLUNA 2: LISTAGEM */}
                    <div className="w-full md:w-2/3 flex flex-col bg-background h-full">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-white shrink-0">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" /> Itens Disponíveis ({servicos.length})
                            </h4>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full" />
                                    <span className="text-sm">Carregando catálogo...</span>
                                </div>
                            ) : servicos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                                        <Box className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-medium">Nenhum item cadastrado.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {servicos.map(item => (
                                        <div key={item.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-lg shrink-0 ${item.tipo === 'SERVICO' ? 'bg-primary/10 text-primary' :
                                                    item.tipo === 'PECA' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-background text-gray-600'
                                                    }`}>
                                                    {item.tipo === 'SERVICO' && <Settings className="w-4 h-4" />}
                                                    {item.tipo === 'PECA' && <Package className="w-4 h-4" />}
                                                    {item.tipo !== 'SERVICO' && item.tipo !== 'PECA' && <span className="font-bold text-xs">{item.tipo.substring(0, 1)}</span>}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate" title={item.nome}>{item.nome}</p>
                                                    <p className="text-[10px] text-gray-500 bg-background px-1.5 rounded inline-block mt-0.5 border border-gray-100">
                                                        {item.unidadeMedida}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Remover"
                                            >
                                                {deletingId === item.id ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}