import { useState } from 'react';
import { Truck, Key, Droplets, Users, History, Info, LogOut, ChevronRight } from 'lucide-react';
import { PainelAlertas } from './PainelAlertas';
import { GestaoJornadas } from './GestaoJornadas';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { MinhaEquipe } from './MinhaEquipe';
import { IniciarJornada } from './IniciarJornada';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
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

// ✅ Adicionado 'EQUIPE' aos modos de visualização
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

    // Filtro para "Meu Veículo"
    const veiculosLeves = veiculos.filter(v => 
        ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo)
    );

    // Métricas Rápidas
    const minhaJornadaAtiva = jornadasAbertas.find(j => j.motoristaId === user.id);
    const equipeAtiva = jornadasAbertas.filter(j => j.motoristaId !== user.id).length;

    // --- COMPONENTES INTERNOS ---

    const ActionCard = ({ icon: Icon, title, desc, color, onClick, badge }: any) => (
        <button 
            onClick={onClick}
            className="flex flex-col text-left p-5 rounded-2xl bg-surface border border-border shadow-sm hover:shadow-float active:scale-[0.98] transition-all group relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color.text}`}>
                <Icon className="w-16 h-16 -mr-4 -mt-4 transform rotate-12" />
            </div>
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color.bg} ${color.text}`}>
                <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-text-main text-lg">{title}</h3>
                    {badge && <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{badge}</span>}
                </div>
                <p className="text-sm text-text-secondary mt-1 leading-snug">{desc}</p>
            </div>

            <div className="mt-4 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                Acessar <ChevronRight className="w-3 h-3 ml-1" />
            </div>
        </button>
    );

    // --- VIEW: DASHBOARD PRINCIPAL (HOME) ---
    if (view === 'DASHBOARD') {
        return (
            <div className="space-y-8 animate-enter pb-20">
                <PageHeader 
                    title={`Olá, ${user.nome.split(' ')[0]}!`}
                    subtitle="Painel de Controle Operacional"
                    extraAction={
                        <Button variant="ghost" onClick={logout} className="text-error hover:bg-error/10 h-8 text-xs">
                            <LogOut className="w-3 h-3 mr-2" /> Sair
                        </Button>
                    }
                />

                {/* STATUS BARRA DE TOPO */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">Minha Jornada</p>
                            <p className={`text-lg font-black ${minhaJornadaAtiva ? 'text-success' : 'text-text-muted'}`}>
                                {minhaJornadaAtiva ? 'EM ANDAMENTO' : 'PARADO'}
                            </p>
                        </div>
                        <div className={`p-2 rounded-full ${minhaJornadaAtiva ? 'bg-success/20 text-success animate-pulse' : 'bg-surface text-text-muted'}`}>
                            <Key className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-surface border border-border p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">Equipe Ativa</p>
                            <p className="text-lg font-black text-text-main">{equipeAtiva} Motoristas</p>
                        </div>
                        <div className="p-2 rounded-full bg-surface-hover text-primary">
                            <Truck className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* GRID DE AÇÕES (MENU ESTILO IPHONE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <ActionCard 
                        icon={Truck}
                        title="Monitoramento"
                        desc="Acompanhe a frota e gerencie as jornadas ativas."
                        color={{ bg: 'bg-blue-500/10', text: 'text-blue-600' }}
                        onClick={() => setView('MONITORAMENTO')}
                        badge={jornadasAbertas.length > 0 ? `${jornadasAbertas.length} Ativas` : null}
                    />

                    <ActionCard 
                        icon={Key}
                        title="Meu Veículo"
                        desc={minhaJornadaAtiva ? "Gerenciar sua viagem atual." : "Iniciar deslocamento com carro da empresa."}
                        color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-600' }}
                        onClick={() => setView('MINHA_JORNADA')}
                    />

                    <ActionCard 
                        icon={Droplets}
                        title="Abastecer"
                        desc="Lançar abastecimento de Diesel, Gasolina ou Arla."
                        color={{ bg: 'bg-amber-500/10', text: 'text-amber-600' }}
                        onClick={() => setModalAbastecimentoOpen(true)}
                    />

                    <div className="md:col-span-2 lg:col-span-3">
                        <PainelAlertas />
                    </div>

                    <ActionCard 
                        icon={Users}
                        title="Minha Equipe"
                        desc="Lista de motoristas e contatos."
                        color={{ bg: 'bg-purple-500/10', text: 'text-purple-600' }}
                        onClick={() => setView('EQUIPE')} // ✅ AGORA FUNCIONA
                    />

                    <ActionCard 
                        icon={History}
                        title="Histórico"
                        desc="Consulte seus abastecimentos passados."
                        color={{ bg: 'bg-slate-500/10', text: 'text-slate-600' }}
                        onClick={() => setView('HISTORICO')}
                    />

                </div>

                {/* MODAL (DRAWER NO MOBILE) DE ABASTECIMENTO */}
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

    // --- SUB-PÁGINAS (VOLTAR PARA O DASHBOARD) ---

    const PageWrapper = ({ title, children }: any) => (
        <div className="space-y-6 animate-in slide-in-from-right-10">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" onClick={() => setView('DASHBOARD')}>
                    <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Voltar
                </Button>
                <h2 className="text-xl font-bold text-text-main">{title}</h2>
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
                    {!minhaJornadaAtiva && (
                        <Card className="mb-6 bg-info/5 border-info/20">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-info" />
                                <p className="text-xs text-text-secondary">
                                    Use esta área para registrar quando <b>você</b> estiver dirigindo. Para fiscalizar outros, use o Monitoramento.
                                </p>
                            </div>
                        </Card>
                    )}
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

    // ✅ VIEW NOVA PARA MINHA EQUIPE
    if (view === 'EQUIPE') {
        return (
            <PageWrapper title="Minha Equipe">
                <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />
            </PageWrapper>
        );
    }

    return null;
}