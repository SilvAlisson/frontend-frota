import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { GraficoKmVeiculo } from './GraficoKmVeiculo';
import { PainelSobrenatural } from './PainelSobrenatural';
import {
  Fuel,
  Wrench,
  Gauge,
  DollarSign,
  Activity,
  Droplets,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import type { Veiculo, KpiData, DadosEvolucaoKm, Jornada } from '../types';

// [CORREÇÃO] Interface restaurada para aceitar onDrillDown do DashboardEncarregado
interface DashboardRelatoriosProps {
  veiculos: Veiculo[];
  onDrillDown?: (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => void;
}

// --- COMPONENTE INTERNO: CARD KPI ---
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
      <div className={`bg-white rounded-xl p-5 shadow-sm border border-border animate-pulse flex flex-col justify-between ${highlight ? 'h-full min-h-[140px]' : 'h-[130px]'}`}>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-2/3 mt-4"></div>
        <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
      </div>
    );
  }

  const colorMap = {
    default: { border: 'border-l-primary', text: 'text-primary', bg: 'bg-primary/10' },
    success: { border: 'border-l-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    warning: { border: 'border-l-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    danger: { border: 'border-l-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
    info: { border: 'border-l-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' }
  };

  const style = colorMap[variant] || colorMap.default;

  return (
    <div
      onClick={onClick}
      className={`
                group relative bg-white rounded-xl p-5 shadow-sm border border-border 
                flex flex-col justify-between cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300
                border-l-[4px] ${style.border}
                ${highlight ? 'h-full min-h-[140px]' : 'h-full min-h-[130px]'}
            `}
    >
      <div className="flex justify-between items-start">
        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest font-sans mt-1">
          {titulo}
        </h4>
        {icon && (
          <div className={`p-2 rounded-lg ${style.bg} ${style.text} transition-colors group-hover:scale-110`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-1">
        <span className={`font-mono font-bold text-gray-900 tracking-tight leading-none ${highlight ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
          {valor}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium truncate max-w-[85%]">
          {descricao}
        </p>
        {onClick && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}

const selectStyle = "h-[42px] px-3 bg-white border border-border rounded-lg text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer min-w-[120px] shadow-sm";

export function DashboardRelatorios({ veiculos, onDrillDown }: DashboardRelatoriosProps) {
  const navigate = useNavigate();

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [dadosGraficoKm, setDadosGraficoKm] = useState<DadosEvolucaoKm[]>([]);
  const [jornadasRecentes, setJornadasRecentes] = useState<Jornada[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingGrafico, setLoadingGrafico] = useState(false);

  // [CORREÇÃO] Lógica Híbrida: Usa onDrillDown se existir, senão usa navigate
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
    exportarParaExcel(dados, `Dashboard_${mes}_${ano}.xlsx`);
  };

  const meses = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
  const anos = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Gerencial</h2>
          <p className="text-sm text-gray-500">Visão consolidada de custos e operações.</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className={`${selectStyle} capitalize`}
          >
            {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>

          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className={`${selectStyle} w-24`}
          >
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={veiculoIdFiltro}
            onChange={e => setVeiculoIdFiltro(e.target.value)}
            className={`${selectStyle} min-w-[160px]`}
          >
            <option value="">Toda a Frota</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
          </select>

          <Button
            variant="secondary"
            onClick={handleExportar}
            className="h-[42px] bg-white border border-border text-gray-700 hover:bg-gray-50"
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Excel
          </Button>
        </div>
      </div>

      {/* KPI GRID (Agora com handleNavigation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="lg:col-span-2">
          <KpiCard
            titulo="Custo Operacional Total"
            valor={formatBRL(kpis?.custoTotalGeral)}
            descricao="Combustível + Manutenção + Insumos"
            loading={loading}
            highlight
            variant="default"
            icon={<DollarSign className="w-5 h-5" />}
            onClick={() => handleNavigation('/admin/veiculos', 'GERAL')}
          />
        </div>

        <KpiCard
          titulo="Quilometragem Total"
          valor={`${formatNum(kpis?.kmTotalRodado)} km`}
          descricao="Distância total percorrida"
          loading={loading}
          variant="info"
          icon={<Activity className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/jornadas', 'JORNADA')}
        />

        <KpiCard
          titulo="Eficiência Média"
          valor={`${formatDec(kpis?.consumoMedioKML)} km/l`}
          descricao="Média de consumo da frota"
          loading={loading}
          variant="success"
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Combustível"
          valor={formatBRL(kpis?.custoTotalCombustivel)}
          descricao="Diesel, Gasolina, GNV"
          loading={loading}
          variant="default"
          icon={<Fuel className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Manutenções"
          valor={formatBRL(kpis?.custoTotalManutencao)}
          descricao="Preventivas e Corretivas"
          loading={loading}
          variant="warning"
          icon={<Wrench className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/manutencoes', 'MANUTENCAO')}
        />

        <KpiCard
          titulo="Aditivos (Arla)"
          valor={formatBRL(kpis?.custoTotalAditivo)}
          descricao="Arla 32 e Lubrificantes"
          loading={loading}
          variant="info"
          icon={<Droplets className="w-5 h-5" />}
          onClick={() => handleNavigation('/admin/abastecimentos', 'ABASTECIMENTO')}
        />

        <KpiCard
          titulo="Custo Médio por KM"
          valor={`${formatBRL(kpis?.custoMedioPorKM)} /km`}
          descricao="Indicador de rentabilidade"
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
            <div className="h-72 w-full bg-white rounded-2xl border border-border flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
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