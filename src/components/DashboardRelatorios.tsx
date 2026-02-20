import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { GraficoKmVeiculo } from './GraficoKmVeiculo';
import { PainelSobrenatural } from './PainelSobrenatural';
import { cn } from '../lib/utils'; 

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- PRIMITIVOS ---
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Select } from './ui/Select'; 

import {
  Fuel, Wrench, Gauge, DollarSign, Activity, 
  Droplets, TrendingUp, FileSpreadsheet, ChevronRight, Loader2
} from 'lucide-react';
import type { KpiData, DadosEvolucaoKm, Jornada } from '../types';

interface DashboardRelatoriosProps {
  onDrillDown?: (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => void;
}

interface KpiCardProps {
  titulo: string;
  valor: string;
  descricao: string;
  onClick?: () => void;
  loading?: boolean;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

// --- KPI CARD PREMIUM (GLASSMORPHISM & GLOW) ---
function KpiCard({ titulo, valor, descricao, onClick, loading, highlight, variant = 'default', icon }: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn("flex flex-col justify-between overflow-hidden border-border/40 bg-surface/50", highlight ? "min-h-[160px]" : "min-h-[150px]")}>
        <div className="flex justify-between items-start w-full p-1 animate-pulse">
          <div className="h-3 bg-text-muted/20 rounded-full w-24 mb-1"></div>
          <div className="h-10 w-10 bg-text-muted/10 rounded-xl"></div>
        </div>
        <div className="space-y-3 mt-auto p-1 animate-pulse">
          <div className="h-8 bg-text-muted/20 rounded-lg w-3/4"></div>
          <div className="h-2 bg-text-muted/10 rounded-full w-full"></div>
        </div>
      </Card>
    );
  }

  const styles = {
    default: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconText: 'text-primary', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(var(--color-primary),0.3)]' },
    success: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' },
    warning: { border: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconText: 'text-amber-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]' },
    danger:  { border: 'border-l-rose-500', iconBg: 'bg-rose-500/10', iconText: 'text-rose-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]' },
    info:    { border: 'border-l-sky-500', iconBg: 'bg-sky-500/10', iconText: 'text-sky-600', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.3)]' }
  };

  const style = styles[variant] || styles.default;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between h-full transition-all duration-500 cursor-pointer overflow-hidden group bg-surface border-y border-r border-border/60 hover:-translate-y-1 hover:border-r-border",
        "border-l-[4px]", style.border, style.glow,
        highlight ? "min-h-[160px]" : "min-h-[150px]"
      )}
    >
      <div className="flex justify-between items-start shrink-0 mb-2 relative z-10">
        <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1.5 leading-snug">
          {titulo}
        </h4>
        {icon && (
          <div className={cn("p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm shrink-0 ml-2", style.iconBg, style.iconText)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end flex-1 min-h-0 relative z-10">
        <span 
          className={cn(
            "font-mono font-black text-text-main tracking-tighter leading-none truncate transition-colors duration-300",
            highlight ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
          )}
          title={valor}
        >
          {valor}
        </span>
        
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-text-muted font-bold truncate max-w-[90%] group-hover:text-text-main transition-colors uppercase tracking-wider">
            {descricao}
          </p>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          )}
        </div>
      </div>
      
      {/* Reflexo de fundo sutil */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-current opacity-[0.02] rounded-full blur-2xl group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
    </Card>
  );
}

export function DashboardRelatorios({ onDrillDown }: DashboardRelatoriosProps) {
  const navigate = useNavigate();

  const { data: veiculos = [] } = useVeiculos();

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [dadosGraficoKm, setDadosGraficoKm] = useState<DadosEvolucaoKm[]>([]);
  const [jornadasRecentes, setJornadasRecentes] = useState<Jornada[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingGrafico, setLoadingGrafico] = useState(false);

  const handleNavigation = (rotaPadrao: string, tipoDrillDown: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => {
    if (onDrillDown) {
      onDrillDown(tipoDrillDown);
    } else {
      navigate(rotaPadrao);
    }
  };

  const formatBRL = (val?: number) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  const formatNum = (val?: number) => val?.toLocaleString('pt-BR') || '0';
  const formatDec = (val?: number) => val?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00';

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const params: any = { ano, mes };
        if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;

        const responseKpi = await api.get('/relatorios/sumario', { params });
        setKpis(responseKpi.data.kpis);

        const responseJornadas = await api.get('/jornadas/historico', {
          params: { ...params, limit: 100 }
        });
        setJornadasRecentes(responseJornadas.data);

      } catch (err) {
        console.error(err);
        toast.error("Erro ao atualizar métricas da Dashboard.");
      } finally {
        setTimeout(() => setLoading(false), 300); 
      }
    };

    const carregarGrafico = async () => {
      if (!veiculoIdFiltro) {
        setDadosGraficoKm([]);
        return;
      }
      setLoadingGrafico(true);
      try {
        const response = await api.get(`/relatorios/evolucao-km?veiculoId=${veiculoIdFiltro}&dias=7`);
        setDadosGraficoKm(response.data);
      } catch (err) {
        console.error("Erro gráfico:", err);
      } finally {
        setLoadingGrafico(false);
      }
    };

    carregarDados();
    carregarGrafico();
  }, [ano, mes, veiculoIdFiltro]);

  const handleExportar = () => {
    if (!kpis) return;
    const dados = [
      { Indicador: 'Custo Total Operacional', Valor: formatBRL(kpis.custoTotalGeral) },
      { Indicador: 'Quilometragem Total', Valor: formatNum(kpis.kmTotalRodado) },
      { Indicador: 'Custo Médio por KM', Valor: formatBRL(kpis.custoMedioPorKM) },
      { Indicador: 'Consumo Médio (Km/L)', Valor: formatDec(kpis.consumoMedioKML) },
      { Indicador: 'Gasto com Combustível', Valor: formatBRL(kpis.custoTotalCombustivel) },
      { Indicador: 'Gasto com Manutenção', Valor: formatBRL(kpis.custoTotalManutencao) },
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
    const list = veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }));
    return [{ value: '', label: 'Visão Global (Todas as Placas)' }, ...list];
  }, [veiculos]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER E FILTROS (Estilo macOS / Flutuante) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-border/60 pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20 pt-2 -mt-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Inteligência Operacional</h2>
          <p className="text-sm text-text-secondary font-medium mt-1.5 flex items-center gap-2">
             Métricas consolidadas de <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold border border-primary/20">{opcoesMeses.find(m => m.value === mes)?.label} de {ano}</span>
          </p>
        </div>

        {/* Barra de Ferramentas */}
        <div className="flex flex-wrap lg:flex-nowrap gap-3 w-full xl:w-auto items-center bg-surface p-2 rounded-2xl border border-border/60 shadow-sm">
          <div className="w-full sm:w-[130px]">
            <Select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              options={opcoesMeses}
              className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-sm font-bold focus:ring-0"
              containerClassName="!mb-0"
            />
          </div>
          <div className="w-full sm:w-[100px]">
            <Select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              options={opcoesAnos}
              className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-sm font-bold focus:ring-0"
              containerClassName="!mb-0"
            />
          </div>

          <div className="w-px h-6 bg-border/60 hidden lg:block mx-1"></div>

          <div className="flex-1 lg:w-64 min-w-[200px]">
            <Select
              value={veiculoIdFiltro}
              onChange={e => setVeiculoIdFiltro(e.target.value)}
              options={opcoesVeiculos}
              className="h-10 border-none bg-surface-hover/50 hover:bg-surface-hover shadow-none text-sm font-bold focus:ring-0"
              containerClassName="!mb-0"
            />
          </div>

          <div className="w-full lg:w-auto flex justify-end">
             <Button
               variant="secondary"
               onClick={handleExportar}
               className="h-10 w-full lg:w-10 p-0 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-emerald-500/20 shadow-none transition-colors"
               title="Exportar Relatório Excel"
               icon={<FileSpreadsheet className="w-5 h-5 mx-auto" />}
             >
                <span className="lg:hidden ml-2 font-bold">Exportar Excel</span>
             </Button>
          </div>
        </div>
      </div>

      {/* KPI GRID PREMIUM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <div className="sm:col-span-2">
          <KpiCard
            titulo="Custo Operacional Global"
            valor={formatBRL(kpis?.custoTotalGeral)}
            descricao="Combustíveis + Manutenção + Insumos"
            loading={loading}
            highlight
            variant="default"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
          />
        </div>

        <KpiCard
          titulo="Quilometragem Total"
          valor={formatNum(kpis?.kmTotalRodado)}
          descricao="Distância percorrida no período"
          loading={loading}
          variant="info"
          icon={<Activity className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/jornadas', 'JORNADA')}
        />

        <KpiCard
          titulo="Eficiência de Consumo"
          valor={formatDec(kpis?.consumoMedioKML)}
          descricao="Média de consumo da frota (KM/L)"
          loading={loading}
          variant="success"
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Despesa em Combustível"
          valor={formatBRL(kpis?.custoTotalCombustivel)}
          descricao="Diesel, Gasolina e GNV"
          loading={loading}
          variant="default"
          icon={<Fuel className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Custos de Oficina"
          valor={formatBRL(kpis?.custoTotalManutencao)}
          descricao="Preventivas e Corretivas"
          loading={loading}
          variant="warning"
          icon={<Wrench className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/manutencoes', 'MANUTENCAO')}
        />

        <KpiCard
          titulo="Aditivos e Fluidos"
          valor={formatBRL(kpis?.custoTotalAditivo)}
          descricao="Consumo de Arla 32 e Óleos"
          loading={loading}
          variant="info"
          icon={<Droplets className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Custo Médio / KM"
          valor={formatBRL(kpis?.custoMedioPorKM)}
          descricao="Indicador de rentabilidade"
          loading={loading}
          variant={(kpis?.custoMedioPorKM || 0) > 4 ? 'danger' : 'success'}
          icon={<Gauge className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
        />
      </div>

      {/* ÁREA DO GRÁFICO (Recharts Premium) */}
      {veiculoIdFiltro && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          {loadingGrafico ? (
            <Card className="h-[360px] w-full flex items-center justify-center border-border/50 bg-surface/50">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <span className="text-xs font-black text-text-muted uppercase tracking-widest animate-pulse">A extrair telemetria do veículo...</span>
              </div>
            </Card>
          ) : (
            <GraficoKmVeiculo dados={dadosGraficoKm} />
          )}
        </div>
      )}

      {/* COMPONENTE DE GAMIFICATION / ALERTAS EXTRAS */}
      {!loading && jornadasRecentes.length > 0 && (
        <PainelSobrenatural jornadas={jornadasRecentes} />
      )}

    </div>
  );
}