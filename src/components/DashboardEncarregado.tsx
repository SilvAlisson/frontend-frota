import { useState } from 'react';
import { PainelAlertas } from './PainelAlertas';
import { GestaoJornadas } from './GestaoJornadas';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { MinhaEquipe } from './MinhaEquipe';
import { IniciarJornada } from './IniciarJornada';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Key, Truck, Droplets, Users, Bell, History } from 'lucide-react';
import type { User } from '../types';

interface DashboardEncarregadoProps {
    user: User;
    veiculos: any[];
    usuarios: any[];
    produtos: any[];
    fornecedores: any[];
    jornadasAbertas: any[];
    onJornadaFinalizada: () => void;
}

// Tipagem simplificada: Apenas o essencial para o dia a dia
type AbaEncarregado =
    | 'jornadas'           // Visão da Frota (Principal)
    | 'minha_jornada'      // Pegar a Strada
    | 'abastecimento'      // Lançar Diesel/Gasolina
    | 'hist_abastecimento' // Conferir lançamentos
    | 'equipe'             // Ver motoristas
    | 'alertas';           // Pendências

export function DashboardEncarregado({
    user,
    veiculos,
    usuarios,
    produtos,
    fornecedores,
    jornadasAbertas,
    onJornadaFinalizada
}: DashboardEncarregadoProps) {

    const { logout } = useAuth();
    // ✅ O padrão agora é ver a frota rodando (Gestão)
    const [abaEncarregado, setAbaEncarregado] = useState<AbaEncarregado>('jornadas');

    // Filtro inteligente: Encarregado só vê veículos leves na aba "Meu Carro"
    const veiculosLeves = veiculos.filter(v => 
        ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo)
    );

    // Menu otimizado para polegar (Mobile)
    const abas = [
        { id: 'jornadas', label: 'Em Rota', icon: <Truck className="w-5 h-5" /> },
        { id: 'minha_jornada', label: 'Meu Carro', icon: <Key className="w-5 h-5" /> },
        { id: 'abastecimento', label: 'Abastecer', icon: <Droplets className="w-5 h-5" /> },
        { id: 'hist_abastecimento', label: 'Histórico', icon: <History className="w-5 h-5" /> },
        { id: 'equipe', label: 'Equipe', icon: <Users className="w-5 h-5" /> },
        { id: 'alertas', label: 'Alertas', icon: <Bell className="w-5 h-5" /> },
    ];

    const renderConteudo = () => {
        switch (abaEncarregado) {
            case 'jornadas': 
                return <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />;
            
            case 'minha_jornada': return (
                <div className="max-w-lg mx-auto py-2">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-center">
                        <h4 className="text-blue-800 font-bold text-sm">Iniciar Deslocamento</h4>
                        <p className="text-blue-600 text-xs mt-1">Liberado apenas para utilitários e leves.</p>
                    </div>
                    <IniciarJornada 
                        usuarios={usuarios} 
                        veiculos={veiculosLeves} 
                        operadorLogadoId={user.id}
                        jornadasAtivas={jornadasAbertas}
                        onJornadaIniciada={() => {
                            setAbaEncarregado('jornadas'); // Vai para o monitoramento após iniciar
                            onJornadaFinalizada();
                        }}
                    />
                </div>
            );

            case 'abastecimento': return (
                <FormRegistrarAbastecimento
                    usuarios={usuarios}
                    veiculos={veiculos}
                    produtos={produtos}
                    fornecedores={fornecedores}
                    onCancelar={() => setAbaEncarregado('jornadas')}
                    onSuccess={() => setAbaEncarregado('hist_abastecimento')}
                />
            );

            case 'hist_abastecimento': return <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />;
            case 'equipe': return <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />;
            case 'alertas': return <PainelAlertas />;
            default: return null;
        }
    };

    return (
        <div className="space-y-4 pb-24 md:pb-0"> {/* Espaço extra no final para scroll mobile */}

            {/* HEADER COMPACTO E FIXO */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-border shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/20">
                        {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 leading-tight">Olá, {user.nome.split(' ')[0]}</h2>
                        <p className="text-xs text-gray-500 font-medium">Gestão Operacional</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Sair"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* MENU DE NAVEGAÇÃO HORIZONTAL (STICKY ABAIXO DO HEADER) */}
            <div className="bg-white shadow-sm rounded-xl p-1.5 border border-border overflow-x-auto custom-scrollbar sticky top-[76px] z-20 mx-1">
                <div className="flex space-x-1 min-w-max">
                    {abas.map((aba) => {
                        const isActive = abaEncarregado === aba.id;
                        return (
                            <button
                                key={aba.id}
                                onClick={() => setAbaEncarregado(aba.id as AbaEncarregado)}
                                className={`
                                    relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 min-w-[70px]
                                    ${isActive
                                        ? 'text-primary bg-primary/5 border border-primary/10'
                                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                                `}
                            >
                                {aba.icon}
                                <span>{aba.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-0.5 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ÁREA DE CONTEÚDO */}
            <div className="bg-white/50 min-h-[500px] animate-in fade-in duration-300">
                {renderConteudo()}
            </div>
        </div>
    );
}