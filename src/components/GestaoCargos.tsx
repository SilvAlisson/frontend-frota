import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { FormCadastrarCargo } from './forms/FormCadastrarCargo';
import { toast } from 'sonner';
import type { Cargo } from '../types';

function IconeLixo() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

export function GestaoCargos() {
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [modo, setModo] = useState<'listando' | 'adicionando'>('listando');
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchCargos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<Cargo[]>('/cargos');
            setCargos(data);
        } catch (err) {
            console.error("Erro ao carregar cargos:", err);
            toast.error("Não foi possível carregar a lista de cargos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCargos();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("ATENÇÃO: Remover este cargo pode afetar o histórico de treinamentos. Continuar?")) return;

        setDeletingId(id);

        const promise = api.delete(`/cargos/${id}`);

        toast.promise(promise, {
            loading: 'Removendo cargo...',
            success: () => {
                setCargos(prev => prev.filter(c => c.id !== id));
                setDeletingId(null);
                return 'Cargo removido com sucesso.';
            },
            error: (err) => { // CORREÇÃO APLICADA: Mensagem específica no log
                setDeletingId(null);
                console.error("Erro ao deletar cargo:", err);
                return 'Erro ao remover. Verifique se há colaboradores vinculados.';
            }
        });
    };

    const handleSucesso = () => {
        setModo('listando');
        fetchCargos();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* CABEÇALHO */}
            {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                        Cargos & Requisitos
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Gerencie as funções e os treinamentos obrigatórios para cada uma.
                    </p>
                </div>

                {modo === 'listando' && (
                    <Button
                        variant="primary"
                        onClick={() => setModo('adicionando')}
                        className="shadow-lg shadow-primary/20"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        }
                    >
                        Novo Cargo
                    </Button>
                )}
            </div>

            {/* FORMULÁRIO DE CADASTRO */}
            {modo === 'adicionando' && (
                // [PADRONIZAÇÃO] shadow-card, border-border
                <div className="bg-white p-8 rounded-2xl shadow-card border border-border max-w-2xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
                    <FormCadastrarCargo onSuccess={handleSucesso} onCancelar={() => setModo('listando')} />
                </div>
            )}

            {/* LISTAGEM DE CARGOS */}
            {modo === 'listando' && (
                <>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            {/* [PADRONIZAÇÃO] border-gray-200 -> border-border, border-t-primary */}
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary mb-4"></div>
                            <p className="text-primary font-medium animate-pulse">Sincronizando cargos...</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {cargos.map(cargo => (
                                // [PADRONIZAÇÃO] border-gray-100 -> border-border
                                <div key={cargo.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all duration-300 flex flex-col h-full">

                                    {/* Topo do Card */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg tracking-tight group-hover:text-primary transition-colors">
                                                {cargo.nome}
                                            </h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">
                                                {cargo.descricao || 'Sem descrição definida.'}
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            className="!p-2 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            onClick={() => handleDelete(cargo.id)}
                                            isLoading={deletingId === cargo.id}
                                            title="Excluir Cargo"
                                            icon={<IconeLixo />}
                                        />
                                    </div>

                                    {/* Lista de Requisitos */}
                                    {/* [PADRONIZAÇÃO] bg-gray-50/50 -> bg-background, border-gray-100/50 -> border-border */}
                                    <div className="flex-1 bg-background rounded-xl p-3 border border-border mt-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 pl-1 tracking-wider">
                                            Requisitos Obrigatórios
                                        </p>

                                        {cargo.requisitos && cargo.requisitos.length > 0 ? (
                                            <ul className="space-y-2">
                                                {cargo.requisitos.map(req => (
                                                    // [PADRONIZAÇÃO] border-gray-100 -> border-border
                                                    <li key={req.id} className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-border shadow-sm">
                                                        <span className="font-medium text-gray-700 truncate max-w-[60%]" title={req.nome}>
                                                            {req.nome}
                                                        </span>
                                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                                                            {req.validadeMeses > 0 ? `${req.validadeMeses} meses` : 'Permanente'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            // [PADRONIZAÇÃO] border-gray-200 -> border-border
                                            <div className="text-center py-4 text-gray-400 text-xs italic bg-white/50 rounded-lg border border-dashed border-border">
                                                Nenhum requisito cadastrado.
                                            </div>
                                        )}
                                    </div>

                                    {/* Rodapé do Card */}
                                    {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
                                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">Colaboradores ativos</span>
                                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                            {cargo._count?.colaboradores || 0}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {cargos.length === 0 && (
                                // [PADRONIZAÇÃO] border-gray-200 -> border-border, bg-gray-50 -> bg-background
                                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-border text-center">
                                    <div className="p-4 bg-background rounded-full mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900">Nenhum cargo encontrado</h4>
                                    <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                                        Comece cadastrando as funções e competências necessárias para a sua operação.
                                    </p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setModo('adicionando')}
                                        // [PADRONIZAÇÃO] hover:bg-primary/10
                                        className="mt-4 text-primary hover:bg-primary/10"
                                    >
                                        Criar Primeiro Cargo
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}