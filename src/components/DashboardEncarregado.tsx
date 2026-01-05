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
import { HistoricoJornadas } from './HistoricoJornadas';
// 1. Novos imports necessários
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
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
    | 'alertas' | 'equipe' | 'dashboard' | 'ranking'
    | 'jornadas' | 'hist_jornada'
    | 'abastecimento' | 'hist_abastecimento'
    | 'manutencao' | 'hist_manutencao';

export function DashboardEncarregado({
    user,
    veiculos,
    usuarios,
    produtos,
    fornecedores,
    jornadasAbertas,
    onJornadaFinalizada
}: DashboardEncarregadoProps) {

    // 2. Hook de logout
    const { logout } = useAuth();
    const [abaEncarregado, setAbaEncarregado] = useState<AbaEncarregado>('alertas');

    const handleDrillDown = (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => {
        const mapa: Record<string, AbaEncarregado> = {
            'ABASTECIMENTO': 'hist_abastecimento',
            'MANUTENCAO': 'hist_manutencao',
            'JORNADA': 'hist_jornada',
            'GERAL': 'dashboard'
        };
        setAbaEncarregado(mapa[tipo]);
    };

    const abas = [
        { id: 'alertas', label: 'Alertas', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg> },
        { id: 'equipe', label: 'Minha Equipe', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg> },
        { id: 'dashboard', label: 'Relatórios', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
        { id: 'ranking', label: 'Ranking', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 0-1.125-1.125h-2.75a1.125 1.125 0 0 0-1.125 1.125v8.625" /></svg> },
        { id: 'jornadas', label: 'Gestão Jornadas', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
        { id: 'abastecimento', label: 'Novo Abastec.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg> },
        { id: 'manutencao', label: 'Nova OS', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" /></svg> },
        { id: 'hist_jornada', label: 'Hist. Jornadas', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
        { id: 'hist_abastecimento', label: 'Hist. Abastec.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg> },
        { id: 'hist_manutencao', label: 'Hist. Manut.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> },
    ];

    const renderAbaEncarregado = () => {
        switch (abaEncarregado) {
            case 'alertas': return <PainelAlertas />;
            case 'equipe': return <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />;
            case 'dashboard': return <DashboardRelatorios veiculos={veiculos} onDrillDown={handleDrillDown} />;
            case 'ranking': return <RankingOperadores />;
            case 'jornadas': return <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />;
            // 3. Importante: Passando userRole para permitir funcionalidades extras (se existirem)
            case 'hist_jornada': return <HistoricoJornadas veiculos={veiculos} userRole={user.role} />;
            case 'abastecimento': return (
                <RegistrarAbastecimento
                    usuarios={usuarios}
                    veiculos={veiculos}
                    produtos={produtos}
                    fornecedores={fornecedores}
                    onClose={() => setAbaEncarregado('hist_abastecimento')}
                />
            );
            case 'hist_abastecimento': return <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />;
            case 'manutencao': return (
                <FormRegistrarManutencao
                    veiculos={veiculos}
                    produtos={produtos}
                    fornecedores={fornecedores}
                    onSuccess={() => setAbaEncarregado('hist_manutencao')}
                />
            );
            case 'hist_manutencao': return <HistoricoManutencoes userRole={user.role} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">

            {/* 4. NOVO HEADER DO ENCARREGADO (COM LOGOUT) */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl ring-2 ring-primary/20">
                        {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Painel do Encarregado</h2>
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online como {user.nome}
                        </p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-xl transition-all font-bold group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Sair
                </button>
            </div>

            {/* BARRA DE NAVEGAÇÃO (ABAS) */}
            <div className="bg-white shadow-sm rounded-2xl p-2 border border-border overflow-x-auto custom-scrollbar">
                <div className="flex space-x-1 min-w-max">
                    {abas.map((aba) => {
                        const isActive = abaEncarregado === aba.id;
                        return (
                            <button
                                key={aba.id}
                                onClick={() => setAbaEncarregado(aba.id as AbaEncarregado)}
                                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out
                  ${isActive
                                        ? 'text-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                        : 'text-gray-500 hover:bg-background hover:text-gray-800'}
                `}
                            >
                                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                                    {aba.icon}
                                </span>
                                {aba.label}
                                {isActive && (
                                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="bg-white shadow-card rounded-2xl p-6 border border-border min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                {renderAbaEncarregado()}
            </div>
        </div>
    );
}