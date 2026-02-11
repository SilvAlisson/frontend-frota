import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { GraficoKmVeiculo } from '../components/GraficoKmVeiculo';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { GestaoDocumentos } from '../components/GestaoDocumentos';
import {
    Wrench,
    Fuel,
    Car,
    ArrowLeft,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import type { DadosEvolucaoKm } from '../types';

export function VeiculoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [veiculo, setVeiculo] = useState<any>(null);
    const [dadosKm, setDadosKm] = useState<DadosEvolucaoKm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function carregarDados() {
            setLoading(true);
            try {
                // 1. Busca os detalhes principais
                const resDetalhes = await api.get(`/veiculos/${id}/detalhes`);
                setVeiculo(resDetalhes.data);

                // 2. Busca o gráfico (falha silenciosa para não travar a tela)
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-background opacity-80">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest animate-pulse">Sincronizando Prontuário...</p>
        </div>
    );

    if (!veiculo) return null;

    // --- NORMALIZAÇÃO DOS DADOS ---
    const financeiro = veiculo.resumoFinanceiro || {};
    const odometroAtual = veiculo.ultimoKm || 0;
    const kmMes = financeiro.kmRodadoMesAtual || 0;
    const gastoOficina = financeiro.totalGastoManutencao || 0;
    const mediaConsumo = financeiro.mediaConsumoGeral || 0;

    const formatBRL = (val: number) =>
        (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6 animate-enter pb-12">

            {/* HEADER */}
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                    <div className="bg-primary text-primary-foreground p-4 rounded-2xl font-mono text-3xl font-black shadow-float flex flex-col items-center justify-center min-w-[140px]">
                        {veiculo.placa}
                        <span className="text-[10px] font-sans font-normal opacity-80 tracking-widest mt-1">BRASIL</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                            {veiculo.modelo || 'Modelo não cadastrado'}
                        </h2>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[10px] bg-background text-text-secondary border border-border px-2 py-1 rounded-lg font-bold uppercase flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                {veiculo.marca}
                            </span>
                            <span className={`text-[10px] px-2 py-1 rounded-lg font-bold border flex items-center gap-1 ${veiculo.status === 'ATIVO' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${veiculo.status === 'ATIVO' ? 'bg-success' : 'bg-error'}`} />
                                {veiculo.status}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                >
                    Voltar
                </Button>
            </div>

            {/* CARDS DE KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiSmall
                    label="Odômetro Atual"
                    value={`${odometroAtual.toLocaleString()} KM`}
                    color="text-text-main"
                />
                <KpiSmall
                    label="Rodagem (Mês)"
                    value={`${kmMes.toLocaleString()} KM`}
                    color="text-primary"
                    icon={<TrendingUp className="w-4 h-4 text-primary/50" />}
                />
                <KpiSmall
                    label="Investimento Oficina"
                    value={formatBRL(gastoOficina)}
                    color="text-warning-600"
                />
                <KpiSmall
                    label="Média Consumo"
                    value={`${Number(mediaConsumo).toFixed(2)} KM/L`}
                    color="text-success"
                />
            </div>

            {/* GRÁFICO */}
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Evolução de Uso (7 Dias)</h3>
                </div>
                {dadosKm.length > 0 ? (
                    <GraficoKmVeiculo dados={dadosKm} />
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-text-muted text-sm italic border-2 border-dashed border-border rounded-2xl bg-background/50">
                        <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                        Nenhum histórico de KM disponível para o período.
                    </div>
                )}
            </div>

            {/* TABELAS DE HISTÓRICO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Card Manutenções */}
                <div className="bg-surface rounded-3xl border border-border shadow-card overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-border flex justify-between items-center bg-background/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-warning/10 rounded-lg text-warning-600">
                                <Wrench className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-text-main text-xs uppercase tracking-widest">Últimas Manutenções</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-border overflow-y-auto max-h-[400px] custom-scrollbar">
                        {(veiculo.ordensServico || []).map((m: any) => (
                            <div key={m.id} className="p-4 flex justify-between items-center hover:bg-background transition-colors group">
                                <div>
                                    <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{m.fornecedor?.nome || 'Oficina Geral'}</p>
                                    <p className="text-[10px] text-text-muted uppercase font-medium">{new Date(m.data).toLocaleDateString()}</p>
                                </div>
                                <span className="font-mono font-bold text-sm text-error bg-error/5 px-2 py-1 rounded border border-error/10">
                                    -{formatBRL(Number(m.custoTotal))}
                                </span>
                            </div>
                        ))}
                        {(!veiculo.ordensServico?.length) && (
                            <div className="p-10 flex flex-col items-center justify-center text-text-muted text-xs italic gap-2">
                                <Wrench className="w-8 h-8 opacity-20" />
                                Nenhum registro de oficina.
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Abastecimentos */}
                <div className="bg-surface rounded-3xl border border-border shadow-card overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-border flex justify-between items-center bg-background/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                <Fuel className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-text-main text-xs uppercase tracking-widest">Últimos Abastecimentos</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-border overflow-y-auto max-h-[400px] custom-scrollbar">
                        {(veiculo.abastecimentos || []).map((a: any) => (
                            <div key={a.id} className="p-4 flex justify-between items-center hover:bg-background transition-colors group">
                                <div>
                                    <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{a.fornecedor?.nome || 'Posto'}</p>
                                    <p className="text-[10px] text-text-muted uppercase font-medium flex items-center gap-1">
                                        {new Date(a.dataHora).toLocaleDateString()}
                                        <span className="w-1 h-1 bg-border rounded-full" />
                                        {a.kmOdometro?.toLocaleString()} KM
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-md">
                                    {Number(a.quantidade).toFixed(1)} L
                                </span>
                            </div>
                        ))}
                        {(!veiculo.abastecimentos?.length) && (
                            <div className="p-10 flex flex-col items-center justify-center text-text-muted text-xs italic gap-2">
                                <Fuel className="w-8 h-8 opacity-20" />
                                Nenhum abastecimento registrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- [NOVA SEÇÃO] DOCUMENTAÇÃO --- */}
            <div className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Documentação & Prontuário Legal
                    </span>
                    <div className="h-px bg-border flex-1"></div>
                </div>

                {/* Componente de Gestão Filtrado pelo ID do Veículo */}
                <GestaoDocumentos veiculoId={id} />
            </div>

        </div>
    );
}

function KpiSmall({ label, value, color, icon }: { label: string, value: string, color: string, icon?: React.ReactNode }) {
    return (
        <div className="bg-surface p-5 rounded-3xl border border-border shadow-sm hover:shadow-float transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
                {icon}
            </div>
            <p className={`text-2xl font-black font-mono tracking-tight ${color}`}>{value}</p>
        </div>
    );
}