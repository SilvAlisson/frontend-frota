import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { FormCadastrarCargo } from './forms/FormCadastrarCargo';
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
            const response = await api.get<Cargo[]>('/cargos');
            setCargos(response.data);
        } catch (err) {
            console.error("Erro ao carregar cargos:", err);
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
        try {
            await api.delete(`/cargos/${id}`);
            setCargos(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert("Erro ao remover cargo. Verifique se há colaboradores vinculados.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleSucesso = () => {
        setModo('listando');
        fetchCargos();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">Gestão de Cargos e Requisitos</h3>
                {modo === 'listando' && (
                    <Button variant="primary" onClick={() => setModo('adicionando')}>+ Novo Cargo</Button>
                )}
            </div>

            {modo === 'adicionando' && (
                <div className="bg-white p-6 rounded-card shadow-card border border-gray-100 max-w-2xl mx-auto">
                    <FormCadastrarCargo onSuccess={handleSucesso} onCancelar={() => setModo('listando')} />
                </div>
            )}

            {modo === 'listando' && (
                <>
                    {loading ? (
                        <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {cargos.map(cargo => (
                                <div key={cargo.id} className="bg-white p-5 rounded-card shadow-sm border border-gray-100 hover:shadow-md transition-all relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-text text-lg">{cargo.nome}</h4>
                                            <p className="text-xs text-text-secondary">{cargo.descricao || 'Sem descrição'}</p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            className="!p-1.5 h-7 w-7"
                                            onClick={() => handleDelete(cargo.id)}
                                            isLoading={deletingId === cargo.id}
                                            icon={<IconeLixo />}
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Requisitos Obrigatórios:</p>
                                        {cargo.requisitos && cargo.requisitos.length > 0 ? (
                                            <ul className="space-y-2">
                                                {cargo.requisitos.map(req => (
                                                    <li key={req.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                                        <span className="font-medium text-gray-700">{req.nome}</span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                                            {req.validadeMeses > 0 ? `${req.validadeMeses} m` : '∞'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Nenhum requisito cadastrado.</p>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Colaboradores ativos:</span>
                                        <span className="text-sm font-bold text-primary">{cargo._count?.colaboradores || 0}</span>
                                    </div>
                                </div>
                            ))}

                            {cargos.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    Nenhum cargo cadastrado. Comece criando as funções da empresa.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}