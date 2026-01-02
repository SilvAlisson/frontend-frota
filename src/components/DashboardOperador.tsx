import { useState } from 'react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import type { User, Veiculo, Jornada, Produto, Fornecedor } from '../types';

interface DashboardOperadorProps {
    user: User;
    usuarios: User[];
    veiculos: Veiculo[];
    produtos: Produto[];
    fornecedores: Fornecedor[];
    jornadasAtivas: Jornada[];
    onJornadaIniciada: (jornada: Jornada) => void;
    onJornadaFinalizada: (id: string) => void;
}

export function DashboardOperador({
    user,
    usuarios,
    veiculos,
    produtos,
    fornecedores,
    jornadasAtivas,
    onJornadaIniciada,
    onJornadaFinalizada
}: DashboardOperadorProps) {

    const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);

    // Filtra jornadas para encontrar a do operador logado
    const minhasJornadas = jornadasAtivas.filter(j => j.operador.id === user.id);
    const tenhoJornadaAtiva = minhasJornadas.length > 0;

    // Inteligência: Pega o ID do veículo em uso para facilitar o abastecimento
    const veiculoEmUsoId = tenhoJornadaAtiva ? minhasJornadas[0].veiculo.id : undefined;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER CENTRALIZADO COM IDENTIDADE VISUAL */}
            {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                {/* [PADRONIZAÇÃO] from-primary/10 -> from-primary/5 */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

                <div className="relative z-10 mb-4">
                    {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
                    <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-lg border border-border overflow-hidden">
                        {user.fotoUrl ? (
                            <img src={user.fotoUrl} alt={user.nome} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            // [PADRONIZAÇÃO] bg-primary text-white (mantido, pois é a cor da marca)
                            <div className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-inner">
                                {user.nome.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {/* Indicador de status em tempo real */}
                    <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-white rounded-full ${tenhoJornadaAtiva ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Olá, {user.nome.split(' ')[0]}!
                    </h2>
                    <p className="text-gray-500 font-medium mt-1 max-w-md mx-auto">
                        {tenhoJornadaAtiva
                            ? 'Bom trabalho! Você está com uma jornada em andamento.'
                            : 'Pronto para iniciar? Selecione seu veículo abaixo.'}
                    </p>
                </div>

                {/* BOTÃO DE AÇÃO RÁPIDA: ABASTECER */}
                <div className="mt-6 relative z-10">
                    <button
                        onClick={() => setModalAbastecimentoOpen(true)}
                        // [PADRONIZAÇÃO] border-gray-200 -> border-border
                        className="flex items-center gap-2 bg-white border border-border text-gray-700 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 hover:text-primary transition-all font-bold text-sm"
                    >
                        <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                            </svg>
                        </div>
                        Registrar Abastecimento
                    </button>
                </div>
            </div>

            {/* ÁREA OPERACIONAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {!tenhoJornadaAtiva ? (
                    <div className="lg:col-span-12 xl:col-span-6 mx-auto w-full max-w-xl">
                        {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
                        <div className="bg-white shadow-card rounded-3xl p-8 border border-border transition-all hover:shadow-card-hover">
                            <IniciarJornada
                                usuarios={usuarios}
                                veiculos={veiculos}
                                operadorLogadoId={user.id}
                                onJornadaIniciada={onJornadaIniciada}
                                jornadasAtivas={jornadasAtivas}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-12 xl:col-span-8 mx-auto w-full max-w-2xl space-y-6">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider">
                                Jornada Ativa
                            </h3>
                        </div>
                        <div className="space-y-5">
                            {minhasJornadas.map((jornada) => (
                                <JornadaCard
                                    key={jornada.id}
                                    jornada={jornada}
                                    onJornadaFinalizada={() => onJornadaFinalizada(jornada.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE ABASTECIMENTO */}
            {modalAbastecimentoOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setModalAbastecimentoOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <RegistrarAbastecimento
                            usuarios={usuarios}
                            veiculos={veiculos}
                            produtos={produtos}
                            fornecedores={fornecedores}
                            usuarioLogado={user}
                            veiculoPreSelecionadoId={veiculoEmUsoId}
                            onClose={() => setModalAbastecimentoOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}