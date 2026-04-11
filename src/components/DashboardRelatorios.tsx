import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import React, { Suspense } from 'react';
import { cn } from '../lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- PRIMITIVOS & REGISTRIES ---
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { NumberTicker } from './ui/NumberTicker';
import { Skeleton } from './ui/Skeleton';

import {
  Fuel, Wrench, Gauge, DollarSign, Activity,
  Droplets, TrendingUp, FileSpreadsheet, ChevronRight,
  BarChart2, LineChart
} from 'lucide-react';
import type { KpiData, DadosEvolucaoKm, Veiculo } from '../types';

const GraficoKmVeiculo = React.lazy(() => import('./GraficoKmVeiculo').then(module => ({ default: module.GraficoKmVeiculo })));

// ─── TIPOS DOS ENDPOINTS ÓRFÃOS ─────────────────────────────────────────────

interface DadoCpk {
  name: string;
  fuel: number;
  maintenance: number;
  custoCombustivelAbsoluto: number;
  custoManutencaoAbsoluto: number;
  kmRodado: number;
}

interface DadoPerformance {
  id: string;
  name: string;
  cost: number;
  kmRodado: number;
  color: string;
}

// ─── TOOLTIP COMPARTILHADO ────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '1rem',
  color: 'var(--color-text-main)',
  fontSize: '12px',
  fontWeight: 700,
  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  padding: '10px 16px',
};

interface DashboardRelatoriosProps {
  onDrillDown?: (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => void;
}

// ✨ Formatadores MOVIDOS PARA FORA para evitar re-criação a cada render
const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNum = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const formatDec = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// PROPS ATUALIZADAS PARA SUPORTAR O TICKER
interface KpiCardProps {
  titulo: string;
  valorRaw?: number;
  formatter: (val: number) => string;
  descricao: string;
  onClick?: () => void;
  loading?: boolean;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

const KpiCard = React.memo(function KpiCard({ titulo, valorRaw, formatter, descricao, onClick, loading, highlight, variant = 'default', icon }: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn("flex flex-col justify-between overflow-hidden border-border/40 glass rounded-2xl", highlight ? "min-h-[160px]" : "min-h-[150px]")}>
        <div className="flex justify-between items-start w-full p-4 relative z-10">
          <Skeleton variant="text" className="w-24 mt-2" />
          <Skeleton variant="default" className="h-10 w-10 rounded-xl" />
        </div>
        <div className="space-y-3 mt-auto p-4 relative z-10">
          <Skeleton variant="title" className="w-3/4 h-8" />
          <Skeleton variant="text" className="w-full h-3" />
        </div>
      </Card>
    );
  }

  const styles = {
    default: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconText: 'text-primary', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(var(--color-primary),0.3)]' },
    success: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' },
    warning: { border: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconText: 'text-amber-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]' },
    danger: { border: 'border-l-rose-500', iconBg: 'bg-rose-500/10', iconText: 'text-rose-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]' },
    info: { border: 'border-l-sky-500', iconBg: 'bg-sky-500/10', iconText: 'text-sky-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.3)]' }
  };

  const style = styles[variant] || styles.default;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between h-full cursor-pointer overflow-hidden group glass hover-lift rounded-2xl",
        "border-l-[4px]", style.border, style.glow,
        highlight ? "min-h-[160px]" : "min-h-[150px]"
      )}
    >
      <div className="flex justify-between items-start shrink-0 mb-2 relative z-10 p-2">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mt-1.5 leading-snug">
          {titulo}
        </h4>
        {icon && (
          <div className={cn("p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm shrink-0 ml-2", style.iconBg, style.iconText)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end flex-1 min-h-0 relative z-10 p-2">
        <span
          className={cn(
            "text-data font-black text-text-main leading-none truncate transition-colors duration-300",
            highlight ? "!text-4xl sm:!text-5xl" : "!text-2xl sm:!text-3xl"
          )}
          title={formatter(valorRaw || 0)}
        >
          {/* ✨ A MÁGICA ACONTECE AQUI */}
          <NumberTicker value={valorRaw || 0} formatter={formatter} duration={1.5} />
        </span>

        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
          <p className="text-xs font-bold uppercase text-text-muted truncate max-w-[90%] group-hover:text-text-main transition-colors tracking-wider">
            {descricao}
          </p>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          )}
        </div>
      </div>

      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-current opacity-[0.02] rounded-full blur-2xl group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
    </Card>
  );
});

// ─── TOOLTIP CPK CUSTOMIZADO ──────────────────────────────────────────────────

const CpkTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={TOOLTIP_STYLE}>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="font-bold" style={{ color: p.color }}>{p.name}:</span>
            <span className="font-black">{formatBRL(p.value)}/km</span>
          </div>
        ))}
        {payload[0]?.payload?.kmRodado > 0 && (
          <p className="text-xs text-text-muted mt-2 pt-2 border-t border-border/40">
            {formatNum(payload[0].payload.kmRodado)} km rodados
          </p>
        )}
      </div>
    );
  }
  return null;
};

// ─── TOOLTIP PERFORMANCE CUSTOMIZADO ─────────────────────────────────────────

const PerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    return (
      <div style={TOOLTIP_STYLE}>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{label}</p>
        <p className="text-lg font-black" style={{ color: d?.color }}>{formatBRL(d?.cost || 0)}</p>
        {d?.kmRodado > 0 && (
          <p className="text-xs text-text-muted mt-1">{formatNum(d.kmRodado)} km rodados</p>
        )}
      </div>
    );
  }
  return null;
};

// ─── GRÁFICO CPK ──────────────────────────────────────────────────────────────

function GraficoCpk({ dados, loading }: { dados: DadoCpk[]; loading: boolean }) {
  if (loading) return <Skeleton variant="card" className="h-[280px] w-full" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradFuel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradMaint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
        <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} width={42} />
        <Tooltip content={<CpkTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} iconType="circle" iconSize={8} />
        <Area type="monotone" dataKey="fuel" name="CPK Combustível" stroke="#38bdf8" strokeWidth={2.5} fill="url(#gradFuel)" dot={{ fill: '#38bdf8', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#38bdf8', strokeWidth: 0 }} animationDuration={800} />
        <Area type="monotone" dataKey="maintenance" name="CPK Manutenção" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradMaint)" dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── GRÁFICO PERFORMANCE ──────────────────────────────────────────────────────

function GraficoPerformance({ dados, loading }: { dados: DadoPerformance[]; loading: boolean }) {
  if (loading) return <Skeleton variant="card" className="h-[280px] w-full" />;
  if (dados.length === 0) return (
    <div className="h-[280px] flex flex-col items-center justify-center text-text-muted gap-2">
      <BarChart2 className="w-10 h-10 opacity-30" />
      <p className="text-xs font-bold uppercase tracking-widest">Sem dados de custo neste período</p>
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} barSize={20}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}
          axisLine={false} tickLine={false} angle={-20} textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} width={42} />
        <Tooltip content={<PerformanceTooltip />} cursor={{ fill: 'var(--color-surface-hover)', radius: 8 }} />
        <Bar dataKey="cost" name="Custo Total" radius={[6, 6, 0, 0]} animationDuration={900} animationEasing="ease-out">
          {dados.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function DashboardRelatorios({ onDrillDown }: DashboardRelatoriosProps) {
  const navigate = useNavigate();
  const { data: veiculos = [] } = useVeiculos();

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [dadosGraficoKm, setDadosGraficoKm] = useState<DadosEvolucaoKm[]>([]);
  const [dadosCpk, setDadosCpk] = useState<DadoCpk[]>([]);
  const [dadosPerformance, setDadosPerformance] = useState<DadoPerformance[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingGrafico, setLoadingGrafico] = useState(false);
  const [loadingCpk, setLoadingCpk] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const handleNavigation = React.useCallback((rotaPadrao: string, tipoDrillDown: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => {
    if (onDrillDown) onDrillDown(tipoDrillDown);
    else navigate(rotaPadrao);
  }, [navigate, onDrillDown]);

  // --- KPIs + Gráfico de Hodômetro (filtro por veículo) ---
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const params: any = { ano, mes };
        if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;
        const responseKpi = await api.get('/relatorios/sumario', { params });
        setKpis(responseKpi.data.kpis);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao atualizar métricas da Dashboard.");
      } finally {
        setLoading(false);
      }
    };

    const carregarGraficoKm = async () => {
      if (!veiculoIdFiltro) {
        setDadosGraficoKm([]);
        return;
      }
      setLoadingGrafico(true);
      try {
        const response = await api.get(`/relatorios/evolucao-km?veiculoId=${veiculoIdFiltro}&dias=7`);
        setDadosGraficoKm(response.data);
      } catch (err) {
        console.error("Erro gráfico km:", err);
      } finally {
        setLoadingGrafico(false);
      }
    };

    carregarDados();
    carregarGraficoKm();
  }, [ano, mes, veiculoIdFiltro]);

  // --- Gráficos Globais: CPK Histórico (independente do mês/ano) ---
  useEffect(() => {
    const carregarCpk = async () => {
      setLoadingCpk(true);
      try {
        const params: any = {};
        if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;
        const res = await api.get('/relatorios/evolucao-cpk', { params });
        setDadosCpk(res.data);
      } catch (err) {
        console.error("Erro CPK:", err);
      } finally {
        setLoadingCpk(false);
      }
    };
    carregarCpk();
  }, [veiculoIdFiltro]);

  // --- Gráficos Globais: Performance da Frota (acompanha mes/ano) ---
  useEffect(() => {
    const carregarPerformance = async () => {
      setLoadingPerformance(true);
      try {
        const res = await api.get('/relatorios/performance-frota', { params: { ano, mes } });
        setDadosPerformance(res.data);
      } catch (err) {
        console.error("Erro performance:", err);
      } finally {
        setLoadingPerformance(false);
      }
    };
    carregarPerformance();
  }, [ano, mes]);

  const handleExportar = () => {
    if (!kpis) return;
    const dados = [
      { Indicador: 'Custo Total Operacional', Valor: formatBRL(kpis.custoTotalGeral || 0) },
      { Indicador: 'Quilometragem Total', Valor: formatNum(kpis.kmTotalRodado || 0) },
      { Indicador: 'Custo Médio por KM', Valor: formatBRL(kpis.custoMedioPorKM || 0) },
      { Indicador: 'Consumo Médio (Km/L)', Valor: formatDec(kpis.consumoMedioKML || 0) },
      { Indicador: 'Gasto com Combustível', Valor: formatBRL(kpis.custoTotalCombustivel || 0) },
      { Indicador: 'Gasto com Manutenção', Valor: formatBRL(kpis.custoTotalManutencao || 0) },
    ];
    exportarParaExcel(dados, `Report_Frota_${mes}_${ano}.xlsx`);
    toast.success("Download do relatório iniciado!");
  };

  const opcoesMeses = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())
  })), []);

  const opcoesAnos = useMemo(() => [
    { value: new Date().getFullYear(), label: String(new Date().getFullYear()) },
    { value: new Date().getFullYear() - 1, label: String(new Date().getFullYear() - 1) },
    { value: new Date().getFullYear() - 2, label: String(new Date().getFullYear() - 2) }
  ], []);

  const opcoesVeiculos = useMemo(() => {
    const list = veiculos.map((v: Veiculo) => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }));
    return [{ value: '', label: 'Visão Global (Todas as Placas)' }, ...list];
  }, [veiculos]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER E FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-border/60 pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20 pt-2 -mt-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Inteligência Operacional</h2>
          <p className="text-sm text-text-secondary font-medium mt-1.5 flex items-center gap-2">
            Métricas consolidadas de <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold border border-primary/20">{opcoesMeses.find((m: { value: number; label: string }) => m.value === mes)?.label} de {ano}</span>
          </p>
        </div>

        {/* FILTROS RESPONSIVOS (Accordão em Mobile, Inline em Desktop) */}
        <div className="w-full xl:w-auto">
          {/* Menu Mobile */}
          <details className="group xl:hidden bg-surface rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-text-main touch-manipulation">
               <span className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                 Filtros e Configurações
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform duration-300 group-open:rotate-180 text-text-muted"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </summary>
            
            <div className="p-4 pt-0 flex flex-col gap-3 border-t border-border/50 bg-surface-hover/30">
              <Select value={mes} onChange={(e: { target: { value: string } }) => setMes(Number(e.target.value))} options={opcoesMeses} className="h-12 border-none bg-surface hover:bg-surface-hover shadow-sm text-base font-bold focus:ring-1 focus:ring-primary" containerClassName="!mb-0 w-full" />
              <Select value={ano} onChange={(e: { target: { value: string } }) => setAno(Number(e.target.value))} options={opcoesAnos} className="h-12 border-none bg-surface hover:bg-surface-hover shadow-sm text-base font-bold focus:ring-1 focus:ring-primary" containerClassName="!mb-0 w-full" />
              <Select value={veiculoIdFiltro} onChange={(e: { target: { value: string } }) => setVeiculoIdFiltro(e.target.value)} options={opcoesVeiculos} className="h-12 border-none bg-surface hover:bg-surface-hover shadow-sm text-base font-bold focus:ring-1 focus:ring-primary" containerClassName="!mb-0 w-full" />
              <Button variant="secondary" onClick={handleExportar} className="h-12 w-full mt-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-emerald-500/20 shadow-none transition-colors" icon={<FileSpreadsheet className="w-5 h-5 ml-1" />}>
                Exportar Relatório Excel
              </Button>
            </div>
          </details>

          {/* Menu Desktop */}
          <div className="hidden xl:flex gap-3 items-center bg-surface p-2 rounded-2xl border border-border/60 shadow-sm">
            <div className="w-[130px]">
              <Select value={mes} onChange={(e: { target: { value: string } }) => setMes(Number(e.target.value))} options={opcoesMeses} className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-sm font-bold focus:ring-0" containerClassName="!mb-0" />
            </div>
            <div className="w-[100px]">
              <Select value={ano} onChange={(e: { target: { value: string } }) => setAno(Number(e.target.value))} options={opcoesAnos} className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-sm font-bold focus:ring-0" containerClassName="!mb-0" />
            </div>
            <div className="w-px h-6 bg-border/60 mx-1"></div>
            <div className="w-64">
              <Select value={veiculoIdFiltro} onChange={(e: { target: { value: string } }) => setVeiculoIdFiltro(e.target.value)} options={opcoesVeiculos} className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-sm font-bold focus:ring-0" containerClassName="!mb-0" />
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={handleExportar}
                className="h-10 w-10 p-0 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-emerald-500/20 shadow-none transition-colors"
                title="Exportar Relatório Excel"
                icon={<FileSpreadsheet className="w-5 h-5 mx-auto" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI GRID PREMIUM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <div className="sm:col-span-2">
          <KpiCard
            titulo="Custo Operacional Global"
            valorRaw={kpis?.custoTotalGeral}
            formatter={formatBRL}
            descricao="Combustíveis + Manutenção + Insumos"
            loading={loading}
            highlight
            variant="default"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
          />
        </div>

        <KpiCard titulo="Quilometragem Total" valorRaw={kpis?.kmTotalRodado} formatter={formatNum} descricao="Distância percorrida no período" loading={loading} variant="info" icon={<Activity className="w-5 h-5" />} onClick={() => handleNavigation('/admin/jornadas', 'JORNADA')} />
        <KpiCard titulo="Eficiência de Consumo" valorRaw={kpis?.consumoMedioKML} formatter={formatDec} descricao="Média de consumo da frota (KM/L)" loading={loading} variant="success" icon={<TrendingUp className="w-5 h-5" />} onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')} />
        <KpiCard titulo="Despesa em Combustível" valorRaw={kpis?.custoTotalCombustivel} formatter={formatBRL} descricao="Diesel, Gasolina e GNV" loading={loading} variant="default" icon={<Fuel className="w-5 h-5" />} onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')} />
        <KpiCard titulo="Custos de Oficina" valorRaw={kpis?.custoTotalManutencao} formatter={formatBRL} descricao="Preventivas e Corretivas" loading={loading} variant="warning" icon={<Wrench className="w-5 h-5" />} onClick={() => handleNavigation('/admin/manutencoes', 'MANUTENCAO')} />
        <KpiCard titulo="Aditivos e Fluidos" valorRaw={kpis?.custoTotalAditivo} formatter={formatBRL} descricao="Consumo de Arla 32 e Óleos" loading={loading} variant="info" icon={<Droplets className="w-5 h-5" />} onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')} />
        <KpiCard titulo="Custo Médio / KM" valorRaw={kpis?.custoMedioPorKM} formatter={formatBRL} descricao="Indicador de rentabilidade" loading={loading} variant={(kpis?.custoMedioPorKM || 0) > 4 ? 'danger' : 'success'} icon={<Gauge className="w-5 h-5" />} onClick={() => handleNavigation('/admin/veiculos', 'GERAL')} />
      </div>

      {/* ─── SEÇÃO DE GRÁFICOS ──────────────────────────────────────────────────── */}

      {/* Gráfico de Hodômetro — aparece apenas ao filtrar por veículo */}
      {veiculoIdFiltro && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          {loadingGrafico ? (
            <Skeleton variant="card" className="h-[360px] w-full flex items-center justify-center border border-border/40 shadow-sm" />
          ) : (
            <Suspense fallback={<Skeleton variant="card" className="h-[360px] w-full flex items-center justify-center border border-border/40 shadow-sm" />}>
              <GraficoKmVeiculo dados={dadosGraficoKm} />
            </Suspense>
          )}
        </div>
      )}

      {/* Gráficos Globais — CPK Histórico + Performance da Frota (sempre visíveis) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">

        {/* CPK Histórico — 6 meses */}
        <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-6 sm:p-8 relative overflow-hidden group">
          {/* Glow decorativo */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-sky-500/5 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-sky-500/10 transition-colors duration-700" />

          <div className="flex items-start justify-between mb-6 relative z-10">
            <div>
              <h4 className="text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                <LineChart className="w-5 h-5 text-sky-500" />
                Evolução de CPK
              </h4>
              <p className="text-xs font-medium text-text-secondary mt-0.5">
                Custo por km — combustível vs manutenção (últimos 6 meses)
              </p>
            </div>
            <span className="text-[10px] bg-sky-500/10 text-sky-600 border border-sky-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm shrink-0">
              Histórico
            </span>
          </div>

          <div className="relative z-10">
            <GraficoCpk dados={dadosCpk} loading={loadingCpk} />
          </div>
        </div>

        {/* Performance da Frota — custo por veículo no mês */}
        <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-6 sm:p-8 relative overflow-hidden group">
          {/* Glow decorativo */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

          <div className="flex items-start justify-between mb-6 relative z-10">
            <div>
              <h4 className="text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Performance da Frota
              </h4>
              <p className="text-xs font-medium text-text-secondary mt-0.5">
                Custo total por veículo no período selecionado
              </p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm shrink-0">
              Top 10
            </span>
          </div>

          <div className="relative z-10">
            <GraficoPerformance dados={dadosPerformance} loading={loadingPerformance} />
          </div>
        </div>

      </div>

    </div>
  );
}


