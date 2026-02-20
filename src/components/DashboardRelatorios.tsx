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
import { Select } from './ui/Select'; // 🔥 Importamos o nosso novo Select!

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

  if (loading) {
    return (
      <Card className={cn("flex flex-col justify-between animate-pulse border-border/50", highlight ? "min-h-[160px]" : "min-h-[150px]")}>
        <div className="flex justify-between items-start w-full">
          <div className="h-3 bg-surface-hover rounded w-24 mb-1"></div>
          <div className="h-10 w-10 bg-surface-hover rounded-xl"></div>
        </div>
        <div className="space-y-3 mt-auto">
          <div className="h-8 bg-surface-hover rounded w-3/4"></div>
          <div className="h-3 bg-surface-hover rounded w-full opacity-60"></div>
        </div>
      </Card>
    );
  }

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
        "relative flex flex-col justify-between h-full hover:shadow-float hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group",
        "border-l-[4px]", style.border,
        highlight ? "min-h-[160px]" : "min-h-[150px]"
      )}
    >
      <div className="flex justify-between items-start shrink-0 mb-2">
        <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] font-sans mt-1.5 leading-snug">
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
            "font-mono font-black text-text-main tracking-tighter leading-none truncate",
            highlight ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          )}
          title={valor}
        >
          {valor}
        </span>
        
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-text-muted font-bold truncate max-w-[90%] group-hover:text-text-main transition-colors">
            {descricao}
          </p>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          )}
        </div>
      </div>
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

  // Prepara as opções para os nossos novos Selects
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
    return [{ value: '', label: 'Todas as Placas' }, ...list];
  }, [veiculos]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER E FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-border/60 pb-6">
        <div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Dashboard Gerencial</h2>
          <p className="text-sm text-text-secondary font-medium mt-1">
            Visão consolidada de <strong className="text-primary">{opcoesMeses.find(m => m.value === mes)?.label} de {ano}</strong>.
          </p>
        </div>

        {/* Barra de Filtros Premium */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center bg-surface/50 p-2 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
          
          <div className="w-32">
            <Select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              options={opcoesMeses}
              className="h-10 border-transparent bg-transparent hover:bg-surface-hover shadow-none"
            />
          </div>
          
          <div className="w-px h-6 bg-border/60 mx-1"></div>

          <div className="w-24">
            <Select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              options={opcoesAnos}
              className="h-10 border-transparent bg-transparent hover:bg-surface-hover shadow-none"
            />
          </div>

          <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block"></div>

          <div className="w-full sm:w-48">
            <Select
              value={veiculoIdFiltro}
              onChange={e => setVeiculoIdFiltro(e.target.value)}
              options={opcoesVeiculos}
              placeholder="Todas as Placas"
              className="h-10 border-transparent bg-transparent hover:bg-surface-hover shadow-none"
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleExportar}
            className="h-10 w-10 p-0 rounded-xl hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 transition-colors ml-auto sm:ml-2"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* GRÁFICO (Onde a mágica do Recharts vai entrar) */}
      {veiculoIdFiltro && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {loadingGrafico ? (
            <Card className="h-80 w-full flex items-center justify-center border-border/50">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm font-bold text-text-muted animate-pulse">Processando dados telemétricos...</span>
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