import { useState } from 'react';
import { Truck, Key, Droplets, Users, History, LogOut, ChevronRight, Plus } from 'lucide-react';
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

interface DashboardEncarregadoProps {
    user: User;
    veiculos: any[];
    usuarios: any[];
    produtos: any[];
    fornecedores: any[];
    jornadasAbertas: any[];
    onJornadaFinalizada: () => void;
}

type ViewMode = 'DASHBOARD' | 'MONITORAMENTO' | 'MINHA_JORNADA' | 'HISTORICO' | 'EQUIPE';

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
    const [view, setView] = useState<ViewMode>('DASHBOARD');
    const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);

    const veiculosLeves = veiculos.filter(v => 
        ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo)
    );

    const minhaJornadaAtiva = jornadasAbertas.find(j => j.motoristaId === user.id);
    const equipeAtiva = jornadasAbertas.filter(j => j.motoristaId !== user.id).length;

    // --- CARD "PARRUDO" (DESIGN SYSTEM) ---
    const ActionCard = ({ icon: Icon, title, desc, style, onClick, badge }: any) => (
        <button 
            onClick={onClick}
            className={`
                relative w-full text-left p-5 rounded-xl bg-surface shadow-sm hover:shadow-md active:scale-[0.99] transition-all group border border-border
                overflow-hidden flex items-start gap-4
                border-l-4 ${style.border}
            `}
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner text-white bg-gradient-to-br ${style.gradient}`}>
                <Icon className="w-7 h-7" />
            </div>
            
            <div className="flex-1 min-w-0 py-0.5">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-text-main text-lg leading-tight">{title}</h3>
                    {badge && (
                        <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse ml-2 shrink-0">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed font-medium opacity-80 line-clamp-2">
                    {desc}
                </p>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-5 h-5" />
            </div>
        </button>
    );

    // --- VIEW: DASHBOARD PRINCIPAL ---
    if (view === 'DASHBOARD') {
        return (
            <div className="space-y-6 animate-enter pb-24">
                
                {/* 1. CABEÇALHO MINIMALISTA */}
                <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            {user.nome.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text-main leading-tight">Olá, {user.nome.split(' ')[0]}</h1>
                            <p className="text-xs text-text-secondary font-medium">Gestão Operacional</p>
                        </div>
                    </div>
                    {/* Botão LogOut corrigido (sem size="sm") */}
                    <Button 
                        variant="ghost" 
                        onClick={logout} 
                        className="text-text-muted hover:text-error hover:bg-error/10 h-10 w-10 p-0 rounded-full flex items-center justify-center"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>

                {/* 2. STATUS COMPACTOS */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border flex flex-col justify-center gap-1 shadow-sm transition-colors ${minhaJornadaAtiva ? 'bg-success/10 border-success/20' : 'bg-surface border-border'}`}>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                            <Key className="w-3 h-3" /> Minha Jornada
                        </div>
                        <p className={`text-lg font-black truncate ${minhaJornadaAtiva ? 'text-success' : 'text-text-muted'}`}>
                            {minhaJornadaAtiva ? 'EM CURSO' : 'PARADO'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-center gap-1 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                            <Users className="w-3 h-3" /> Equipe Ativa
                        </div>
                        <p className="text-lg font-black text-text-main truncate">
                            {equipeAtiva} <span className="text-xs font-normal text-text-secondary">Motoristas</span>
                        </p>
                    </div>
                </div>

                {/* 3. GRID DE AÇÕES */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest pl-1">Acesso Rápido</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <ActionCard 
                            icon={Truck}
                            title="Monitoramento"
                            desc="Acompanhar frota e encerrar jornadas."
                            style={{ gradient: 'from-blue-600 to-blue-500', border: 'border-blue-500' }}
                            onClick={() => setView('MONITORAMENTO')}
                            badge={jornadasAbertas.length > 0 ? `${jornadasAbertas.length} Ativos` : null}
                        />

                        <ActionCard 
                            icon={Droplets}
                            title="Novo Abastecimento"
                            desc="Lançar Diesel, Arla ou Gasolina."
                            style={{ gradient: 'from-amber-500 to-orange-500', border: 'border-orange-500' }}
                            onClick={() => setModalAbastecimentoOpen(true)}
                        />

                        <ActionCard 
                            icon={Key}
                            title="Meu Veículo"
                            desc={minhaJornadaAtiva ? "Gerenciar sua viagem atual." : "Iniciar deslocamento próprio."}
                            style={{ gradient: 'from-emerald-600 to-emerald-500', border: 'border-emerald-500' }}
                            onClick={() => setView('MINHA_JORNADA')}
                        />

                        <ActionCard 
                            icon={Users}
                            title="Minha Equipe"
                            desc="Ver lista de motoristas e contatos."
                            style={{ gradient: 'from-purple-600 to-purple-500', border: 'border-purple-500' }}
                            onClick={() => setView('EQUIPE')}
                        />

                        <ActionCard 
                            icon={History}
                            title="Histórico"
                            desc="Consultar abastecimentos realizados."
                            style={{ gradient: 'from-slate-700 to-slate-600', border: 'border-slate-600' }}
                            onClick={() => setView('HISTORICO')}
                        />
                    </div>
                </div>

                {/* 4. ALERTAS */}
                <div className="pt-4 border-t border-dashed border-border">
                    <PainelAlertas />
                </div>

                {/* 5. FAB (Floating Action Button) - Só aparece no Mobile */}
                <button
                    onClick={() => setModalAbastecimentoOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-float flex items-center justify-center z-50 md:hidden active:scale-90 transition-transform animate-in zoom-in duration-300"
                    aria-label="Atalho Novo Abastecimento"
                >
                    <Plus className="w-8 h-8" />
                </button>

                {/* MODAL / DRAWER */}
                <Modal
                    isOpen={modalAbastecimentoOpen}
                    onClose={() => setModalAbastecimentoOpen(false)}
                    title="Novo Abastecimento"
                    className="max-w-2xl"
                >
                    <FormRegistrarAbastecimento
                        usuarios={usuarios}
                        veiculos={veiculos}
                        produtos={produtos}
                        fornecedores={fornecedores}
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

    // --- SUB-PÁGINAS ---

    const PageWrapper = ({ title, children }: any) => (
        <div className="space-y-6 animate-in slide-in-from-right-5 duration-300 pb-20">
            <div className="flex items-center gap-3 py-2 border-b border-border/50">
                {/* Botão Voltar corrigido (sem size="sm") */}
                <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="pl-0 hover:bg-transparent text-text-secondary h-9 px-2">
                    <ChevronRight className="w-5 h-5 rotate-180 mr-1" /> Voltar
                </Button>
                <h2 className="text-lg font-bold text-text-main truncate">{title}</h2>
            </div>
            {children}
        </div>
    );

    if (view === 'MONITORAMENTO') {
        return (
            <PageWrapper title="Monitoramento da Frota">
                <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={onJornadaFinalizada} />
            </PageWrapper>
        );
    }

    if (view === 'MINHA_JORNADA') {
        return (
            <PageWrapper title="Meu Deslocamento">
                <div className="max-w-2xl mx-auto">
                    <IniciarJornada 
                        usuarios={usuarios} 
                        veiculos={veiculosLeves} 
                        operadorLogadoId={user.id}
                        jornadasAtivas={jornadasAbertas}
                        onJornadaIniciada={() => {
                            setView('DASHBOARD');
                            onJornadaFinalizada();
                        }}
                    />
                </div>
            </PageWrapper>
        );
    }

    if (view === 'HISTORICO') {
        return (
            <PageWrapper title="Histórico de Abastecimentos">
                <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />
            </PageWrapper>
        );
    }

    if (view === 'EQUIPE') {
        return (
            <PageWrapper title="Minha Equipe">
                <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />
            </PageWrapper>
        );
    }

    return null;
}