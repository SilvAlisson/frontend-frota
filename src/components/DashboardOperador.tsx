import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import type { User, Veiculo, Jornada } from '../types';

interface DashboardOperadorProps {
    user: User;
    usuarios: User[];
    veiculos: Veiculo[];
    jornadasAtivas: Jornada[];
    onJornadaIniciada: (jornada: Jornada) => void;
    onJornadaFinalizada: (id: string) => void;
}

export function DashboardOperador({
    user,
    usuarios,
    veiculos,
    jornadasAtivas,
    onJornadaIniciada,
    onJornadaFinalizada
}: DashboardOperadorProps) {
    return (
        <div className="space-y-8">

            {/* HEADER DE BOAS-VINDAS */}
            <div className="bg-gradient-to-r from-white to-blue-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20 ring-4 ring-white">
                    {user.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Olá, {user.nome.split(' ')[0]}!
                    </h2>
                    <p className="text-text-secondary font-medium mt-0.5">
                        {jornadasAtivas.length > 0
                            ? `Você tem ${jornadasAtivas.length} jornada(s) em andamento agora.`
                            : 'Tudo pronto para iniciar um novo turno?'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* COLUNA 1: PAINEL DE CONTROLE (STICKY) */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="bg-white shadow-card rounded-2xl p-6 border border-gray-100 sticky top-6 transition-all hover:shadow-card-hover">
                        <IniciarJornada
                            usuarios={usuarios}
                            veiculos={veiculos}
                            operadorLogadoId={user.id}
                            onJornadaIniciada={onJornadaIniciada}
                            jornadasAtivas={jornadasAtivas}
                        />
                    </div>
                </div>

                {/* COLUNA 2: LISTA DE JORNADAS */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-800">
                            Suas Jornadas Ativas
                        </h3>
                        <span className="bg-blue-50 text-primary text-xs font-bold px-2 py-1 rounded-full border border-blue-100">
                            {jornadasAtivas.length}
                        </span>
                    </div>

                    {jornadasAtivas.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 bg-white shadow-sm rounded-2xl border-2 border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-gray-50 p-4 rounded-full mb-4 ring-8 ring-gray-50/50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>
                            </div>
                            <h4 className="text-gray-900 font-medium text-lg">Nenhuma jornada ativa</h4>
                            <p className="text-gray-500 max-w-xs text-center mt-1">
                                Selecione um veículo ao lado e clique em "Iniciar Jornada" para começar.
                            </p>
                        </div>
                    )}

                    <div className="space-y-5">
                        {jornadasAtivas.map((jornada) => (
                            <JornadaCard
                                key={jornada.id}
                                jornada={jornada}
                                onJornadaFinalizada={() => onJornadaFinalizada(jornada.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}