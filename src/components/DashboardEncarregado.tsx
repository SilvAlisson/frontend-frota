import { useState } from 'react';
import { PainelAlertas } from './PainelAlertas';
import { DashboardRelatorios } from './DashboardRelatorios';
import { RankingOperadores } from './RankingOperadores';
import { GestaoJornadas } from './GestaoJornadas';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';
import { HistoricoManutencoes } from './HistoricoManutencoes';

interface DashboardEncarregadoProps {
    token: string;
    user: any;
    veiculos: any[];
    usuarios: any[];
    produtos: any[];
    fornecedores: any[];
    jornadasAbertas: any[];
    onJornadaFinalizada: () => void;
}

const abaAtivaStyle = "inline-block p-4 text-primary border-b-2 border-primary rounded-t-lg active";
const abaInativaStyle = "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300";

type AbaEncarregado = 'alertas' | 'dashboard' | 'ranking' | 'jornadas' | 'abastecimento' | 'hist_abastecimento' | 'manutencao' | 'hist_manutencao';

export function DashboardEncarregado({
    // token, // Não usado, mantido na interface acima só para compatibilidade com Dashboard.tsx se necessário, mas aqui não usamos
    user,
    veiculos,
    usuarios,
    produtos,
    fornecedores,
    jornadasAbertas,
    onJornadaFinalizada
}: DashboardEncarregadoProps) {

    const [abaEncarregado, setAbaEncarregado] = useState<AbaEncarregado>('alertas');

    const renderAbaEncarregado = () => {
        switch (abaEncarregado) {
            case 'alertas': return <PainelAlertas />; // Removido token
            case 'dashboard': return <DashboardRelatorios veiculos={veiculos} />; // Removido token
            case 'ranking': return <RankingOperadores />; // Removido token
            case 'jornadas': return <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />; // Removido token
            case 'abastecimento': return <RegistrarAbastecimento usuarios={usuarios} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />; // Removido token
            case 'hist_abastecimento': return <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />; // Removido token
            case 'manutencao': return <FormRegistrarManutencao veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />; // Removido token
            case 'hist_manutencao': return <HistoricoManutencoes userRole={user.role} veiculos={veiculos} />; // Removido token
            default: return null;
        }
    };

    return (
        <div className="bg-surface shadow-card rounded-card min-h-[600px] flex flex-col">
            <div className="border-b border-gray-200 overflow-x-auto">
                <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center min-w-max px-2">
                    {[
                        { id: 'alertas', label: 'Alertas' },
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'ranking', label: 'Ranking' },
                        { id: 'jornadas', label: 'Gestão Jornadas' },
                        { id: 'abastecimento', label: 'Abastecimento' },
                        { id: 'hist_abastecimento', label: 'Hist. Abastecimento' },
                        { id: 'manutencao', label: 'Manutenção' },
                        { id: 'hist_manutencao', label: 'Hist. Manutenção' },
                    ].map((aba) => (
                        <li key={aba.id} className="mr-2">
                            <button
                                className={abaEncarregado === aba.id ? abaAtivaStyle : abaInativaStyle}
                                onClick={() => setAbaEncarregado(aba.id as AbaEncarregado)}
                            >
                                {aba.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-6 flex-1">
                {renderAbaEncarregado()}
            </div>
        </div>
    );
}