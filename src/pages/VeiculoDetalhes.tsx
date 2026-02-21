import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { GraficoKmVeiculo } from '../components/GraficoKmVeiculo';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs'; 
import { toast } from 'sonner';
import { GestaoDocumentos } from '../components/GestaoDocumentos';
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
import type { DadosEvolucaoKm } from '../types';

export function VeiculoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [veiculo, setVeiculo] = useState<any>(null);
    const [dadosKm, setDadosKm] = useState<DadosEvolucaoKm[]>([]);
    const [loading, setLoading] = useState(true);
    
    // ✨ Novo estado de navegação por abas
    const [abaAtiva, setAbaAtiva] = useState('geral');

    useEffect(() => {
        async function carregarDados() {
            setLoading(true);
            try {
                const resDetalhes = await api.get(`/veiculos/${id}/detalhes`);
                setVeiculo(resDetalhes.data);

                try {
                    const resGrafico = await api.get(`/relatorios/evolucao-km?veiculoId=${id}&dias=7`);
                    setDadosKm(resGrafico.data || []);
                } catch (graphErr) {
                    console.warn("Falha no gráfico, carregando resto da página.");
                    setDadosKm([]);
                }

            } catch (err) {
                console.error("Erro crítico na API:", err);
                toast.error("Não foi possível carregar o prontuário.");
                navigate('/admin/veiculos');
            } finally {
                setLoading(false);
            }
        }
        if (id) carregarDados();
    }, [id, navigate]);

    if (loading) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background opacity-80 animate-in fade-in duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border/60 border-t-primary mb-4 shadow-sm"></div>
            <p className="text-text-muted font-black text-xs uppercase tracking-widest animate-pulse">Sincronizando Prontuário...</p>
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
            <div className="bg-surface p-6 sm:p-8 rounded-[2rem] border border-border/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5 sm:gap-6">
                    <div className="bg-primary text-primary-foreground p-5 rounded-[1.5rem] font-mono text-3xl sm:text-4xl font-black shadow-float flex flex-col items-center justify-center min-w-[150px]">
                        {veiculo.placa}
                        <span className="text-[9px] font-sans font-black uppercase tracking-[0.3em] opacity-80 mt-1">BRASIL</span>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-2 tracking-tight">
                            {veiculo.modelo || 'Modelo Indefinido'}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[10px] bg-background text-text-secondary border border-border/60 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                <Car className="w-3.5 h-3.5 opacity-70" />
                                {veiculo.marca}
                            </span>
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-sm ${veiculo.status === 'ATIVO' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
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
            <div className="flex justify-center md:justify-start w-full overflow-x-auto pb-2 -mb-2 custom-scrollbar">
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
                                <GraficoKmVeiculo dados={dadosKm} />
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-text-muted text-sm border-2 border-dashed border-border/60 rounded-3xl bg-surface-hover/30">
                                    <AlertCircle className="w-8 h-8 mb-3 opacity-30 text-text-muted" />
                                    <span className="font-bold tracking-widest uppercase text-xs">Sem Histórico Operacional Recente</span>
                                </div>
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
                            <div className="divide-y divide-border/60 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                                {(veiculo.ordensServico || []).map((m: any) => (
                                    <div key={m.id} className="py-4 flex justify-between items-center hover:bg-surface-hover/30 transition-colors group px-2 rounded-xl">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-base font-black text-text-main group-hover:text-primary transition-colors tracking-tight leading-none">{m.fornecedor?.nome || 'Oficina Não Registada'}</p>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{new Date(m.data).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <span className="font-mono font-black text-base text-error bg-error/5 px-2.5 py-1 rounded-lg border border-error/10 shadow-sm">
                                            -{formatBRL(Number(m.custoTotal))}
                                        </span>
                                    </div>
                                ))}
                                {(!veiculo.ordensServico?.length) && (
                                    <div className="py-16 flex flex-col items-center justify-center text-text-muted/60 text-xs italic gap-3">
                                        <Wrench className="w-10 h-10 opacity-30" />
                                        <span className="font-bold tracking-widest uppercase text-[10px]">Nenhuma O.S. Registada</span>
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
                                <h3 className="font-black text-text-main text-lg tracking-tight">Registos de Combustível</h3>
                            </div>
                            <div className="divide-y divide-border/60 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                                {(veiculo.abastecimentos || []).map((a: any) => (
                                    <div key={a.id} className="py-4 flex justify-between items-center hover:bg-surface-hover/30 transition-colors group px-2 rounded-xl">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-base font-black text-text-main group-hover:text-primary transition-colors tracking-tight leading-none">{a.fornecedor?.nome || 'Posto Local'}</p>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                {new Date(a.dataHora).toLocaleDateString('pt-BR')}
                                                <span className="w-1 h-1 bg-border/80 rounded-full" />
                                                <span className="font-mono text-text-main">{a.kmOdometro?.toLocaleString('pt-BR')} KM</span>
                                            </p>
                                        </div>
                                        <span className="text-sm font-black font-mono text-success bg-success/10 border border-success/20 px-3 py-1 rounded-lg shadow-sm">
                                            {Number(a.quantidade).toFixed(1)} L
                                        </span>
                                    </div>
                                ))}
                                {(!veiculo.abastecimentos?.length) && (
                                    <div className="py-16 flex flex-col items-center justify-center text-text-muted/60 text-xs italic gap-3">
                                        <Fuel className="w-10 h-10 opacity-30" />
                                        <span className="font-bold tracking-widest uppercase text-[10px]">Sem Abastecimentos no Período</span>
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

// Sub-Componente de KPI Atualizado para o Design System
function KpiSmall({ label, value, color, icon }: { label: string, value: string, color: string, icon?: React.ReactNode }) {
    return (
        <div className="bg-surface p-5 sm:p-6 rounded-[1.5rem] border border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{label}</p>
                {icon && <div className="p-1.5 bg-surface-hover/50 rounded-lg">{icon}</div>}
            </div>
            <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tighter leading-none ${color}`}>{value}</p>
        </div>
    );
}