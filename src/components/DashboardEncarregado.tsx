import { useState } from 'react';
import { Truck, Key, Droplets, Users, Bell, History, Info } from 'lucide-react';
import { PainelAlertas } from './PainelAlertas';
import { GestaoJornadas } from './GestaoJornadas';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { MinhaEquipe } from './MinhaEquipe';
import { IniciarJornada } from './IniciarJornada';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
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

type AbaEncarregado =
    | 'jornadas'         // Visão da Frota (Principal)
    | 'minha_jornada'    // Pegar a Strada
    | 'abastecimento'    // Lançar Diesel/Gasolina
    | 'hist_abastecimento' // Conferir lançamentos
    | 'equipe'           // Ver motoristas
    | 'alertas';         // Pendências

export function DashboardEncarregado({
    user,
    veiculos,
    usuarios,
    produtos,
    fornecedores,
    jornadasAbertas,
    onJornadaFinalizada
}: DashboardEncarregadoProps) {
    const [abaAtiva, setAbaAtiva] = useState<AbaEncarregado>('jornadas');

    // Filtro inteligente: Encarregado só vê veículos leves na aba "Meu Carro"
    const veiculosLeves = veiculos.filter(v => 
        ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo)
    );

    const abas = [
        { id: 'jornadas', label: 'Monitoramento', icon: Truck },
        { id: 'minha_jornada', label: 'Meu Veículo', icon: Key },
        { id: 'abastecimento', label: 'Abastecer', icon: Droplets },
        { id: 'hist_abastecimento', label: 'Histórico', icon: History },
        { id: 'equipe', label: 'Minha Equipe', icon: Users },
        { id: 'alertas', label: 'Alertas', icon: Bell },
    ];

    const renderConteudo = () => {
        switch (abaAtiva) {
            case 'jornadas': 
                return <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />;
            
            case 'minha_jornada': return (
                <div className="max-w-2xl mx-auto">
                    <Card className="mb-6 bg-primary/5 border-primary/20">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-primary text-sm">Iniciar Deslocamento Próprio</h4>
                                <p className="text-text-secondary text-xs mt-1">
                                    Utilize esta opção quando você mesmo for dirigir um veículo leve (Strada, Saveiro, etc). 
                                    Para monitorar caminhões, use a aba "Monitoramento".
                                </p>
                            </div>
                        </div>
                    </Card>
                    <IniciarJornada 
                        usuarios={usuarios} 
                        veiculos={veiculosLeves} 
                        operadorLogadoId={user.id}
                        jornadasAtivas={jornadasAbertas}
                        onJornadaIniciada={() => {
                            setAbaAtiva('jornadas');
                            onJornadaFinalizada();
                        }}
                    />
                </div>
            );

            case 'abastecimento': return (
                <div className="max-w-3xl mx-auto">
                    <FormRegistrarAbastecimento
                        usuarios={usuarios}
                        veiculos={veiculos}
                        produtos={produtos}
                        fornecedores={fornecedores}
                        onCancelar={() => setAbaAtiva('jornadas')}
                        onSuccess={() => setAbaAtiva('hist_abastecimento')}
                    />
                </div>
            );

            case 'hist_abastecimento': return <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />;
            case 'equipe': return <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />;
            case 'alertas': return <PainelAlertas />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title={`Olá, ${user.nome.split(' ')[0]}`}
                subtitle="Painel de Controle Operacional"
            />

            {/* Navegação por Abas (Design System) */}
            <div className="border-b border-border overflow-x-auto custom-scrollbar">
                <nav className="flex space-x-1 min-w-max pb-1">
                    {abas.map((aba) => {
                        const Icon = aba.icon;
                        const isActive = abaAtiva === aba.id;
                        return (
                            <button
                                key={aba.id}
                                onClick={() => setAbaAtiva(aba.id as AbaEncarregado)}
                                className={`
                                    group flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200
                                    ${isActive 
                                        ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                                        : 'border-transparent text-text-secondary hover:text-text-main hover:bg-surface-hover rounded-t-lg'
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary'}`} />
                                {aba.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Conteúdo da Aba com Animação */}
            <div className="animate-enter min-h-[400px]">
                {renderConteudo()}
            </div>
        </div>
    );
}