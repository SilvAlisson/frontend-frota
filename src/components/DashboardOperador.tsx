import { useState } from 'react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import type { User, Veiculo, Jornada, Produto, Fornecedor } from '../types';

interface DashboardOperadorProps {
    user: User;
    usuarios: User[];
    veiculos: Veiculo[];
    // Novas props recebidas do Dashboard.tsx
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

    const minhasJornadas = jornadasAtivas.filter(j => j.operador.id === user.id);
    const tenhoJornadaAtiva = minhasJornadas.length > 0;

    // Se estiver em jornada, pega o ID do veículo para pré-preencher o abastecimento
    const veiculoEmUsoId = tenhoJornadaAtiva ? minhasJornadas[0].veiculo.id : undefined;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER CENTRALIZADO COM "FOTO" */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

                <div className="relative z-10 mb-4">
                    <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-lg border border-gray-100 overflow-hidden">
                        {user.fotoUrl ? (
                            <img src={user.fotoUrl} alt={user.nome} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-inner">
                                {user.nome.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-white rounded-full ${tenhoJornadaAtiva ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Olá, {user.nome.split(' ')[0]}!
                    </h2>
                    <p className="text-text-secondary font-medium mt-1 max-w-md mx-auto">
                        {tenhoJornadaAtiva
                            ? 'Bom trabalho! Você está em rota atualmente.'
                            : 'Pronto para iniciar? Selecione seu veículo abaixo.'}
                    </p>
                </div>

                {/* BOTÃO DE AÇÃO RÁPIDA: ABASTECER */}
                <div className="mt-6 relative z-10">
                    <button
                        onClick={() => setModalAbastecimentoOpen(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 hover:text-primary transition-all font-bold text-sm"
                    >
                        <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                            </svg>
                        </div>
                        Registrar Abastecimento
                    </button>
                </div>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {!tenhoJornadaAtiva ? (
                    <div className="lg:col-span-12 xl:col-span-6 mx-auto w-full max-w-xl">
                        <div className="bg-white shadow-card rounded-2xl p-8 border border-gray-100 transition-all hover:shadow-card-hover">
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
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <h3 className="text-lg font-bold text-gray-800">
                                Sua Jornada em Andamento
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
                        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <RegistrarAbastecimento
                            usuarios={usuarios}
                            veiculos={veiculos}
                            produtos={produtos}
                            fornecedores={fornecedores}
                            usuarioLogado={user} // Passa o usuário logado
                            veiculoPreSelecionadoId={veiculoEmUsoId} // Passa o veículo da jornada
                            onClose={() => setModalAbastecimentoOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}