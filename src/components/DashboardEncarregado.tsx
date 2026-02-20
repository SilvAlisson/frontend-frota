import { useState } from 'react';
import { Key, Droplets, Users, History, LogOut, ChevronRight, Plus, MapPin, Gauge } from 'lucide-react';
import { PainelAlertas } from './PainelAlertas';
import { GestaoJornadas } from './GestaoJornadas';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { MinhaEquipe } from './MinhaEquipe';
import { IniciarJornada } from './IniciarJornada';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal'; 
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

import { useUsuarios } from '../hooks/useUsuarios';
import { useVeiculos } from '../hooks/useVeiculos';
import { useJornadasAtivas } from '../hooks/useJornadasAtivas';

interface DashboardEncarregadoProps {
    user: User;
}

type ViewMode = 'DASHBOARD' | 'MONITORAMENTO' | 'MINHA_JORNADA' | 'HISTORICO' | 'EQUIPE';

export function DashboardEncarregado({ user }: DashboardEncarregadoProps) {
    const { logout } = useAuth();
    const [view, setView] = useState<ViewMode>('DASHBOARD');
    const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);

    // 📡 DADOS COM CACHE
    const { data: usuarios = [] } = useUsuarios();
    const { data: veiculos = [] } = useVeiculos();
    const { data: jornadasAbertas = [], refetch: refetchJornadas } = useJornadasAtivas();

    const veiculosLeves = veiculos.filter(v => 
        ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo || '')
    );

    const minhaJornadaAtiva = jornadasAbertas.find(j => j.operador?.id === user.id);
    const equipeAtiva = jornadasAbertas.filter(j => j.operador?.id !== user.id).length;

    // --- ACTION CARD (PADRÃO ELITE) ---
    const ActionCard = ({ icon: Icon, title, desc, style, onClick, badge }: any) => (
        <button 
            onClick={onClick}
            className={`
                relative w-full text-left p-6 rounded-3xl bg-surface shadow-sm hover:shadow-float active:scale-[0.98] transition-all duration-300 group border border-border/60
                overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-5
                border-l-4 ${style.border}
            `}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner text-white bg-gradient-to-br ${style.gradient} group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7" />
            </div>
            
            <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-3">
                    <h3 className="font-black text-text-main text-lg tracking-tight">{title}</h3>
                    {badge && (
                        <span className="bg-error text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm animate-pulse shrink-0">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-sm text-text-secondary mt-1 font-medium opacity-90 line-clamp-2">
                    {desc}
                </p>
            </div>

            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all bg-surface border border-border/60 p-2 rounded-full shadow-sm hidden sm:flex">
                <ChevronRight className="w-5 h-5" />
            </div>
        </button>
    );

    // --- VIEW: DASHBOARD PRINCIPAL ---
    if (view === 'DASHBOARD') {
        return (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-28">
                
                {/* 1. CABEÇALHO MOBILE-FIRST (Glassmorphism) */}
                <div className="bg-surface/90 backdrop-blur-xl border-b border-border/60 -mx-4 sm:-mx-8 px-4 sm:px-8 py-5 shadow-sm sticky top-0 z-40">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {user.fotoUrl ? (
                                  <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-primary font-black text-xl">{user.nome?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-none">Olá, {user.nome.split(' ')[0]}!</h1>
                                <p className="text-xs sm:text-sm text-text-secondary font-bold uppercase tracking-widest mt-1.5 opacity-80">Gestão Operacional</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={logout} 
                            className="text-text-muted hover:text-error hover:bg-error/10 h-12 w-12 p-0 rounded-full transition-colors"
                            aria-label="Sair"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-0 space-y-8">
                    {/* 2. KPIs COMPACTOS E VISUAIS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className={`p-6 rounded-3xl border-2 flex items-center gap-5 shadow-sm transition-all duration-300 relative overflow-hidden group ${minhaJornadaAtiva ? 'bg-success/5 border-success/30' : 'bg-surface border-border/60'}`}>
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Key className="w-32 h-32" />
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${minhaJornadaAtiva ? 'bg-success text-white' : 'bg-surface-hover border border-border/60 text-text-muted'}`}>
                                <Key className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-1">Status Pessoal</p>
                                <p className={`text-2xl font-black tracking-tight ${minhaJornadaAtiva ? 'text-success' : 'text-text-muted'}`}>
                                    {minhaJornadaAtiva ? 'EM ROTA' : 'DESCANSO'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-surface border-2 border-border/60 flex items-center gap-5 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <MapPin className="w-32 h-32" />
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-1">Equipe no Terreno</p>
                                <p className="text-3xl font-black text-text-main tracking-tight flex items-baseline gap-2">
                                    {equipeAtiva} <span className="text-sm font-bold text-text-muted uppercase">Operadores</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. GRID DE AÇÕES RÁPIDAS */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-5 bg-primary rounded-full shadow-sm"></span>
                            <h2 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Comandos Operacionais</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <ActionCard 
                                icon={Gauge}
                                title="Monitoramento da Frota"
                                desc="Supervisionar veículos em operação e forçar fecho de viagens."
                                style={{ gradient: 'from-blue-600 to-blue-500', border: 'border-blue-500' }}
                                onClick={() => setView('MONITORAMENTO')}
                                badge={jornadasAbertas.length > 0 ? `${jornadasAbertas.length} em Movimento` : null}
                            />

                            <ActionCard 
                                icon={Droplets}
                                title="Lançar Abastecimento"
                                desc="Registar entrada de combustível, aditivo ou lavagem via faturas."
                                style={{ gradient: 'from-amber-500 to-orange-500', border: 'border-orange-500' }}
                                onClick={() => setModalAbastecimentoOpen(true)}
                            />

                            <ActionCard 
                                icon={Key}
                                title="Viatura Pessoal"
                                desc={minhaJornadaAtiva ? "Aceder e encerrar a sua viagem atual." : "Iniciar o uso de um veículo utilitário da empresa."}
                                style={{ gradient: 'from-emerald-600 to-emerald-500', border: 'border-emerald-500' }}
                                onClick={() => setView('MINHA_JORNADA')}
                            />

                            <ActionCard 
                                icon={Users}
                                title="A Minha Equipa"
                                desc="Ver lista de motoristas e informações de contato rápido."
                                style={{ gradient: 'from-purple-600 to-purple-500', border: 'border-purple-500' }}
                                onClick={() => setView('EQUIPE')}
                            />

                            <ActionCard 
                                icon={History}
                                title="Histórico de Ações"
                                desc="Consultar todos os abastecimentos registados e fechados."
                                style={{ gradient: 'from-slate-700 to-slate-600', border: 'border-slate-600' }}
                                onClick={() => setView('HISTORICO')}
                            />
                        </div>
                    </div>

                    {/* 4. ALERTAS */}
                    <div className="pt-6 border-t border-dashed border-border/60">
                        <PainelAlertas />
                    </div>
                </div>

                {/* 5. FAB (Floating Action Button) - Mobile Only */}
                <button
                    onClick={() => setModalAbastecimentoOpen(true)}
                    className="fixed bottom-6 right-6 h-16 w-16 bg-primary text-white rounded-full shadow-float flex items-center justify-center z-50 md:hidden active:scale-90 transition-transform animate-in zoom-in duration-300"
                    aria-label="Atalho Novo Abastecimento"
                >
                    <Plus className="w-8 h-8" />
                </button>

                {/* MODAL DE ABASTECIMENTO */}
                <Modal
                    isOpen={modalAbastecimentoOpen}
                    onClose={() => setModalAbastecimentoOpen(false)}
                    title="Registo de Abastecimento"
                    className="max-w-2xl"
                >
                    <FormRegistrarAbastecimento
                        usuarioLogado={user}
                        onCancelar={() => setModalAbastecimentoOpen(false)}
                        onSuccess={() => {
                            setModalAbastecimentoOpen(false);
                            setView('HISTORICO');
                        }}
                    />
                </Modal>
            </div>
        );
    }

    // --- SUB-PÁGINAS (WRAPPER) ---
    const PageWrapper = ({ title, children }: any) => (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
            <div className="flex items-center gap-4 py-4 border-b border-border/60 sticky top-0 bg-surface/90 backdrop-blur-md z-40 -mx-4 px-4 sm:-mx-8 sm:px-8 shadow-sm">
                <Button variant="secondary" onClick={() => setView('DASHBOARD')} className="!p-2 w-10 h-10 rounded-full shadow-sm bg-surface hover:bg-surface-hover">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </Button>
                <h2 className="text-xl font-black text-text-main tracking-tight truncate">{title}</h2>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-0">
                {children}
            </div>
        </div>
    );

    if (view === 'MONITORAMENTO') {
        return (
            <PageWrapper title="Monitoramento da Frota">
                <GestaoJornadas 
                    jornadasAbertas={jornadasAbertas} 
                    onJornadaFinalizadaManualmente={() => refetchJornadas()} 
                />
            </PageWrapper>
        );
    }

    if (view === 'MINHA_JORNADA') {
        return (
            <PageWrapper title="Meu Deslocamento">
                <div className="max-w-2xl mx-auto bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60">
                    <IniciarJornada 
                        usuarios={usuarios} 
                        veiculos={veiculosLeves} 
                        operadorLogadoId={user.id}
                        jornadasAtivas={jornadasAbertas}
                        onJornadaIniciada={() => {
                            setView('DASHBOARD');
                            refetchJornadas();
                        }}
                    />
                </div>
            </PageWrapper>
        );
    }

    if (view === 'HISTORICO') {
        return (
            <PageWrapper title="Registos de Abastecimento">
                <HistoricoAbastecimentos userRole={user.role} />
            </PageWrapper>
        );
    }

    if (view === 'EQUIPE') {
        return (
            <PageWrapper title="A Minha Equipa">
                <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />
            </PageWrapper>
        );
    }

    return null;
}