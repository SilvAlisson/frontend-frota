import { useState, useMemo, Suspense } from 'react';
import React from 'react';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';
import { useSumarioKPIs, useEvolucaoKm, useEvolucaoCpk, usePerformanceFrota } from '../hooks/useDashboardRelatorios';
import { useModalStore } from '../hooks/useModalStore';

// --- PRIMITIVOS & REGISTRIES ---
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Skeleton } from './ui/Skeleton';
import { KpiCard } from './ui/KpiCard';

import {
  Fuel, Wrench, Gauge, DollarSign, Activity,
  Droplets, TrendingUp, FileSpreadsheet,
  BarChart2, LineChart
} from 'lucide-react';
import type { Veiculo } from '../types';

import { GraficoCpk } from './dashboard/GraficoCpk';
import { GraficoPerformance } from './dashboard/GraficoPerformance';
import type { DadoPerformance } from './dashboard/GraficoPerformance';

const GraficoKmVeiculo = React.lazy(() => import('./GraficoKmVeiculo').then(module => ({ default: module.GraficoKmVeiculo })));

//  HELPER: Limpador Automático de Placas
const extrairPlaca = (placaBruta: string) => {
  if (!placaBruta) return '---';
  const match = placaBruta.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return placaBruta.trim();
};

const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNum = (val: number) => val.toLocaleString('pt-BR');
const formatDec = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export function DashboardRelatorios() {
  const { data: veiculos = [] } = useVeiculos();
  const { openModal } = useModalStore();

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState<string>('');

  const openAnalytics = (metric: string, title: string) => {
    openModal('ANALYTICS', { metric, title });
  };

  const { data: kpis, isLoading: loading } = useSumarioKPIs({ ano, mes, veiculoId: veiculoIdFiltro || undefined });
  const { data: dadosGraficoKm = [], isLoading: loadingGrafico } = useEvolucaoKm(veiculoIdFiltro || undefined, 7);
  const { data: dadosCpk = [], isLoading: loadingCpk } = useEvolucaoCpk(veiculoIdFiltro || undefined);
  const { data: dadosPerformance = [], isLoading: loadingPerformance } = usePerformanceFrota({ ano, mes });

  const dadosPerformanceLimpos = useMemo(() => {
    return dadosPerformance.map((d: DadoPerformance) => ({
      ...d,
      name: extrairPlaca(d.name)
    }));
  }, [dadosPerformance]);

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
    value: String(i + 1),
    label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())
  })), []);

  const opcoesAnos = useMemo(() => [
    { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
    { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
    { value: String(new Date().getFullYear() - 2), label: String(new Date().getFullYear() - 2) }
  ], []);

  const opcoesVeiculos = useMemo(() => {
    const list = veiculos.map((v: Veiculo) => ({ value: v.id, label: `${extrairPlaca(v.placa)} - ${v.modelo}` }));
    return [{ value: '', label: 'Visão Global (Todas as Placas)' }, ...list];
  }, [veiculos]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER E FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 border-b border-border/60 pb-5 lg:pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20 pt-2 -mt-2">
        <div>
          <h2 className="font-header text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Inteligência Operacional</h2>
          <p className="text-xs sm:text-sm text-text-secondary font-medium mt-1.5 flex items-center gap-2">
            Métricas consolidadas de <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold border border-primary/20">{opcoesMeses.find(m => m.value === String(mes))?.label} de {ano}</span>
          </p>
        </div>

        {/* FILTROS RESPONSIVOS */}
        <div className="w-full lg:w-auto">
          {/* Menu Mobile */}
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

          {/* Menu Desktop Flexível */}
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
            onClick={() => openAnalytics('CUSTO_GLOBAL', 'Custo Operacional Global')}
          />
        </div>

        <KpiCard titulo="Quilometragem Total" valorRaw={kpis?.kmTotalRodado} formatter={formatNum} descricao="Distância percorrida no período" loading={loading} variant="info" icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => openAnalytics('KM_TOTAL', 'Quilometragem Total')} />
        <KpiCard titulo="Eficiência de Consumo" valorRaw={kpis?.consumoMedioKML} formatter={formatDec} descricao="Média de consumo da frota (KM/L)" loading={loading} variant="success" icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => openAnalytics('EFICIENCIA', 'Eficiência de Consumo')} />
        <KpiCard titulo="Despesa em Combustível" valorRaw={kpis?.custoTotalCombustivel} formatter={formatBRL} descricao="Diesel, Gasolina e GNV" loading={loading} variant="default" icon={<Fuel className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => openAnalytics('COMBUSTIVEL', 'Despesa em Combustível')} />
        <KpiCard titulo="Custos de Oficina" valorRaw={kpis?.custoTotalManutencao} formatter={formatBRL} descricao="Preventivas e Corretivas" loading={loading} variant="warning" icon={<Wrench className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => openAnalytics('OFICINA', 'Custos de Oficina')} />
        <KpiCard titulo="Aditivos e Fluidos" valorRaw={kpis?.custoTotalAditivo} formatter={formatBRL} descricao="Consumo de Arla 32 e Óleos" loading={loading} variant="info" icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => openAnalytics('ADITIVOS', 'Aditivos e Fluidos')} />
        <KpiCard titulo="Custo Médio / KM" valorRaw={kpis?.custoMedioPorKM} formatter={formatBRL} descricao="Indicador de rentabilidade" loading={loading} variant={(kpis?.custoMedioPorKM || 0) > 4 ? 'danger' : 'success'} icon={<Gauge className="w-4 h-4 sm:w-5 sm:h-5" />} onClick={() => openAnalytics('CUSTO_KM', 'Custo Médio / KM')} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">

        <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-5 sm:p-6 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-56 h-56 bg-info/5 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-info/10 transition-colors duration-700" />

          <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
            <div>
              <h4 className="font-header text-base sm:text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                Evolução de CPK
              </h4>
              <p className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">
                Custo por km — combustível vs manutenção
              </p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-info/10 text-info border border-info/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm shrink-0">
              Histórico
            </span>
          </div>

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

          <div className="relative z-10 w-full h-[280px]">
            <GraficoPerformance dados={dadosPerformanceLimpos} loading={loadingPerformance} />
          </div>
        </div>

      </div>

    </div>
  );
}