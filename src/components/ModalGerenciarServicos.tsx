import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import type { Produto } from '../types';

// Tipos focados em manutenção (exclui Combustível/Aditivo para não poluir)
const tiposServico = ["SERVICO", "PECA", "LAVAGEM", "OUTRO"] as const;

const servicoSchema = z.object({
    nome: z.string({ error: "Nome obrigatório" })
        .min(2, { error: "Mínimo 2 caracteres" })
        .transform(val => val.toUpperCase().trim()),

    tipo: z.enum(tiposServico, {
        error: "Selecione o tipo"
    }).default('SERVICO'),

    unidadeMedida: z.string({ error: "Unidade obrigatória" })
        .min(1, { error: "Informe a unidade" })
        .default('UN'),
});

type ServicoFormInput = z.input<typeof servicoSchema>;

interface ModalGerenciarServicosProps {
    onClose: () => void;
    // Callback para atualizar o pai sem refresh
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
            // Filtra apenas o que é relevante para manutenção (tira combustível)
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
            fetchServicos(); // Atualiza a lista da modal

            // Notifica o componente pai para atualizar o select sem refresh
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
        if (!confirm('Tem certeza? Isso removerá o item do catálogo.')) return;

        setDeletingId(id);
        try {
            await api.delete(`/produtos/${id}`);
            setServicos(prev => prev.filter(p => p.id !== id));
            toast.success('Item removido.');
        } catch (err) {
            toast.error('Não é possível remover itens que já foram usados em Ordens de Serviço.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                                </svg>
                            </span>
                            Catálogo de Manutenção
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 ml-1">Gerencie os serviços e peças disponíveis para as oficinas.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* COLUNA 1: FORMULÁRIO */}
                    <div className="w-full md:w-1/3 p-6 bg-white border-r border-gray-100 overflow-y-auto">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Novo Item</h4>

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
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                            >
                                Adicionar ao Catálogo
                            </Button>
                        </form>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h5 className="text-blue-800 font-bold text-xs mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                Dica Rápida
                            </h5>
                            <p className="text-xs text-blue-600 leading-relaxed">
                                Cadastre itens genéricos como "TROCA DE PNEU" ou "FILTRO DE ÓLEO". Evite criar itens duplicados com nomes parecidos.
                            </p>
                        </div>
                    </div>

                    {/* COLUNA 2: LISTAGEM */}
                    <div className="w-full md:w-2/3 flex flex-col bg-gray-50/30">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Itens Disponíveis ({servicos.length})</h4>
                            {/* Aqui poderia entrar um campo de busca no futuro */}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-10 text-gray-400">Carregando catálogo...</div>
                            ) : servicos.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                                    <div className="bg-gray-100 p-3 rounded-full mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 11.25V18m0-6.75l2.25-2.25M12 11.25l-2.25 2.25m-3.75 4.5h.008v.008h-.008v-.008zm11.25 0h.008v.008h-.008v-.008z" /></svg>
                                    </div>
                                    Nenhum item cadastrado.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {servicos.map(item => (
                                        <div key={item.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-lg shrink-0 ${item.tipo === 'SERVICO' ? 'bg-blue-50 text-blue-600' :
                                                    item.tipo === 'PECA' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.tipo === 'SERVICO' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" clipRule="evenodd" /></svg>}
                                                    {item.tipo === 'PECA' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.995 6.995 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.995 6.995 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.953 6.953 0 01-.587-1.416l-1.473-.294a1 1 0 01-.804-.98V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" /></svg>}
                                                    {item.tipo !== 'SERVICO' && item.tipo !== 'PECA' && <span className="font-bold text-xs">{item.tipo.substring(0, 1)}</span>}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate">{item.nome}</p>
                                                    <p className="text-[10px] text-gray-500 bg-gray-100 px-1.5 rounded inline-block mt-0.5">{item.unidadeMedida}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remover"
                                            >
                                                {deletingId === item.id ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
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