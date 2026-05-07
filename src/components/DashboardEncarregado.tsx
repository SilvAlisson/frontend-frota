import { useState } from 'react';
import { 
  Key, Droplets, Users, LogOut, ChevronRight, 
  Wrench, Activity, AlertTriangle, ShieldCheck, Navigation,
  BatteryCharging, Clock, CheckCircle2, QrCode
} from 'lucide-react';

// Modais & Componentes
import { PainelAlertas } from './PainelAlertas';
import { PainelDefeitosEncarregado } from './PainelDefeitosEncarregado';
import { PainelPlanosPreventivos } from './PainelPlanosPreventivos';
import { GestaoJornadas } from './GestaoJornadas';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { HistoricoManutencoes } from './HistoricoManutencoes'; //  Importado
import { MinhaEquipe } from './MinhaEquipe';
import { IniciarJornada } from './IniciarJornada';
import { ModalQrCode } from './ModalQrCode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';

// Hooks & Contexts
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import type { User } from '../types';
import { useUsuarios } from '../hooks/useUsuarios';
import { useVeiculos } from '../hooks/useVeiculos';
import { useJornadasAtivas } from '../hooks/useJornadasAtivas';
import { useDefeitos } from '../hooks/useDefeitos';
import { handleApiError } from '../services/errorHandler';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardEncarregadoProps {
    user: User;
}

//  Adicionado HISTORICO_MANUTENCOES
type ViewMode = 'DASHBOARD' | 'MONITORAMENTO' | 'MINHA_JORNADA' | 'HISTORICO' | 'HISTORICO_MANUTENCOES' | 'EQUIPE' | 'DEFEITOS' | 'PLANOS';

// ─── COMPONENTES CLEAN-CODE ─────────────────────────────────────────────

interface MiniActionCardProps {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  badge?: number | string | null;
  variant?: 'default' | 'danger' | 'warning' | 'subtle';
}

function SidebarActionButton({ icon: Icon, title, onClick, badge, variant = 'default' }: MiniActionCardProps) {
  const isDanger = variant === 'danger';
  const isSubtle = variant === 'subtle';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full group flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 border hover:-translate-y-0.5 shadow-sm hover:shadow-md",
        isDanger ? "bg-error/5 hover:bg-error/10 border-error/20 hover:border-error/40" 
        : isSubtle ? "bg-surface/30 hover:bg-surface border-transparent hover:border-border/30 opacity-70 hover:opacity-100" 
        : "bg-surface hover:bg-surface-hover/80 border-border/40 hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border shadow-inner",
          isDanger ? "bg-error/10 text-error border-error/20" 
          : "bg-primary/5 text-primary border-primary/10 group-hover:bg-primary/10"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "font-black tracking-tight text-sm",
          isDanger ? "text-error" : "text-text-main"
        )}>{title}</span>
      </div>
      
      {badge ? (
        <span className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse border",
          isDanger ? "bg-error/20 text-error border-error/30" : "bg-primary/20 text-primary border-primary/30"
        )}>
           {badge}
        </span>
      ) : (
        <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all", isDanger ? "text-error" : "text-primary")} />
      )}
    </button>
  );
}

// ─── COMPONENTE PRINCIPAL MÃE ─────────────────────────────────────────────
export function DashboardEncarregado({ user }: DashboardEncarregadoProps) {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
    // Layout State
    const [view, setView] = useState<ViewMode>('DASHBOARD');
    const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);
    const [isManutencaoOpen, setIsManutencaoOpen] = useState(false);
    const [modalQrCodeOpen, setModalQrCodeOpen] = useState(false);

    // Data Hooks
    const { data: usuarios = [] } = useUsuarios();
    const { data: veiculos = [] } = useVeiculos();
    const { data: jornadasAbertas = [], refetch: refetchJornadas } = useJornadasAtivas();
    const { contagemAtiva: defeitosAtivos } = useDefeitos();

    const veiculosLeves = veiculos.filter(v =>
        ['UTILITARIO', 'LEVE', 'OUTRO'].includes(v.tipoVeiculo || '')
    );

    const minhaJornadaAtiva = jornadasAbertas.find(j => j.operador?.id === user.id);
    const totalEquipe = usuarios.filter(u => u.role === 'OPERADOR').length;
    const equipeNaRua = jornadasAbertas.length;

    // Métricas HUD
    const frotaDisponivel = Math.max(veiculos.length - equipeNaRua, 0);
    const frotaUsoPercent = veiculos.length ? Math.round((equipeNaRua / veiculos.length) * 100) : 0;


    // --- VIEW: DASHBOARD TÁTICO BENTO-GRID ---
    if (view === 'DASHBOARD') {
        return (
            <>
                <div className="min-h-screen -mx-4 sm:-mx-8 px-4 sm:px-8 pb-28 relative overflow-hidden bg-background transition-colors duration-500 font-sans">
                    
                    {/* Background NASA Orbs */}
                    <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-10 blur-[150px] pointer-events-none bg-primary mix-blend-screen" />
                    <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full opacity-[0.05] blur-[150px] pointer-events-none bg-emerald-500 mix-blend-screen" />

                    {/* ─── NAVEGAÇÃO SUPERIOR CLEAN ─── */}
                    <header className="sticky top-0 z-40 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 backdrop-blur-xl bg-background/60 border-b border-border/40 safe-top">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Avatar url={user.fotoUrl} nome={user.nome} className="shadow-lg shadow-primary/20" />
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

                    {/* ─── BENTO GRID ARQUITETURA ─── */}
                    <main className="max-w-7xl mx-auto pt-8">
                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                           
                           {/* ZONA 1: COLUNA ESQUERDA (Atalhos de Gestão) - 3 COLS */}
                           <aside className="lg:col-span-3 flex flex-col gap-4 animate-in slide-in-from-left-4 duration-500">
                              
                              <div className="glass-premium rounded-[2rem] p-5 shadow-sm border border-border/20">
                                 <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Wrench className="w-3.5 h-3.5" /> Controle Operacional
                                 </h2>
                                 <div className="space-y-3">
                                    <SidebarActionButton 
                                      icon={Activity} title="Monitoramento" 
                                      onClick={() => setView('MONITORAMENTO')} 
                                      badge={equipeNaRua > 0 ? equipeNaRua : null} 
                                    />
                                    <SidebarActionButton 
                                      icon={AlertTriangle} title="Defeitos Reportados" 
                                      onClick={() => setView('DEFEITOS')} 
                                      variant={defeitosAtivos > 0 ? "danger" : "default"} 
                                      badge={defeitosAtivos > 0 ? `${defeitosAtivos} AVISOS` : null} 
                                    />
                                    <SidebarActionButton icon={ShieldCheck} title="Planos Preventivos" onClick={() => setView('PLANOS')} />
                                    {/*  Histórico de Manutenções no lugar correto */}
                                    <SidebarActionButton icon={Wrench} title="Histórico de Manutenções" onClick={() => setView('HISTORICO_MANUTENCOES')} />
                                 </div>
                              </div>

                              <div className="glass-premium rounded-[2rem] p-5 shadow-sm border border-border/20">
                                 <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Administração
                                 </h2>
                                 <div className="space-y-3">
                                    {/*  Histórico de Abastecimentos corrigido */}
                                    <SidebarActionButton icon={Droplets} title="Histórico de Abastecimentos" onClick={() => setView('HISTORICO')} />
                                    <SidebarActionButton icon={Users} title="Equipes Operacionais" onClick={() => setView('EQUIPE')} />
                                    <SidebarActionButton icon={Key} title="Minha Jornada" onClick={() => setView('MINHA_JORNADA')} variant={!minhaJornadaAtiva ? "subtle" : "default"} badge={minhaJornadaAtiva ? 'ESTOU EM ROTA' : null} />
                                 </div>
                              </div>

                           </aside>

                           {/* ZONA 2: CENTRO DE COMANDO (Telemetria Viva) - 6 COLS */}
                           <section className="lg:col-span-6 flex flex-col gap-6 animate-in zoom-in-95 duration-700 delay-100">
                               
                               {/* HUD Top-Bar: Stat Cards Compactos */}
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

                               {/* Mapa Tático de Operação - Trazido para a Home */}
                               <div className="flex-1 glass-premium rounded-[2.5rem] p-6 sm:p-8 border border-border/20 shadow-lg flex flex-col">
                                  <div className="flex justify-between items-center mb-6">
                                     <div>
                                        <h2 className="text-lg font-black uppercase text-text-main flex items-center gap-2">
                                          <Navigation className="w-5 h-5 text-primary" /> Jornadas em Andamento
                                        </h2>
                                        <p className="text-xs font-bold text-text-muted mt-1">Acompanhamento em tempo real dos colaboradores em operação.</p>
                                     </div>
                                     <Button variant="ghost" size="sm" onClick={() => setView('MONITORAMENTO')} className="text-[10px] uppercase tracking-widest px-4 h-8 bg-primary/10 hover:bg-primary/20 text-primary">
                                        Monitor Completo
                                     </Button>
                                  </div>

                                  <div className="flex-1 rounded-2xl bg-surface/50 border border-border/40 p-2 overflow-y-auto max-h-[350px] space-y-2">
                                     {jornadasAbertas.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-70">
                                          <CheckCircle2 className="w-12 h-12 text-success/60 mb-3" />
                                          <span className="text-sm font-bold text-text-main uppercase tracking-widest">Nenhum Veículo em Rota</span>
                                          <span className="text-xs text-text-muted mt-1">Todos os veículos encontram-se disponíveis na base neste momento.</span>
                                        </div>
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

                           {/* ZONA 3: COLUNA DIREITA (Feed de Alertas Vivos) - 3 COLS */}
                           <aside className="lg:col-span-3 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 delay-200">
                               
                               <div className="rounded-[2.5rem] bg-surface border border-border/60 overflow-hidden flex flex-col min-h-[400px] shadow-sm relative">
                                  {/* Glass Overlay Top */}
                                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-surface to-transparent z-10 pointer-events-none" />
                                  <div className="p-6 pb-2 pt-6 relative z-20">
                                     <h2 className="text-[11px] font-black uppercase text-warning-600 dark:text-warning tracking-[0.2em] flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Painel de Alertas
                                     </h2>
                                  </div>
                                  
                                  <div className="flex-1 overflow-auto p-2 scrollbar-hide">
                                    <PainelAlertas onAlertaClick={(alerta) => {
                                       //  Rotas de alerta ajustadas para o dashboard do encarregado
                                       if (alerta.mensagem.toUpperCase().includes('PREVISÃO')) {
                                           setView('PLANOS');
                                       } else if (alerta.tipo === 'MANUTENCAO') {
                                           setView('HISTORICO_MANUTENCOES');
                                       } else {
                                           setView('PLANOS');
                                       }
                                     }} />
                                  </div>
                               </div>

                           </aside>

                       </div>
                    </main>

                    {/* FAB FLUTUANTE ELITE (Mobile Somente Abastecer Rápido) */}
                    <button
                        onClick={() => setModalAbastecimentoOpen(true)}
                        className="fixed bottom-6 right-6 h-14 w-14 lg:hidden rounded-[1.25rem] flex items-center justify-center z-50 active:scale-90 transition-transform shadow-[0_15px_30px_rgba(var(--color-primary),0.5)]"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }}
                        aria-label="Atalho"
                    >
                        <Droplets className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* ─── MODAIS FLUTUANTES ─── */}
                <Modal isOpen={modalAbastecimentoOpen} onClose={() => setModalAbastecimentoOpen(false)} title="Registro de Abastecimento" className="max-w-2xl">
                    <FormRegistrarAbastecimento usuarioLogado={user} onCancelar={() => setModalAbastecimentoOpen(false)} onSuccess={() => { setModalAbastecimentoOpen(false); setView('HISTORICO'); }} />
                </Modal>

                <Modal isOpen={isManutencaoOpen} onClose={() => setIsManutencaoOpen(false)} title="Nova Ordem de Serviço Tática" className="max-w-2xl">
                    <FormRegistrarManutencao onClose={() => setIsManutencaoOpen(false)} onSuccess={() => setIsManutencaoOpen(false)} />
                </Modal>

                {modalQrCodeOpen && (
                    <ModalQrCode user={user} onClose={() => setModalQrCodeOpen(false)} />
                )}
            </>
        );
    } // FIM DA VIEW 'DASHBOARD'


    // --- ENVELOPE DAS SUB-PÁGINAS FLUIDAS ---
    const PageWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20 min-h-screen bg-background -mx-4 sm:-mx-8 px-4 sm:px-8">
            <div className="flex items-center gap-4 py-6 sticky top-0 z-40 -mx-4 px-4 sm:-mx-8 sm:px-8 backdrop-blur-xl bg-background/80 border-b border-border/40">
                <Button 
                  onClick={() => setView('DASHBOARD')} 
                  variant="ghost" size="icon"
                  className="w-11 h-11 rounded-2xl bg-surface hover:bg-surface-hover border border-border/40 hover:border-primary/30 text-text-muted hover:text-primary transition-all active:scale-95 shadow-sm"
                >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
                <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight uppercase italic drop-shadow-sm">{title}</h2>
            </div>
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );

    // --- ROTAS INTERNAS DO ENCARREGADO ---
    if (view === 'MONITORAMENTO') {
        return (
            <PageWrapper title="Painel de Monitoramento Vivo">
                <GestaoJornadas jornadasAbertas={jornadasAbertas} onJornadaFinalizadaManualmente={() => refetchJornadas().catch(err => handleApiError(err, 'Erro ao sincronizar.'))} />
            </PageWrapper>
        );
    }
    
    if (view === 'MINHA_JORNADA') {
        return (
            <PageWrapper title="Controle Pessoal de Acesso">
                <div className="max-w-2xl mx-auto p-8 rounded-[2.5rem] border border-border/20 glass-premium shadow-xl">
                    <IniciarJornada usuarios={usuarios} veiculos={veiculosLeves} operadorLogadoId={user.id} jornadasAtivas={jornadasAbertas} onJornadaIniciada={() => { setView('DASHBOARD'); refetchJornadas(); }} />
                </div>
            </PageWrapper>
        );
    }

    if (view === 'HISTORICO') {
        return <PageWrapper title="Histórico de Abastecimentos"><HistoricoAbastecimentos userRole={user.role} /></PageWrapper>;
    }

    //  Rota Histórico de Manutenções Adicionada
    if (view === 'HISTORICO_MANUTENCOES') {
        return <PageWrapper title="Histórico de Manutenções"><HistoricoManutencoes userRole={user.role} /></PageWrapper>;
    }

    if (view === 'EQUIPE') {
        return <PageWrapper title="Minha Equipe Operacional"><MinhaEquipe usuarios={usuarios} jornadasAbertas={jornadasAbertas} /></PageWrapper>;
    }

    if (view === 'DEFEITOS') {
        return <PageWrapper title="Incidências Operacionais"><PainelDefeitosEncarregado /></PageWrapper>;
    }

    if (view === 'PLANOS') {
        return <PageWrapper title="Planos de Manutenção Oficiais"><PainelPlanosPreventivos /></PageWrapper>;
    }

    return null;
}