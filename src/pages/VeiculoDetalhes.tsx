import React, { useState, Suspense, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { GestaoDocumentos } from '../components/GestaoDocumentos';
import { useVeiculoDetalhes } from '../hooks/useVeiculoDetalhes';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

const GraficoKmVeiculo = React.lazy(() => import('../components/GraficoKmVeiculo').then(module => ({ default: module.GraficoKmVeiculo })));
import {
    Wrench,
    Fuel,
    Car,
    ArrowLeft,
    TrendingUp,
    AlertCircle,
    LayoutDashboard,
    FileText
} from 'lucide-react';
import type { OrdemServico, Abastecimento } from '../types';

export function VeiculoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // ✨ HOOK EXTRAÍDO (SRP)
    const { veiculo, dadosKm, loading } = useVeiculoDetalhes(id);

    const queryTab = searchParams.get('tab');
    // ✨ Novo estado de navegação por abas
    const [abaAtiva, setAbaAtiva] = useState(queryTab || 'geral');

    useEffect(() => {
        if (queryTab) {
            setAbaAtiva(queryTab);
        }
    }, [queryTab]);

    const [limiteManutencoes, setLimiteManutencoes] = useState(10);
    const [limiteAbastecimentos, setLimiteAbastecimentos] = useState(10);

    if (loading) return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12 pt-6">
            <Skeleton variant="card" className="h-[140px] w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Skeleton variant="card" className="h-[120px]" />
                <Skeleton variant="card" className="h-[120px]" />
                <Skeleton variant="card" className="h-[120px]" />
                <Skeleton variant="card" className="h-[120px]" />
            </div>
            <Skeleton variant="card" className="h-[500px] w-full mt-8" />
        </div>
    );

    if (!veiculo) return null;

    const financeiro = veiculo.resumoFinanceiro || {};
    const odometroAtual = veiculo.ultimoKm || 0;
    const kmMes = financeiro.kmRodadoMesAtual || 0;
    const gastoOficina = financeiro.totalGastoManutencao || 0;
    const mediaConsumo = financeiro.mediaConsumoGeral || 0;

    const formatBRL = (val: number) =>
        (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ✨ Configuração das Abas (Foco Azul)
    const abasProntuario = [
        { id: 'geral', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'manutencoes', label: 'Oficina', icon: Wrench },
        { id: 'abastecimentos', label: 'Combustível', icon: Fuel },
        { id: 'documentos', label: 'Prontuário Legal', icon: FileText },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* HEADER */}
            <div className="glass p-6 sm:p-8 rounded-[2rem] border border-border/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5 sm:gap-6">
                    <div className={`p-5 rounded-[1.5rem] flex flex-col items-center justify-center min-w-[150px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_10px_rgba(0,0,0,0.1)] border border-border/80 bg-surface-hover/80 ${veiculo.status === 'ATIVO' ? 'shadow-[0_0_20px_rgba(var(--color-primary),0.2)] border-primary/30' : ''}`}>
                        <span className="text-data text-3xl sm:text-4xl font-black tracking-tighter text-text-main">{veiculo.placa}</span>
                        <span className="text-[9px] font-sans font-black uppercase tracking-[0.3em] opacity-60 mt-1">BRASIL</span>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-2 tracking-tight">
                            {veiculo.modelo || 'Modelo Indefinido'}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[10px] glass text-text-secondary border border-border/60 px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                <Car className="w-3.5 h-3.5 opacity-70" />
                                {veiculo.marca}
                            </span>
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest glass flex items-center gap-1.5 shadow-sm ${veiculo.status === 'ATIVO' ? 'text-success-600 border-success/20 bg-success/10' : 'text-error border-error/20 bg-error/10'}`}>
                                <div className={`w-2 h-2 rounded-full shadow-inner ${veiculo.status === 'ATIVO' ? 'bg-success animate-pulse' : 'bg-error'}`} />
                                {veiculo.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                    className="w-full md:w-auto h-11"
                >
                    Voltar à Frota
                </Button>
            </div>

            {/* CARDS DE KPI - Sempre visíveis (Contexto) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <KpiSmall
                    label="Odómetro Atual"
                    value={`${odometroAtual.toLocaleString('pt-BR')} KM`}
                    color="text-text-main"
                />
                <KpiSmall
                    label="Rodagem (Mês)"
                    value={`${kmMes.toLocaleString('pt-BR')} KM`}
                    color="text-primary"
                    icon={<TrendingUp className="w-4 h-4 text-primary/50" />}
                />
                <KpiSmall
                    label="Investimento Oficina"
                    value={formatBRL(gastoOficina)}
                    color="text-warning-600"
                />
                <KpiSmall
                    label="Eficiência Consumo"
                    value={`${Number(mediaConsumo).toFixed(2)} KM/L`}
                    color="text-success"
                />
            </div>

            {/* ✨ NAVEGAÇÃO POR ABAS (TABS) */}
            <div className="flex justify-center md:justify-start w-full overflow-x-auto pb-4 custom-scrollbar">
                <Tabs
                    tabs={abasProntuario}
                    activeTab={abaAtiva}
                    onChange={setAbaAtiva}
                    variant="segmented"
                />
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-6 sm:p-8 min-h-[400px] transition-all duration-500">

                <div key={abaAtiva} className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">

                    {abaAtiva === 'geral' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Evolução de Uso Diário (Últimos 7 Dias)
                                </h3>
                            </div>
                            {dadosKm.length > 0 ? (
                                <div className="glass rounded-3xl p-4 bg-gradient-to-b from-surface/40 to-surface-hover/20">
                                    <Suspense fallback={<div className="h-[300px] flex items-center justify-center animate-pulse text-primary font-bold">A desenhar o gráfico...</div>}>
                                        <GraficoKmVeiculo dados={dadosKm} />
                                    </Suspense>
                                </div>
                            ) : (
                                <EmptyState
                                    title="Sem Histórico Recente"
                                    description="Não há dados de telemetria registrados na última semana."
                                    icon={AlertCircle}
                                    className="my-4"
                                />
                            )}
                        </div>
                    )}

                    {abaAtiva === 'manutencoes' && (
                        <div className="flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/60">
                                <div className="p-2 bg-warning-500/10 rounded-xl text-warning-600 border border-warning-500/20 shadow-inner">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-text-main text-lg tracking-tight">Histórico de Oficina</h3>
                            </div>
                            <div className="divide-y divide-border/30 overflow-y-auto max-h-[500px] custom-scrollbar pr-2 relative">
                                <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40 -z-10" />
                                {(veiculo.ordensServico || []).slice(0, limiteManutencoes).map((m: OrdemServico, idx: number) => (
                                    <div key={m.id} className={`py-4 flex justify-between items-center transition-colors group px-4 rounded-xl ml-2 hover-lift ${idx === 0 ? 'ghost-row bg-surface-hover/30' : 'hover:bg-surface-hover/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 z-10">
                                                <div className="w-2 h-2 rounded-full bg-warning-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors tracking-tight leading-none">{m.fornecedor?.nome || 'Oficina Não Registrada'}</p>
                                                <p className="text-data">{new Date(m.data).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <span className="text-data text-error bg-error/5 px-2.5 py-1 rounded-lg border border-error/10 shadow-sm">
                                            -{formatBRL(Number(m.custoTotal))}
                                        </span>
                                    </div>
                                ))}
                                {(veiculo.ordensServico && veiculo.ordensServico.length > limiteManutencoes) && (
                                    <div className="pt-4 pb-2 flex justify-center">
                                        <Button variant="outline" onClick={() => setLimiteManutencoes(prev => prev + 10)} className="text-xs h-8">
                                            Carregar mais histórico
                                        </Button>
                                    </div>
                                )}
                                {(!veiculo.ordensServico || veiculo.ordensServico.length === 0) && (
                                    <div className="py-8">
                                        <EmptyState
                                            title="Nenhuma Oficina"
                                            description="O veículo ainda não possui histórico de manutenção corretiva ou preventiva."
                                            icon={Wrench}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {abaAtiva === 'abastecimentos' && (
                        <div className="flex flex-col h-full">
                            <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/60">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
                                    <Fuel className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-text-main text-lg tracking-tight">Registros de Combustível</h3>
                            </div>
                            <div className="divide-y divide-border/30 overflow-y-auto max-h-[500px] custom-scrollbar pr-2 relative">
                                <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40 -z-10" />
                                {(veiculo.abastecimentos || []).slice(0, limiteAbastecimentos).map((a: Abastecimento, idx: number) => (
                                    <div key={a.id} className={`py-4 flex justify-between items-center transition-colors group px-4 rounded-xl ml-2 hover-lift ${idx === 0 ? 'ghost-row bg-surface-hover/30' : 'hover:bg-surface-hover/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 z-10">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors tracking-tight leading-none">{a.fornecedor?.nome || 'Posto Local'}</p>
                                                <p className="text-data flex items-center gap-1.5 mt-0.5">
                                                    {new Date(a.dataHora).toLocaleDateString('pt-BR')}
                                                    <span className="w-1 h-1 bg-border/80 rounded-full" />
                                                    <span className="text-data">{a.kmOdometro?.toLocaleString('pt-BR')} KM</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-data text-success bg-success/10 border border-success/20 px-3 py-1 rounded-lg shadow-sm block">
                                                {Number(a.quantidade).toFixed(1)} L
                                            </span>
                                            <span className="text-[10px] font-black text-text-muted mt-1 block">
                                                {formatBRL(Number(a.custoTotal || 0))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(veiculo.abastecimentos && veiculo.abastecimentos.length > limiteAbastecimentos) && (
                                    <div className="pt-4 pb-2 flex justify-center">
                                        <Button variant="outline" onClick={() => setLimiteAbastecimentos(prev => prev + 10)} className="text-xs h-8">
                                            Carregar mais registros
                                        </Button>
                                    </div>
                                )}
                                {(!veiculo.abastecimentos || veiculo.abastecimentos.length === 0) && (
                                    <div className="py-8">
                                        <EmptyState
                                            title="Tanque Zerado"
                                            description="Não há registros operacionais de abastecimento para este veículo."
                                            icon={Fuel}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {abaAtiva === 'documentos' && (
                        <div className="w-full">
                            <GestaoDocumentos veiculoId={id} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Sub-Componente de KPI Atualizado para o Design System (Memoizado para evitar re-renders)
const KpiSmall = React.memo(function KpiSmall({ label, value, color, icon }: { label: string, value: string, color: string, icon?: React.ReactNode }) {
    return (
        <div className="glass p-5 sm:p-6 rounded-2xl hover-lift cursor-default group">
            <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</p>
                {icon && <div className="p-1.5 bg-surface-hover/50 rounded-lg group-hover:bg-primary/10 transition-colors">{icon}</div>}
            </div>
            <p className={`text-2xl sm:text-3xl font-black text-data tracking-tighter leading-none ${color}`}>{value}</p>
        </div>
    );
});


