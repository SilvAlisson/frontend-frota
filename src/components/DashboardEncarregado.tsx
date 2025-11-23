import { useState } from 'react';
import { PainelAlertas } from './PainelAlertas';
import { DashboardRelatorios } from './DashboardRelatorios';
import { RankingOperadores } from './RankingOperadores';
import { GestaoJornadas } from './GestaoJornadas';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';
import { HistoricoManutencoes } from './HistoricoManutencoes';

// Estilos de abas
const abaAtivaStyle = "inline-block p-4 text-primary border-b-2 border-primary rounded-t-lg active font-bold bg-primary/5";
const abaInativaStyle = "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors";

type AbaEncarregado = 'alertas' | 'dashboard' | 'ranking' | 'jornadas' | 'abastecimento' | 'hist_abastecimento' | 'manutencao' | 'hist_manutencao';

interface DashboardEncarregadoProps {
    token: string;
    user: any;
    veiculos: any[];
    usuarios: any[];
    produtos: any[];
    fornecedores: any[];
    jornadasAbertas: any[];
    onJornadaFinalizada: (id: string) => void;
}

export function DashboardEncarregado({
    token,
    user,
    veiculos,
    usuarios,
    produtos,
    fornecedores,
    jornadasAbertas,
    onJornadaFinalizada
}: DashboardEncarregadoProps) {

    const [abaAtiva, setAbaAtiva] = useState<AbaEncarregado>('alertas');

    const menuItems = [
        { id: 'alertas', label: '⚠️ Alertas' },
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'ranking', label: '🏆 Ranking' },
        { id: 'jornadas', label: '🚚 Jornadas Ativas' },
        { id: 'abastecimento', label: '⛽ Abastecer' },
        { id: 'hist_abastecimento', label: '📋 Hist. Abast.' },
        { id: 'manutencao', label: '🔧 Manutenção' },
        { id: 'hist_manutencao', label: '🛠️ Hist. Manut.' },
    ];

    const renderConteudo = () => {
        switch (abaAtiva) {
            case 'alertas': return <PainelAlertas token={token} />;
            case 'dashboard': return <DashboardRelatorios token={token} veiculos={veiculos} />;
            case 'ranking': return <RankingOperadores token={token} />;
            case 'jornadas': return <GestaoJornadas token={token} jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />;
            case 'abastecimento': return <RegistrarAbastecimento token={token} usuarios={usuarios} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
            case 'hist_abastecimento': return <HistoricoAbastecimentos token={token} userRole={user.role} veiculos={veiculos} />;
            case 'manutencao': return <FormRegistrarManutencao token={token} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
            case 'hist_manutencao': return <HistoricoManutencoes token={token} userRole={user.role} veiculos={veiculos} />;
            default: return null;
        }
    };

    return (
        <div className="bg-white shadow-card rounded-card min-h-[600px] flex flex-col border border-gray-100">
            <div className="border-b border-gray-200 overflow-x-auto custom-scrollbar">
                <ul className="flex flex-nowrap text-sm font-medium text-center min-w-max px-2">
                    {menuItems.map((item) => (
                        <li key={item.id} className="mr-1">
                            <button
                                className={abaAtiva === item.id ? abaAtivaStyle : abaInativaStyle}
                                onClick={() => setAbaAtiva(item.id as AbaEncarregado)}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-6 flex-1 bg-gray-50/30">
                {renderConteudo()}
            </div>
        </div>
    );
}