import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';

interface DashboardOperadorProps {
    token: string;
    user: any;
    usuarios: any[];
    veiculos: any[];
    jornadasAtivas: any[];
    onJornadaIniciada: (jornada: any) => void;
    onJornadaFinalizada: (id: string) => void;
}

export function DashboardOperador({
    token,
    user,
    usuarios,
    veiculos,
    jornadasAtivas,
    onJornadaIniciada,
    onJornadaFinalizada
}: DashboardOperadorProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da Esquerda: Iniciar Nova */}
            <div className="bg-white shadow-card rounded-card p-6 border border-gray-100">
                <IniciarJornada
                    token={token}
                    usuarios={usuarios}
                    veiculos={veiculos}
                    operadorLogadoId={user.id}
                    onJornadaIniciada={onJornadaIniciada}
                    jornadasAtivas={jornadasAtivas}
                />
            </div>

            {/* Coluna da Direita: Jornadas Ativas */}
            <div className="space-y-6">
                {jornadasAtivas.length === 0 && (
                    <div className="bg-white shadow-sm rounded-card p-8 text-center border border-dashed border-gray-300">
                        <p className="text-text-secondary">Você não possui nenhuma jornada em aberto.</p>
                    </div>
                )}
                {jornadasAtivas.map((jornada) => (
                    <JornadaCard
                        key={jornada.id}
                        token={token}
                        jornada={jornada}
                        onJornadaFinalizada={() => onJornadaFinalizada(jornada.id)}
                    />
                ))}
            </div>
        </div>
    );
}