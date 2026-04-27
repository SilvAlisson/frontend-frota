import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { Veiculo } from '../types';
import { useSumarioKPIs, useEvolucaoKm, useEvolucaoCpk, usePerformanceFrota } from '../hooks/useDashboardRelatorios';

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
      <Card className={cn("flex flex-col justify-between overflow-hidden border-border/40 glass rounded-2xl", highlight ? "min-h-[160px]" : "min-h-[140px]")}>
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
        highlight ? "min-h-[160px]" : "min-h-[140px]" // Reduzida altura mínima para telas menores
      )}
    >
      {/*  min-w-0 para evitar blowout */}
      <div className="flex justify-between items-start shrink-0 mb-1 relative z-10 p-3 sm:p-4 pb-0 min-w-0">
        <h4 className="font-header text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mt-1.5 leading-snug truncate">
          {titulo}
        </h4>
        {icon && (
          <div className={cn("p-2 sm:p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm shrink-0 ml-2", style.iconBg, style.iconText)}>
            {icon}
          </div>
        )}
      </div>

      {/*  min-w-0 */}
      <div className="flex flex-col justify-end flex-1 min-h-0 relative z-10 p-3 sm:p-4 min-w-0">
        <span
          className={cn(
            "text-data font-black text-text-main leading-none truncate transition-colors duration-300",
            // Tipografia ultra-fluida. Encolhe no notebook (lg), cresce no desktop (xl) e bomba no monitor (2xl)
            highlight 
              ? "!text-3xl sm:!text-4xl lg:!text-3xl xl:!text-4xl 2xl:!text-5xl" 
              : "!text-xl sm:!text-2xl lg:!text-xl xl:!text-2xl 2xl:!text-3xl"
          )}
          title={formatter(valorRaw || 0)}
        >
          <NumberTicker value={valorRaw || 0} formatter={formatter} duration={1.5} />
        </span>

        {/*  min-w-0 */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border/40 flex items-center justify-between shrink-0 min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase text-text-muted truncate max-w-[90%] group-hover:text-text-main transition-colors tracking-wider">
            {descricao}
          </p>
          {onClick && (
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-text-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
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

  // 🔥 PERFORMANCE OPTIMIZER: React Query para fetching paralelo + cache, zero waterfalls
  const { data: kpis, isLoading: loading } = useSumarioKPIs({ ano, mes, veiculoId: veiculoIdFiltro || undefined });
  const { data: dadosGraficoKm = [], isLoading: loadingGrafico } = useEvolucaoKm(veiculoIdFiltro || undefined, 7);
  const { data: dadosCpk = [], isLoading: loadingCpk } = useEvolucaoCpk(veiculoIdFiltro || undefined);
  const { data: dadosPerformance = [], isLoading: loadingPerformance } = usePerformanceFrota({ ano, mes });

  const handleNavigation = React.useCallback((rotaPadrao: string, tipoDrillDown: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => {
    if (onDrillDown) {
      onDrillDown(tipoDrillDown);
    } else {
      const qs = new URLSearchParams();
      if (ano) qs.set('ano', String(ano));
      if (mes) qs.set('mes', String(mes));
      if (veiculoIdFiltro) qs.set('veiculoId', veiculoIdFiltro);
      navigate(`${rotaPadrao}?${qs.toString()}`);
    }
  }, [navigate, onDrillDown, ano, mes, veiculoIdFiltro]);

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

  //  Tipos como String para não bugar a visualização inicial do `<Select>` nativo
  const opcoesMeses = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())
  })), []);

  const opcoesAnos = useMemo(() => [
    { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
    { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
    { value: String(new Date().getFullYear() - 2), label: String(new Date().getFullYear() - 2) }
  ], []);

  const opcoesVeiculos = useMemo(() => {
    const list = veiculos.map((v: Veiculo) => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }));
    return [{ value: '', label: 'Visão Global (Todas as Placas)' }, ...list];
  }, [veiculos]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER E FILTROS */}
      {/* Mudamos de xl para lg. Em notebooks, o menu desktop já aparece! */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 border-b border-border/60 pb-5 lg:pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20 pt-2 -mt-2">
        <div>
          <h2 className="font-header text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Inteligência Operacional</h2>
          <p className="text-xs sm:text-sm text-text-secondary font-medium mt-1.5 flex items-center gap-2">
            Métricas consolidadas de <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold border border-primary/20">{opcoesMeses.find(m => m.value === String(mes))?.label} de {ano}</span>
          </p>
        </div>

        {/* FILTROS RESPONSIVOS */}
        <div className="w-full lg:w-auto">
          {/* Menu Mobile - Só visível em celulares/tablets pequenos */}
          {/*  overflow-hidden REMOVIDO para que as listas do Select nativo funcionem sem cortar */}
          <details className="group lg:hidden bg-surface rounded-2xl border border-border/60 shadow-sm">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-text-main touch-manipulation">
               <span className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                 Filtros e Configurações
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform duration-300 group-open:rotate-180 text-text-muted"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </summary>
            
            <div className="p-4 pt-0 flex flex-col gap-3 border-t border-border/50 bg-surface-hover/30">
              <Select value={String(mes)} onChange={(e: any) => setMes(Number(e.target.value))} options={opcoesMeses} className="h-12 border-none bg-surface hover:bg-surface-hover shadow-sm text-base font-bold focus:ring-1 focus:ring-primary" containerClassName="!mb-0 w-full" />
              <Select value={String(ano)} onChange={(e: any) => setAno(Number(e.target.value))} options={opcoesAnos} className="h-12 border-none bg-surface hover:bg-surface-hover shadow-sm text-base font-bold focus:ring-1 focus:ring-primary" containerClassName="!mb-0 w-full" />
              <Select value={veiculoIdFiltro} onChange={(e: any) => setVeiculoIdFiltro(e.target.value)} options={opcoesVeiculos} className="h-12 border-none bg-surface hover:bg-surface-hover shadow-sm text-base font-bold focus:ring-1 focus:ring-primary" containerClassName="!mb-0 w-full" />
              <Button variant="secondary" onClick={handleExportar} className="h-12 w-full mt-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-emerald-500/20 shadow-none transition-colors" icon={<FileSpreadsheet className="w-5 h-5 ml-1" />}>
                Exportar Relatório Excel
              </Button>
            </div>
          </details>

          {/* Menu Desktop Flexível para Notebooks */}
          {/*  overflow-hidden REMOVIDO também aqui para não cortar dropdowns visuais */}
          <div className="hidden lg:flex gap-2 xl:gap-3 items-center bg-surface p-2 rounded-2xl border border-border/60 shadow-sm w-full lg:w-auto">
            <div className="flex-1 min-w-[100px] xl:w-[120px]">
              <Select value={String(mes)} onChange={(e: any) => setMes(Number(e.target.value))} options={opcoesMeses} className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-xs xl:text-sm font-bold focus:ring-0" containerClassName="!mb-0" />
            </div>
            <div className="w-[80px] xl:w-[90px]">
              <Select value={String(ano)} onChange={(e: any) => setAno(Number(e.target.value))} options={opcoesAnos} className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-xs xl:text-sm font-bold focus:ring-0" containerClassName="!mb-0" />
            </div>
            <div className="w-px h-6 bg-border/60 mx-0.5 xl:mx-1"></div>
            <div className="flex-1 min-w-[150px] lg:w-[180px] xl:w-56">
              <Select value={veiculoIdFiltro} onChange={(e: any) => setVeiculoIdFiltro(e.target.value)} options={opcoesVeiculos} className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-xs xl:text-sm font-bold focus:ring-0" containerClassName="!mb-0" />
            </div>
            <div className="flex justify-end pl-1 xl:pl-0">
              <Button
                variant="secondary"
                onClick={handleExportar}
                className="h-10 w-10 p-0 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-emerald-500/20 shadow-none transition-colors"
                title="Exportar Relatório Excel"
                icon={<FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI GRID PREMIUM */}
      {/* Breakpoint para grid no notebook (lg:grid-cols-4) para manter 4 colunas sem quebrar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="sm:col-span-2">
          <KpiCard
            titulo="Custo Operacional Global"
            valorRaw={kpis?.custoTotalGeral}
            formatter={formatBRL}
            descricao="Combustíveis + Manutenção + Insumos"
            loading={loading}
            highlight
            variant="default"
            icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
            onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
          />
        </div>

        <KpiCard titulo="Quilometragem Total" valorRaw={kpis?.kmTotalRodado} formatter={formatNum} descricao="Distância percorrida no período" loading={loading} variant="info" icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => handleNavigation('/admin/jornadas', 'JORNADA')} />
        <KpiCard titulo="Eficiência de Consumo" valorRaw={kpis?.consumoMedioKML} formatter={formatDec} descricao="Média de consumo da frota (KM/L)" loading={loading} variant="success" icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')} />
        <KpiCard titulo="Despesa em Combustível" valorRaw={kpis?.custoTotalCombustivel} formatter={formatBRL} descricao="Diesel, Gasolina e GNV" loading={loading} variant="default" icon={<Fuel className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')} />
        <KpiCard titulo="Custos de Oficina" valorRaw={kpis?.custoTotalManutencao} formatter={formatBRL} descricao="Preventivas e Corretivas" loading={loading} variant="warning" icon={<Wrench className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => handleNavigation('/admin/manutencoes', 'MANUTENCAO')} />
        <KpiCard titulo="Aditivos e Fluidos" valorRaw={kpis?.custoTotalAditivo} formatter={formatBRL} descricao="Consumo de Arla 32 e Óleos" loading={loading} variant="info" icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')} />
        <KpiCard titulo="Custo Médio / KM" valorRaw={kpis?.custoMedioPorKM} formatter={formatBRL} descricao="Indicador de rentabilidade" loading={loading} variant={(kpis?.custoMedioPorKM || 0) > 4 ? 'danger' : 'success'} icon={<Gauge className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => handleNavigation('/admin/veiculos', 'GERAL')} />
      </div>

      {/* ─── SEÇÃO DE GRÁFICOS ──────────────────────────────────────────────────── */}

      {veiculoIdFiltro && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          {loadingGrafico ? (
            <Skeleton variant="card" className="h-[360px] w-full" />
          ) : (
            <Suspense fallback={<Skeleton variant="card" className="h-[360px] w-full" />}>
              <GraficoKmVeiculo dados={dadosGraficoKm} />
            </Suspense>
          )}
        </div>
      )}

      {/* Gráficos em grid de 2 colunas para notebooks tbm (lg:grid-cols-2 em vez de xl:grid-cols-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">

        <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-5 sm:p-6 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-56 h-56 bg-sky-500/5 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-sky-500/10 transition-colors duration-700" />

          <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
            <div>
              <h4 className="font-header text-base sm:text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />
                Evolução de CPK
              </h4>
              <p className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">
                Custo por km — combustível vs manutenção
              </p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-sky-500/10 text-sky-600 border border-sky-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm shrink-0">
              Histórico
            </span>
          </div>

          {/*  Altura e largura blindadas (h-[280px] w-full) */}
          <div className="relative z-10 w-full h-[280px]">
            <GraficoCpk dados={dadosCpk} loading={loadingCpk} />
          </div>
        </div>

        <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-5 sm:p-6 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

          <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
            <div>
              <h4 className="font-header text-base sm:text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Performance da Frota
              </h4>
              <p className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">
                Custo total por veículo no período selecionado
              </p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm shrink-0">
              Top 10
            </span>
          </div>

          {/*  Altura e largura blindadas (h-[280px] w-full) */}
          <div className="relative z-10 w-full h-[280px]">
            <GraficoPerformance dados={dadosPerformance} loading={loadingPerformance} />
          </div>
        </div>

      </div>

    </div>
  );
}