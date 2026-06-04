import React, { useState, Suspense, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { PageHeader } from '../components/ui/PageHeader';
import { GestaoDocumentos } from '../components/GestaoDocumentos';
import { useVeiculoDetalhes } from '../hooks/useVeiculoDetalhes';
import { Skeleton } from '../components/ui/Skeleton';
import { AbaManutencoesVeiculo } from '../components/AbaManutencoesVeiculo';
import { AbaAbastecimentosVeiculo } from '../components/AbaAbastecimentosVeiculo';

const GraficoKmVeiculo = React.lazy(() => import('../components/GraficoKmVeiculo').then(module => ({ default: module.GraficoKmVeiculo })));

import {
    Wrench,
    Fuel,
    Car,
    ArrowLeft,
    TrendingUp,
    LayoutDashboard,
    FileText
} from 'lucide-react';

export function VeiculoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // 🚚 HOOK EXTRAÍDO (SRP)
    const { veiculo, dadosKm, loading } = useVeiculoDetalhes(id);

    const queryTab = searchParams.get('tab');
    // 🚚 Novo estado de navegação por abas
    const [abaAtiva, setAbaAtiva] = useState(queryTab || 'geral');

    useEffect(() => {
        if (queryTab) {
            setAbaAtiva(queryTab);
        }
    }, [queryTab]);

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
    const kmMes = Number(financeiro.kmRodadoMesAtual) || 0;
    const gastoOficina = Number(financeiro.totalGastoManutencao) || 0;
    const mediaConsumo = Number(financeiro.mediaConsumoGeral) || 0;

    const formatBRL = (val: number) =>
        (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 🚚 Configuração das Abas (Foco Azul)
    const abasProntuario = [
        { id: 'geral', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'manutencoes', label: 'Oficina', icon: Wrench },
        { id: 'abastecimentos', label: 'Combustível', icon: Fuel },
        { id: 'documentos', label: 'Prontuário Legal', icon: FileText },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* HEADER */}
            <PageHeader
                title={
                    <div className="flex items-center gap-5 sm:gap-6">
                        <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_10px_rgba(0,0,0,0.1)] border border-border/80 bg-surface-hover/80 ${veiculo.status === 'ATIVO' ? 'shadow-[0_0_20px_rgba(var(--color-primary),0.2)] border-primary/30' : ''}`}>
                            <span className="text-data text-2xl sm:text-3xl font-black tracking-tighter text-text-main">{veiculo.placa}</span>
                            <span className="text-[9px] font-sans font-black uppercase tracking-[0.3em] opacity-60 mt-0.5">BRASIL</span>
                        </div>
                        <div className="flex flex-col mt-2">
                            <span className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-2 tracking-tight">
                                {veiculo.modelo || 'Modelo Indefinido'}
                            </span>
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
                }
                extraAction={
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        icon={<ArrowLeft className="w-4 h-4" />}
                        className="w-full md:w-auto h-11"
                    >
                        Voltar à Frota
                    </Button>
                }
            />

            {/* CARDS DE KPI - Sempre visíveis (Contexto) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <KpiSmall
                    label="Odômetro Atual"
                    value={`${Number(odometroAtual).toLocaleString('pt-BR')} KM`}
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

            {/* 🚚 NAVEGAÇÃO POR ABAS (TABS) */}
            <div className="flex justify-center md:justify-start w-full overflow-x-auto pb-4 scrollbar-thin">
                <Tabs
                    tabs={abasProntuario}
                    activeTab={abaAtiva}
                    onChange={setAbaAtiva}
                    variant="segmented"
                />
            </div>

            <div className="bg-surface/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-border/50 shadow-sm min-h-[500px]">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full">
                    
                    {abaAtiva === 'geral' && (
                        <div className="w-full">
                            <Suspense fallback={<div className="h-[400px] w-full flex items-center justify-center bg-surface/50 rounded-2xl border border-border/40"><Skeleton variant="card" className="w-full h-full" /></div>}>
                                <GraficoKmVeiculo dados={dadosKm} />
                            </Suspense>
                        </div>
                    )}

                    {abaAtiva === 'manutencoes' && (
                        <AbaManutencoesVeiculo veiculo={veiculo} />
                    )}

                    {abaAtiva === 'abastecimentos' && (
                        <AbaAbastecimentosVeiculo veiculo={veiculo} />
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
