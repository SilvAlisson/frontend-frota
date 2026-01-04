import { useState } from 'react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import { Fuel, Truck } from 'lucide-react';
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
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* --- HEADER CENTRALIZADO (ESTILO APP MOBILE) --- */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                {/* Efeito de fundo sutil */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

                <div className="relative z-10 mb-4">
                    <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-lg border border-border overflow-hidden mx-auto">
                        {user.fotoUrl ? (
                            <img src={user.fotoUrl} alt={user.nome} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-inner">
                                {user.nome.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {/* Indicador de Status */}
                    <div className={`absolute bottom-1 right-[calc(50%-45px)] w-6 h-6 border-4 border-white rounded-full shadow-sm ${tenhoJornadaAtiva ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={tenhoJornadaAtiva ? "Em Jornada" : "Inativo"}></div>
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

                {/* BOTÕES DE AÇÃO RÁPIDA */}
                <div className="mt-8 flex gap-3 relative z-10 justify-center flex-wrap">
                    <button
                        onClick={() => setModalAbastecimentoOpen(true)}
                        className="flex items-center gap-2 bg-white border border-border text-gray-700 px-5 py-3 rounded-xl shadow-sm hover:shadow-md hover:border-orange-200 hover:text-orange-600 transition-all font-bold text-sm group"
                    >
                        <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <Fuel className="w-5 h-5" />
                        </div>
                        Registrar Abastecimento
                    </button>
                </div>
            </div>

            {/* --- ÁREA OPERACIONAL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
                {!tenhoJornadaAtiva ? (
                    // 1. ESTADO: SEM JORNADA (MOSTRAR SELETOR)
                    <div className="lg:col-span-12 xl:col-span-8 xl:col-start-3 w-full">
                        <div className="bg-white shadow-card rounded-3xl p-1 border border-border overflow-hidden transition-all hover:shadow-card-hover">
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Iniciar Nova Jornada</h3>
                                        <p className="text-sm text-gray-500">Selecione o veículo para começar</p>
                                    </div>
                                </div>

                                <IniciarJornada
                                    usuarios={usuarios}
                                    veiculos={veiculos}
                                    operadorLogadoId={user.id}
                                    onJornadaIniciada={onJornadaIniciada}
                                    jornadasAtivas={jornadasAtivas}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    // 2. ESTADO: JORNADA ATIVA (MOSTRAR CARD DA JORNADA)
                    <div className="lg:col-span-12 xl:col-span-8 xl:col-start-3 w-full space-y-6">
                        <div className="flex items-center justify-center gap-2 text-sm font-bold text-green-600 uppercase tracking-widest bg-green-50 py-2 px-4 rounded-full w-fit mx-auto border border-green-100">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Veículo em Operação
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

            {/* --- MODAL DE ABASTECIMENTO --- */}
            {modalAbastecimentoOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setModalAbastecimentoOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl bg-white"
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