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

    const minhasJornadas = jornadasAtivas.filter(j => j.operador.id === user.id);
    const tenhoJornadaAtiva = minhasJornadas.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER CENTRALIZADO COM "FOTO" */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                {/* Background Decorativo Sutil */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

                {/* Avatar Grande (Foto) */}
                <div className="relative z-10 mb-4">
                    <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-lg border border-gray-100">
                        <div className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-inner">
                            {user.nome.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    {/* Indicador Online */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                </div>

                {/* Textos */}
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {!tenhoJornadaAtiva ? (
                    /* CASO 1: SEM JORNADA -> FORMULÁRIO */
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
                    /* CASO 2: COM JORNADA -> CARD FINALIZAR */
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
        </div>
    );
}