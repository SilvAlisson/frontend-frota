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

// --- PRIMITIVOS BIG TECH ---
import { Button } from './ui/Button';
import { Card } from './ui/Card';

import {
  Fuel,
  Wrench,
  Gauge,
  DollarSign,
  Activity,
  Droplets,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import type { KpiData, DadosEvolucaoKm, Jornada } from '../types';

// ✂️ Removemos "veiculos" da interface
interface DashboardRelatoriosProps {
  onDrillDown?: (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => void;
}

// --- KPI CARD BLINDADO (Anti-Layout Shift & Tema Dinâmico) ---
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

function KpiCard({
  titulo,
  valor,
  descricao,
  onClick,
  loading,
  highlight,
  variant = 'default',
  icon
}: KpiCardProps) {

  // SKELETON: Mesma geometria do card real usando cores semânticas
  if (loading) {
    return (
      <Card className={cn("flex flex-col justify-between animate-pulse border-border/50", highlight ? "min-h-[160px]" : "min-h-[150px]")}>
        <div className="flex justify-between items-start w-full">
          <div className="h-3 bg-surface-hover rounded w-24 mb-1"></div>
          <div className="h-10 w-10 bg-surface-hover rounded-lg"></div>
        </div>
        <div className="space-y-3 mt-auto">
          <div className="h-8 bg-surface-hover rounded w-3/4"></div>
          <div className="h-3 bg-surface-hover rounded w-full opacity-60"></div>
        </div>
      </Card>
    );
  }

  // Mapeamento de Cores Semânticas
  const styles = {
    default: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconText: 'text-primary' },
    success: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-600' },
    warning: { border: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconText: 'text-amber-600' },
    danger:  { border: 'border-l-rose-500', iconBg: 'bg-rose-500/10', iconText: 'text-rose-600' },
    info:    { border: 'border-l-sky-500', iconBg: 'bg-sky-500/10', iconText: 'text-sky-600' }
  };

  const style = styles[variant] || styles.default;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between h-full hover:shadow-md transition-shadow cursor-pointer",
        "border-l-[4px]", style.border,
        highlight ? "min-h-[160px]" : "min-h-[150px]"
      )}
    >
      <div className="flex justify-between items-start shrink-0 mb-2">
        <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest font-sans mt-1.5 leading-snug">
          {titulo}
        </h4>
        {icon && (
          <div className={cn("p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-sm shrink-0 ml-2", style.iconBg, style.iconText)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end flex-1 min-h-0">
        <span 
          className={cn(
            "font-mono font-bold text-text-main tracking-tight leading-none truncate",
            highlight ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          )}
          title={valor}
        >
          {valor}
        </span>
        
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-text-muted font-medium truncate max-w-[90%] group-hover:text-text-main transition-colors">
            {descricao}
          </p>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-text-muted/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          )}
        </div>
      </div>
    </Card>
  );
}

// Estilo Base para Selects (Cores Semânticas)
const selectStyle = "h-[42px] px-3 bg-surface border border-border rounded-lg text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer min-w-[140px] shadow-sm hover:border-primary/50 appearance-none font-medium";

export function DashboardRelatorios({ onDrillDown }: DashboardRelatoriosProps) {
  const navigate = useNavigate();

  // 📡 BUSCA INDEPENDENTE COM CACHE
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
        toast.error("Erro ao atualizar dashboard.");
      } finally {
        setTimeout(() => setLoading(false), 400); 
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
    exportarParaExcel(dados, `Dashboard_${mes}_${ano}.xlsx`);
  };

  const meses = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) })), []);
  const anos = useMemo(() => [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2], []);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">

      {/* HEADER E FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight font-sans">Dashboard Gerencial</h2>
          <p className="text-sm text-text-secondary font-medium mt-1">
            Visão consolidada de <strong className="text-primary">{meses.find(m => m.v === mes)?.l} de {ano}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center bg-surface p-1.5 rounded-xl border border-border shadow-sm">
          <div className="relative">
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className={`${selectStyle} capitalize pl-3 pr-8 bg-transparent border-none shadow-none focus:ring-0`}
            >
              {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          
          <div className="w-px h-6 bg-border mx-1"></div>

          <div className="relative">
            <select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              className={`${selectStyle} bg-transparent border-none shadow-none focus:ring-0 w-24`}
            >
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="w-px h-6 bg-border mx-1"></div>

          <div className="relative">
            <select
              value={veiculoIdFiltro}
              onChange={e => setVeiculoIdFiltro(e.target.value)}
              className={`${selectStyle} bg-transparent border-none shadow-none focus:ring-0 min-w-[180px]`}
            >
              <option value="">Todas as Placas</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
            </select>
          </div>

          <Button
            variant="ghost"
            onClick={handleExportar}
            className="h-[38px] w-[38px] p-0 rounded-lg hover:bg-surface-hover ml-1 text-emerald-600 hover:text-emerald-700"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card Destaque (Custo Total) */}
        <div className="lg:col-span-2">
          <KpiCard
            titulo="Custo Operacional Total"
            valor={formatBRL(kpis?.custoTotalGeral)}
            descricao="Combustível + Manutenção + Insumos"
            loading={loading}
            highlight
            variant="default"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
          />
        </div>

        <KpiCard
          titulo="Quilometragem"
          valor={formatNum(kpis?.kmTotalRodado)}
          descricao="KM Total percorrido no período"
          loading={loading}
          variant="info"
          icon={<Activity className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/jornadas', 'JORNADA')}
        />

        <KpiCard
          titulo="Eficiência Média"
          valor={formatDec(kpis?.consumoMedioKML)}
          descricao="Média geral da frota (KM/L)"
          loading={loading}
          variant="success"
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        {/* Linha 2 */}
        <KpiCard
          titulo="Gasto Combustível"
          valor={formatBRL(kpis?.custoTotalCombustivel)}
          descricao="Diesel, Gasolina e GNV"
          loading={loading}
          variant="default"
          icon={<Fuel className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Gasto Manutenções"
          valor={formatBRL(kpis?.custoTotalManutencao)}
          descricao="Preventivas e Corretivas"
          loading={loading}
          variant="warning"
          icon={<Wrench className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/manutencoes', 'MANUTENCAO')}
        />

        <KpiCard
          titulo="Insumos (Arla)"
          valor={formatBRL(kpis?.custoTotalAditivo)}
          descricao="Arla 32 e Lubrificantes"
          loading={loading}
          variant="info"
          icon={<Droplets className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Custo Médio / KM"
          valor={formatBRL(kpis?.custoMedioPorKM)}
          descricao="Indicador chave de rentabilidade"
          loading={loading}
          variant={(kpis?.custoMedioPorKM || 0) > 4 ? 'danger' : 'success'}
          icon={<Gauge className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
        />
      </div>

      {/* GRÁFICO */}
      {veiculoIdFiltro && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          {loadingGrafico ? (
            <Card className="h-80 w-full flex items-center justify-center border-border">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-xs text-text-muted">Carregando gráfico...</span>
              </div>
            </Card>
          ) : (
            <GraficoKmVeiculo dados={dadosGraficoKm} />
          )}
        </div>
      )}

      {/* GAMIFICATION */}
      {!loading && jornadasRecentes.length > 0 && (
        <PainelSobrenatural jornadas={jornadasRecentes} />
      )}

    </div>
  );
}