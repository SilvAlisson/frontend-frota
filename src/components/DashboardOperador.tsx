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

    // Filtra apenas as jornadas DESTE usuário logado
    const minhasJornadas = jornadasAtivas.filter(j => j.operador.id === user.id);
    const tenhoJornadaAtiva = minhasJornadas.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

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
                        {tenhoJornadaAtiva
                            ? 'Você está em rota. Finalize sua jornada atual antes de iniciar outra.'
                            : 'Tudo pronto para iniciar um novo turno?'}
                    </p>
                </div>
            </div>

            {/* LÓGICA DE EXIBIÇÃO: OU Inicia OU Finaliza */}
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
                        <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
                            <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse"></div>
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