import { useState, useMemo, useCallback } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Key, Droplets, Users, LogOut,
  Wrench, Activity, AlertTriangle, ShieldCheck, Navigation,
  BatteryCharging, Clock, QrCode, Truck
} from 'lucide-react';

import { PainelAlertas } from './PainelAlertas';
import { Skeleton } from './ui/Skeleton';
import { PainelDefeitosEncarregado } from './PainelDefeitosEncarregado';
import { PainelPlanosPreventivos } from './PainelPlanosPreventivos';
import { GestaoJornadas } from './GestaoJornadas';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { HistoricoManutencoes } from './HistoricoManutencoes';
import { MinhaEquipe } from './MinhaEquipe';
import { IniciarJornada } from './IniciarJornada';
import { ModalQrCode } from './ModalQrCode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { PullToRefresh } from './ui/PullToRefresh';
import { SmartFAB } from './ui/SmartFAB';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';
import { SidebarActionButton } from './ui/SidebarActionButton';
import { PageWrapper } from './ui/PageWrapper';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon } from 'lucide-react';
import type { User } from '../types';
import { useUsuarios } from '../hooks/useUsuarios';
import { useVeiculos } from '../hooks/useVeiculos';
import { useJornadasAtivas } from '../hooks/useJornadasAtivas';
import { useDefeitos } from '../hooks/useDefeitos';
import { handleApiError } from '../utils/errorHandler';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardEncarregadoProps {
    user: User;
}

// ─── HOME TÁTICA (HUD) ───
function EncarregadoHome({ user }: DashboardEncarregadoProps) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
    const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);
    const [isManutencaoOpen, setIsManutencaoOpen] = useState(false);
    const [modalQrCodeOpen, setModalQrCodeOpen] = useState(false);

    const { usuarios = [], isLoading: isLoadingUsuarios, isError: isErrorUsuarios } = useUsuarios();
    const { data: veiculos = [], isLoading: isLoadingVeiculos, isError: isErrorVeiculos } = useVeiculos();
    const { data: jornadasAbertas = [], refetch: refetchJornadas, isLoading: isLoadingJornadas, isError: isErrorJornadas } = useJornadasAtivas();
    const { contagemAtiva: defeitosAtivos, refetch: refetchDefeitos, isLoading: isLoadingDefeitos, isError: isErrorDefeitos } = useDefeitos();

    const handleRefresh = async () => {
        refetchJornadas();
        if (refetchDefeitos) refetchDefeitos();
    };

    // 🦴 Skeleton: renderiza grade de placeholders durante o carregamento inicial (sem dados no cache ainda)
    const isLoadingInicial = (isLoadingJornadas && jornadasAbertas.length === 0) ||
        (isLoadingVeiculos && veiculos.length === 0) ||
        (isLoadingUsuarios && usuarios.length === 0) ||
        (isLoadingDefeitos && defeitosAtivos === 0);

    if (isErrorJornadas || isErrorDefeitos || isErrorUsuarios || isErrorVeiculos) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in">
                <Callout variant="danger" title="Falha de Sincronização" className="max-w-md text-center">
                    Não foi possível carregar os dados operacionais. Verifique sua conexão.
                    <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-xs font-black uppercase tracking-widest text-error hover:text-error hover:bg-error/10 mt-4">
                        Tentar Novamente
                    </Button>
                </Callout>
            </div>
        );
    }

    if (isLoadingInicial) {
        return (
            <div className="min-h-screen -mx-4 sm:-mx-8 px-4 sm:px-8 pb-28 pt-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <Skeleton variant="card" className="h-[220px]" />
                            <Skeleton variant="card" className="h-[180px]" />
                        </div>
                        <div className="lg:col-span-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton variant="card" className="h-[100px]" />
                                <Skeleton variant="card" className="h-[100px]" />
                            </div>
                            <Skeleton variant="card" className="flex-1 min-h-[350px]" />
                        </div>
                        <div className="lg:col-span-3">
                            <Skeleton variant="card" className="h-[400px]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const veiculosAtivos = useMemo(() => veiculos.filter(v => v.status !== 'INATIVO'), [veiculos]);
    const usuariosAtivos = useMemo(() => usuarios.filter(u => !u.nome.startsWith('[INATIVO]')), [usuarios]);
    const equipeNaRua = jornadasAbertas.length;
    const minhaJornadaAtiva = useMemo(() => jornadasAbertas.find(j => j.operador?.id === user.id), [jornadasAbertas, user.id]);
    const totalEquipe = useMemo(() => usuariosAtivos.filter(u => u.role === 'OPERADOR').length, [usuariosAtivos]);
    const frotaDisponivel = Math.max(veiculosAtivos.length - equipeNaRua, 0);
    const frotaUsoPercent = veiculosAtivos.length ? Math.round((equipeNaRua / veiculosAtivos.length) * 100) : 0;

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="min-h-screen -mx-4 sm:-mx-8 px-4 sm:px-8 pb-28 relative overflow-x-clip bg-background transition-colors duration-500 font-sans">
                {/* Background NASA Orbs */}
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-10 blur-[150px] pointer-events-none bg-primary mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full opacity-[0.05] blur-[150px] pointer-events-none bg-emerald-500 mix-blend-screen" />

                <header className="sticky top-0 z-40 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 backdrop-blur-xl bg-background/80 border-b border-border/40 safe-top">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link to="/minha-conta" className="shrink-0 hover:scale-105 active:scale-95 transition-transform block rounded-full" title="Acessar Minha Conta e Biometria">
                                <Avatar url={user.fotoUrl} nome={user.nome} className="shadow-lg shadow-primary/20 cursor-pointer border-2 border-primary/20 hover:border-primary/60" />
                            </Link>
                            <div className="leading-tight">
                                <h1 className="text-base sm:text-lg font-black text-text-main tracking-tight uppercase">Olá, <span className="text-primary">{user.nome.split(' ')[0]}</span></h1>
                                <p className="text-[9px] font-bold text-success uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setModalQrCodeOpen(true)} variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-surface/50 border border-border/40 hover:bg-surface text-primary shadow-sm" title="Meu QR Code">
                                <QrCode className="w-4 h-4" />
                            </Button>
                            <Button onClick={toggleTheme} variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-surface/50 border border-border/40 hover:bg-surface text-text-muted">
                                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            </Button>
                            <Button onClick={logout} variant="danger" size="icon" className="w-10 h-10 rounded-xl bg-error/5 border border-error/10 hover:bg-error/20 hover:rotate-12 transition-transform !shadow-none" title="Sair">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto pt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        <aside className="lg:col-span-3 flex flex-col gap-4 animate-in slide-in-from-left-4 duration-500">
                            <div className="glass-premium rounded-[2rem] p-5 shadow-sm border border-border/20">
                                <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Wrench className="w-3.5 h-3.5" /> Controle Operacional
                                </h2>
                                <div className="space-y-3">
                                    <SidebarActionButton icon={Activity} title="Monitoramento" onClick={() => navigate('/encarregado/monitoramento')} badge={equipeNaRua > 0 ? equipeNaRua : null} />
                                    <SidebarActionButton icon={AlertTriangle} title="Defeitos Reportados" onClick={() => navigate('/encarregado/defeitos')} variant={defeitosAtivos > 0 ? "danger" : "default"} badge={defeitosAtivos > 0 ? `${defeitosAtivos} AVISOS` : null} />
                                    <SidebarActionButton icon={ShieldCheck} title="Planos Preventivos" onClick={() => navigate('/encarregado/planos')} />
                                    <SidebarActionButton icon={Wrench} title="Histórico de Manutenções" onClick={() => navigate('/encarregado/historico-manutencoes')} />
                                </div>
                            </div>
                            <div className="glass-premium rounded-[2rem] p-5 shadow-sm border border-border/20">
                                <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Administração
                                </h2>
                                <div className="space-y-3">
                                    <SidebarActionButton icon={Droplets} title="Histórico de Abastecimentos" onClick={() => navigate('/encarregado/historico')} />
                                    <SidebarActionButton icon={Users} title="Equipes Operacionais" onClick={() => navigate('/encarregado/equipe')} />
                                    <SidebarActionButton icon={Key} title="Minha Jornada" onClick={() => navigate('/encarregado/minha-jornada')} variant={!minhaJornadaAtiva ? "subtle" : "default"} badge={minhaJornadaAtiva ? 'ESTOU EM ROTA' : null} />
                                </div>
                            </div>
                        </aside>

                        <section className="lg:col-span-6 flex flex-col gap-6 animate-in zoom-in-95 duration-700 delay-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-[2rem] glass-premium border border-border/20 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Navigation className="w-16 h-16 text-primary" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Veículos em Rota</span>
                                    <h3 className="text-3xl font-black text-text-main font-mono">{equipeNaRua} {totalEquipe > 0 && <span className="text-sm font-bold text-text-muted font-sans uppercase">/ {totalEquipe} na base</span>}</h3>
                                </div>
                                <div className="p-5 rounded-[2rem] glass-premium border border-border/20 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BatteryCharging className="w-16 h-16 text-emerald-500" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Veículos Disponíveis</span>
                                    <h3 className="text-3xl font-black text-text-main font-mono">{frotaDisponivel} <span className="text-sm font-bold text-text-muted font-sans uppercase">Na Base</span></h3>
                                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/80 transition-all duration-1000" style={{ width: `${100 - frotaUsoPercent}%` }} />
                                </div>
                            </div>

                            <div className="flex-1 glass-premium rounded-[2.5rem] p-6 sm:p-8 border border-border/20 shadow-lg flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-lg font-black uppercase text-text-main flex items-center gap-2">
                                          <Navigation className="w-5 h-5 text-primary" /> Jornadas em Andamento
                                        </h2>
                                        <p className="text-xs font-bold text-text-muted mt-1">Acompanhamento em tempo real dos integrantes em operação.</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate('/encarregado/monitoramento')} className="text-[10px] uppercase tracking-widest px-4 h-8 bg-primary/10 hover:bg-primary/20 text-primary">
                                        Monitor Completo
                                    </Button>
                                </div>

                                <div className="flex-1 rounded-2xl bg-surface/50 border border-border/40 p-2 overflow-y-auto max-h-[350px] space-y-2 scrollbar-thin">
                                    {jornadasAbertas.length === 0 ? (
                                        <EmptyState icon={Truck} title="Nenhum Veículo em Rota" description="Todos os veículos encontram-se disponíveis na base neste momento." />
                                    ) : (
                                        jornadasAbertas.map(jornada => (
                                          <div key={jornada.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border/40 rounded-xl hover:border-primary/30 transition-all gap-4">
                                             <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black font-mono shadow-inner border border-primary/20 shrink-0">
                                                    C {jornada.veiculo?.placa?.substring(jornada.veiculo.placa.length - 2)}
                                                </div>
                                                <div>
                                                   <h4 className="text-sm font-black text-text-main tracking-tight uppercase">{jornada.operador?.nome}</h4>
                                                   <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-2 py-0.5 rounded-md border border-border/50 uppercase inline-flex items-center gap-1 mt-1">
                                                      <Clock className="w-3 h-3 text-warning" /> {formatDistanceToNow(new Date(jornada.dataInicio), { addSuffix: true, locale: ptBR })}
                                                   </span>
                                                </div>
                                             </div>
                                          </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <aside className="lg:col-span-3 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 delay-200">
                            <div className="rounded-[2.5rem] bg-surface border border-border/60 overflow-hidden flex flex-col min-h-[400px] shadow-sm relative">
                                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-surface to-transparent z-10 pointer-events-none" />
                                <div className="p-6 pb-2 pt-6 relative z-20">
                                    <h2 className="text-[11px] font-black uppercase text-warning-600 dark:text-warning tracking-[0.2em] flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Painel de Alertas
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-auto p-2 scrollbar-hide">
                                    <PainelAlertas onAlertaClick={useCallback((alerta) => {
                                        if (alerta.mensagem.toUpperCase().includes('PREVISÃO') || alerta.nivel === 'VENCIDO') {
                                            navigate('/encarregado/planos');
                                        } else if (alerta.tipo === 'MANUTENCAO') {
                                            navigate('/encarregado/historico-manutencoes');
                                        } else {
                                            navigate('/encarregado/planos');
                                        }
                                    // eslint-disable-next-line react-hooks/exhaustive-deps
                                    }, [navigate])} />
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>

                <SmartFAB onClick={() => setModalAbastecimentoOpen(true)} label="Abastecimento" icon={Droplets} />
            </div>

            <Modal isOpen={modalAbastecimentoOpen} onClose={() => setModalAbastecimentoOpen(false)} title="Registro de Abastecimento" className="max-w-2xl">
                <FormRegistrarAbastecimento usuarioLogado={user} onCancelar={() => setModalAbastecimentoOpen(false)} onSuccess={() => { setModalAbastecimentoOpen(false); navigate('/encarregado/historico'); }} />
            </Modal>
            <Modal isOpen={isManutencaoOpen} onClose={() => setIsManutencaoOpen(false)} title="Nova Ordem de Serviço Tática" className="max-w-2xl">
                <FormRegistrarManutencao onClose={() => setIsManutencaoOpen(false)} onSuccess={() => setIsManutencaoOpen(false)} />
            </Modal>
            {modalQrCodeOpen && <ModalQrCode user={user as User & { loginToken?: string }} onClose={() => setModalQrCodeOpen(false)} />}
        </PullToRefresh>
    );
}

// ─── WRAPPERS DE SUB-ROTAS ───
function MonitoramentoWrapper() {
    const navigate = useNavigate();
    const { data: jornadasAbertas = [], isLoading, isError, refetch } = useJornadasAtivas();
    return (
        <PageWrapper title="Painel de Monitoramento Vivo" onBack={() => navigate('/encarregado')}>
            <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={() => refetch().catch(err => handleApiError(err, 'Erro ao sincronizar.'))} isLoading={isError ? false : isLoading} />
        </PageWrapper>
    );
}

function MinhaJornadaWrapper({ user }: { user: User }) {
    const navigate = useNavigate();
    const { usuarios = [] } = useUsuarios();
    const { data: veiculos = [] } = useVeiculos();
    const { data: jornadasAbertas = [], refetch } = useJornadasAtivas();
    const veiculosLeves = veiculos.filter(v => v.status !== 'INATIVO' && ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo || ''));
    return (
        <PageWrapper title="Controle Pessoal de Acesso" onBack={() => navigate('/encarregado')}>
            <div className="max-w-2xl mx-auto p-8 rounded-[2.5rem] border border-border/20 glass-premium shadow-xl">
                <IniciarJornada usuarios={usuarios} veiculos={veiculosLeves} operadorLogadoId={user.id} jornadasAtivas={jornadasAbertas} onJornadaIniciada={() => { navigate('/encarregado'); refetch(); }} />
            </div>
        </PageWrapper>
    );
}

function EquipeWrapper() {
    const navigate = useNavigate();
    const { usuarios = [] } = useUsuarios();
    const { data: jornadasAbertas = [] } = useJornadasAtivas();
    return (
        <PageWrapper title="Minha Equipe Operacional" onBack={() => navigate('/encarregado')}>
            <MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} />
        </PageWrapper>
    );
}

// ─── COMPONENTE PRINCIPAL (ROUTER INTERNO) ───
export function DashboardEncarregado({ user }: DashboardEncarregadoProps) {
    const navigate = useNavigate();
    return (
        <Routes>
            <Route path="/" element={<EncarregadoHome user={user} />} />
            <Route path="/monitoramento" element={<MonitoramentoWrapper />} />
            <Route path="/minha-jornada" element={<MinhaJornadaWrapper user={user} />} />
            <Route path="/historico" element={<PageWrapper title="Histórico de Abastecimentos" onBack={() => navigate('/encarregado')}><HistoricoAbastecimentos userRole={user.role} /></PageWrapper>} />
            <Route path="/historico-manutencoes" element={<PageWrapper title="Histórico de Manutenções" onBack={() => navigate('/encarregado')}><HistoricoManutencoes userRole={user.role} /></PageWrapper>} />
            <Route path="/equipe" element={<EquipeWrapper />} />
            <Route path="/defeitos" element={<PageWrapper title="Incidências Operacionais" onBack={() => navigate('/encarregado')}><PainelDefeitosEncarregado /></PageWrapper>} />
            <Route path="/planos" element={<PageWrapper title="Planos de Manutenção Oficiais" onBack={() => navigate('/encarregado')}><PainelPlanosPreventivos /></PageWrapper>} />
        </Routes>
    );
}
