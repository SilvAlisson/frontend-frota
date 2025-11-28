import { useState } from 'react';
import { PainelAlertas } from './PainelAlertas';
import { DashboardRelatorios } from './DashboardRelatorios';
import { RankingOperadores } from './RankingOperadores';
import { GestaoJornadas } from './GestaoJornadas';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';
import { HistoricoManutencoes } from './HistoricoManutencoes';
import { MinhaEquipe } from './MinhaEquipe';

interface DashboardEncarregadoProps {
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

type AbaEncarregado = 'alertas' | 'equipe' | 'dashboard' | 'ranking' | 'jornadas' | 'abastecimento' | 'hist_abastecimento' | 'manutencao' | 'hist_manutencao';

export function DashboardEncarregado({
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
            case 'alertas': return <PainelAlertas />;
            case 'equipe': return <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />; // <--- Nova Aba
            case 'dashboard': return <DashboardRelatorios veiculos={veiculos} />;
            case 'ranking': return <RankingOperadores />;
            case 'jornadas': return <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />;
            case 'abastecimento': return <RegistrarAbastecimento usuarios={usuarios} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
            case 'hist_abastecimento': return <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />;
            case 'manutencao': return <FormRegistrarManutencao veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
            case 'hist_manutencao': return <HistoricoManutencoes userRole={user.role} veiculos={veiculos} />;
            default: return null;
        }
    };

    return (
        <div className="bg-surface shadow-card rounded-card min-h-[600px] flex flex-col">
            <div className="border-b border-gray-200 overflow-x-auto">
                <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center min-w-max px-2">
                    {[
                        { id: 'alertas', label: 'Alertas' },
                        { id: 'equipe', label: 'Minha Equipe' }, // <--- Botão visível
                        { id: 'jornadas', label: 'Gestão Jornadas' }, // Reordenado para ficar próximo
                        { id: 'abastecimento', label: 'Abastecimento' },
                        { id: 'manutencao', label: 'Manutenção' },
                        { id: 'dashboard', label: 'Relatórios' },
                        { id: 'ranking', label: 'Ranking' },
                        { id: 'hist_abastecimento', label: 'Hist. Abast.' },
                        { id: 'hist_manutencao', label: 'Hist. Manut.' },
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