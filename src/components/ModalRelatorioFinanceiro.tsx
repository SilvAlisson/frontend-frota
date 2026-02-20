import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';
import { 
  X, TrendingUp, Fuel, Wrench, BarChart3, PieChart, 
  Activity, AlertTriangle, DollarSign, Loader2, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

// --- COMPONENTES PRIMITIVOS ---
import { Button } from './ui/Button';
import { Card } from './ui/Card';

import type { Veiculo, Abastecimento, OrdemServico } from '../types';

interface RelatorioFinanceiroProps {
  onClose: () => void;
  veiculos: Veiculo[];
}

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    type="button"
    className={cn(
      "shrink-0 pb-3 px-1 sm:px-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 whitespace-nowrap outline-none select-none relative group",
      active
        ? "border-primary text-primary"
        : "border-transparent text-text-muted hover:text-text-main"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
    {label}
  </button>
);

// 🎨 TOOLTIP PREMIUM (Stripe Style)
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface/90 backdrop-blur-xl border border-border/60 p-5 rounded-2xl shadow-float animate-in zoom-in-95 duration-200 min-w-[200px]">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" /> {data.placa} <span className="text-text-secondary/60 font-bold lowercase tracking-normal">({data.modelo})</span>
        </p>
        <p className="text-3xl font-black text-text-main font-mono tracking-tighter mb-4">
          {formatCurrency(data.totalGeral)}
        </p>
        <div className="space-y-2 pt-3 border-t border-border/60">
           <div className="flex justify-between items-center text-xs font-bold">
               <span className="flex items-center gap-1.5 text-amber-600"><Fuel className="w-3.5 h-3.5"/> Combustível</span>
               <span className="font-mono text-text-main">{formatCurrency(data.custoComb)}</span>
           </div>
           <div className="flex justify-between items-center text-xs font-bold">
               <span className="flex items-center gap-1.5 text-primary"><Wrench className="w-3.5 h-3.5"/> Oficina</span>
               <span className="font-mono text-text-main">{formatCurrency(data.custoManut)}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ModalRelatorioFinanceiro({ onClose, veiculos }: RelatorioFinanceiroProps) {
  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'GERAL' | 'CPK' | 'COMBUSTIVEL' | 'MANUTENCAO'>('GERAL');

  const [dadosRaw, setDadosRaw] = useState<{
    abastecimentos: Abastecimento[],
    manutencoes: OrdemServico[]
  }>({ abastecimentos: [], manutencoes: [] });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mesAno, mesNum] = mesFiltro.split('-');
        const dataInicio = `${mesFiltro}-01`;
        const dataFim = new Date(Number(mesAno), Number(mesNum), 0).toISOString().slice(0, 10);

        const [resAbast, resManut] = await Promise.all([
          api.get<Abastecimento[]>('/abastecimentos/recentes', { params: { dataInicio, dataFim, limit: 'all' } }),
          api.get<OrdemServico[]>('/manutencoes/recentes', { params: { dataInicio, dataFim, limit: 'all' } })
        ]);

        if (mounted) {
          setDadosRaw({
            abastecimentos: resAbast.data,
            manutencoes: resManut.data
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao extrair inteligência financeira do servidor.");
      } finally {
        if (mounted) setTimeout(() => setLoading(false), 400); // Suaviza a UX do loading
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [mesFiltro]);

  // 🧠 MOTOR ANALÍTICO
  const relatorios = useMemo(() => {
    const { abastecimentos, manutencoes } = dadosRaw;

    const totalAbastecimento = abastecimentos.reduce((acc, i) => acc + Number(i.custoTotal), 0);
    const totalManut = manutencoes.reduce((acc, i) => acc + Number(i.custoTotal), 0);

    const veiculoStats: Record<string, any> = {};

    veiculos.forEach(v => {
      veiculoStats[v.id] = {
        placa: v.placa,
        modelo: v.modelo,
        custoComb: 0,
        custoManut: 0,
        litros: 0,
        minKm: Infinity,
        maxKm: 0
      };
    });

    abastecimentos.forEach(a => {
      if (a.veiculoId && veiculoStats[a.veiculoId]) {
        veiculoStats[a.veiculoId].custoComb += Number(a.custoTotal);
        
        const litros = (a.itens || []).reduce((acc, item) =>
          item.produto.tipo === 'COMBUSTIVEL' ? acc + Number(item.quantidade) : acc, 0);
        
        veiculoStats[a.veiculoId].litros += litros;

        if (a.kmOdometro > 0) {
          if (a.kmOdometro < veiculoStats[a.veiculoId].minKm) veiculoStats[a.veiculoId].minKm = a.kmOdometro;
          if (a.kmOdometro > veiculoStats[a.veiculoId].maxKm) veiculoStats[a.veiculoId].maxKm = a.kmOdometro;
        }
      }
    });

    manutencoes.forEach(m => {
      if (m.veiculoId && veiculoStats[m.veiculoId]) {
        veiculoStats[m.veiculoId].custoManut += Number(m.custoTotal);
      }
    });

    const listaCPK = Object.values(veiculoStats).map((v: any) => {
      let kmRodado = v.maxKm - v.minKm;
      if (kmRodado < 0 || v.minKm === Infinity || v.maxKm === 0) kmRodado = 0;

      const totalGeral = v.custoComb + v.custoManut;
      const cpk = kmRodado > 0 ? totalGeral / kmRodado : 0;
      const mediaKmLi = (v.litros > 0 && kmRodado > 0) ? kmRodado / v.litros : 0;

      return { ...v, kmRodado, cpk, mediaKmLi, totalGeral };
    }).sort((a, b) => b.totalGeral - a.totalGeral); // Top gastadores primeiro

    let manutCorretiva = 0;
    let manutPreventiva = 0;

    manutencoes.forEach(m => {
      const custo = Number(m.custoTotal);
      if (m.tipo === 'CORRETIVA') {
        manutCorretiva += custo;
      } else {
        manutPreventiva += custo;
      }
    });

    return {
      geral: { totalAbastecimento, totalManut, total: totalAbastecimento + totalManut },
      cpk: listaCPK,
      manutencao: { corretiva: manutCorretiva, preventiva: manutPreventiva }
    };
  }, [dadosRaw, veiculos]);


  // 👻 SKELETON SCREEN (WOW FACTOR LOADING)
  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="bg-surface w-full max-w-6xl h-[85vh] rounded-[2rem] shadow-float border border-border/60 flex flex-col overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border/60 flex justify-between items-center bg-surface-hover/30 shrink-0">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-text-muted/10 rounded-xl animate-pulse"></div>
                    <div className="h-4 w-40 bg-text-muted/5 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-12 w-12 bg-text-muted/10 rounded-2xl animate-pulse"></div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface/50">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest text-text-muted animate-pulse">Consolidando Finanças...</span>
                </div>
            </div>
        </div>
      </div>
    )
  }

  const top5Grafico = relatorios.cpk.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      
      <div className="bg-surface w-full max-w-6xl h-[90vh] flex flex-col rounded-[2.5rem] shadow-float border border-border/60 overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

        {/* HEADER FLUTUANTE PREMIUM */}
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-xl shadow-sm shrink-0 border-b border-border/60">
          
          <div className="px-6 sm:px-10 pt-8 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-3 tracking-tight leading-none">
                <div className="p-2.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                   <TrendingUp className="w-6 h-6" />
                </div>
                Raio-X Financeiro
              </h2>
              <p className="text-sm font-bold text-text-secondary uppercase tracking-widest mt-2 ml-1 opacity-80">Dashboard Analítico de Custos de Frota</p>
            </div>
            
            <div className="flex gap-3 items-center w-full sm:w-auto bg-surface-hover/50 p-1.5 rounded-2xl border border-border/60 shadow-inner">
              <div className="relative flex-1 sm:flex-none px-2">
                  <input
                    type="month"
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    className="w-full sm:w-auto h-10 border-none rounded-xl bg-transparent text-text-main focus:ring-0 outline-none cursor-pointer uppercase tracking-wider font-mono font-black text-sm"
                  />
              </div>
              
              <div className="w-px h-6 bg-border/80 mx-1"></div>

              <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="rounded-xl h-10 w-10 p-0 hover:bg-error hover:text-white text-text-muted transition-colors shrink-0"
                  title="Encerrar Relatório"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* MENUS TABS (Segmented Design) */}
          <div className="w-full px-6 sm:px-10 mt-2 overflow-x-auto custom-scrollbar">
            <div className="flex gap-6 sm:gap-10 min-w-max border-b border-border/40">
              <TabButton active={abaAtiva === 'GERAL'} onClick={() => setAbaAtiva('GERAL')} icon={PieChart} label="Visão Macro" />
              <TabButton active={abaAtiva === 'CPK'} onClick={() => setAbaAtiva('CPK')} icon={BarChart3} label="Custo por KM (CPK)" />
              <TabButton active={abaAtiva === 'COMBUSTIVEL'} onClick={() => setAbaAtiva('COMBUSTIVEL')} icon={Fuel} label="Análise Combustível" />
              <TabButton active={abaAtiva === 'MANUTENCAO'} onClick={() => setAbaAtiva('MANUTENCAO')} icon={Wrench} label="DRE Manutenção" />
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO (SCROLL) */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-background/50 min-h-0 flex-1 custom-scrollbar">
          {/* O `key` assegura que a animação dispara a cada troca de tab */}
          <div key={abaAtiva} className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">

            {abaAtiva === 'GERAL' && (
              <div className="space-y-8">
                
                {/* BIG CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative overflow-hidden flex flex-col justify-between bg-surface border-2 border-border/60 rounded-3xl min-h-[160px] p-6 shadow-sm hover:shadow-float transition-all group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-text-muted/5 rounded-full blur-2xl group-hover:bg-text-muted/10 transition-colors pointer-events-none" />
                    <div>
                        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4"/> Gasto Total do Mês
                        </p>
                        <h3 className="text-4xl lg:text-5xl font-black text-text-main tracking-tighter font-mono">{formatCurrency(relatorios.geral.total)}</h3>
                    </div>
                    <div className="text-xs font-bold text-text-secondary mt-4 flex items-center gap-1 opacity-70">
                       Soma de todas as despesas da frota
                    </div>
                  </div>

                  <div className="relative overflow-hidden flex flex-col justify-between bg-surface border-2 border-border/60 rounded-3xl min-h-[160px] p-6 shadow-sm hover:shadow-float transition-all group">
                    <div className="absolute -right-6 -top-6 p-4 opacity-[0.03] group-hover:opacity-[0.06] rotate-12 transition-all duration-700 group-hover:scale-110 pointer-events-none"><Fuel className="w-32 h-32 text-amber-500" /></div>
                    <div className="relative z-10">
                        <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                          <Fuel className="w-4 h-4"/> Combustível & Fluidos
                        </p>
                        <h3 className="text-3xl lg:text-4xl font-black text-text-main font-mono tracking-tight">{formatCurrency(relatorios.geral.totalAbastecimento)}</h3>
                    </div>
                    <div className="text-xs font-bold text-text-muted mt-4 relative z-10 flex items-center gap-2">
                      <span className="text-amber-700 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                        {((relatorios.geral.totalAbastecimento / (relatorios.geral.total || 1)) * 100).toFixed(1)}%
                      </span> 
                      <span className="opacity-80">Fatia do orçamento</span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden flex flex-col justify-between bg-surface border-2 border-border/60 rounded-3xl min-h-[160px] p-6 shadow-sm hover:shadow-float transition-all group">
                    <div className="absolute -right-6 -top-6 p-4 opacity-[0.03] group-hover:opacity-[0.06] rotate-12 transition-all duration-700 group-hover:scale-110 pointer-events-none"><Wrench className="w-32 h-32 text-primary" /></div>
                    <div className="relative z-10">
                        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                          <Wrench className="w-4 h-4"/> Custos de Oficina
                        </p>
                        <h3 className="text-3xl lg:text-4xl font-black text-text-main font-mono tracking-tight">{formatCurrency(relatorios.geral.totalManut)}</h3>
                    </div>
                    <div className="text-xs font-bold text-text-muted mt-4 relative z-10 flex items-center gap-2">
                      <span className="text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                        {((relatorios.geral.totalManut / (relatorios.geral.total || 1)) * 100).toFixed(1)}%
                      </span> 
                      <span className="opacity-80">Fatia do orçamento</span>
                    </div>
                  </div>
                </div>

                {/* GRÁFICO RECHARTS ELEVADO */}
                <Card className="border-border/60 shadow-sm rounded-3xl p-6 sm:p-8 bg-surface">
                  <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-xl text-text-main flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-text-main text-surface rounded-xl shadow-md"><Activity className="w-5 h-5" /></div>
                        Top 5: Maiores Drenos Financeiros
                      </h4>
                      <p className="text-sm font-medium text-text-secondary mt-1 ml-1 opacity-80">Quais veículos consumiram mais recursos (Combustível + Oficina) neste mês.</p>
                    </div>
                  </div>
                  
                  {top5Grafico.length > 0 ? (
                    <div className="h-[350px] w-full mt-4 -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top5Grafico} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-border/40" />
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="placa" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 13, fill: 'currentColor', fontWeight: 900, fontFamily: 'monospace' }}
                            className="text-text-main"
                          />
                          <Tooltip cursor={{fill: 'rgba(var(--color-primary), 0.05)'}} content={<CustomBarTooltip />} />
                          <Bar dataKey="totalGeral" radius={[0, 12, 12, 0]} barSize={40} animationDuration={1500}>
                            {top5Grafico.map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#10b981'} 
                                fillOpacity={0.9} 
                                className="hover:opacity-80 transition-opacity cursor-pointer shadow-md"
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-3xl bg-surface-hover/30">
                        <Activity className="w-10 h-10 text-text-muted/40 mb-3" />
                        <p className="text-text-secondary font-black tracking-widest uppercase text-sm">Sem Dados para Ranking</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {abaAtiva === 'CPK' && (
              <Card padding="none" className="overflow-hidden border border-border/60 shadow-sm rounded-3xl bg-surface">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface-hover/80 text-text-secondary font-black border-b-2 border-border/60 text-[10px] uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-6 py-5">Identificação do Veículo</th>
                        <th className="px-6 py-5 text-right">KM Percorrido</th>
                        <th className="px-6 py-5 text-right">Custo Total (R$)</th>
                        <th className="px-6 py-5 text-right bg-primary/5 text-primary border-l border-primary/10">CPK - Custo por KM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {relatorios.cpk.map((v: any) => (
                        <tr key={v.placa} className="hover:bg-surface-hover/50 transition-colors group">
                          <td className="px-6 py-5 font-black text-text-main">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-mono tracking-tight text-lg">{v.placa}</span>
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{v.modelo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right text-text-secondary font-mono font-medium text-base">
                              {v.kmRodado.toLocaleString('pt-BR')} <span className="text-[10px] uppercase tracking-widest opacity-50 ml-1">km</span>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-text-main font-mono text-base">{formatCurrency(v.totalGeral)}</td>
                          <td className={cn("px-6 py-5 text-right font-black font-mono border-l border-border/40 text-lg transition-colors", v.cpk > 2.5 ? "text-error bg-error/5 group-hover:bg-error/10" : "text-primary bg-primary/5 group-hover:bg-primary/10")}>
                            {formatCurrency(v.cpk)}
                          </td>
                        </tr>
                      ))}
                      {relatorios.cpk.length === 0 && (
                          <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-text-muted font-bold text-sm uppercase tracking-widest">
                                  Nenhum registo encontrado neste período.
                              </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 sm:p-5 bg-surface-hover/30 text-xs text-text-secondary font-medium border-t border-border/60 flex items-start sm:items-center gap-3">
                  <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0 mt-0.5 sm:mt-0"><Info className="w-4 h-4 text-amber-600" /></div>
                  <span className="leading-relaxed">O valor de <strong className="text-text-main">KM Rodado</strong> é uma estimativa baseada na diferença entre o maior e menor registo de odômetro lançados no sistema durante o mês vigente.</span>
                </div>
              </Card>
            )}

            {abaAtiva === 'COMBUSTIVEL' && (
              <Card padding="none" className="overflow-hidden border border-border/60 shadow-sm rounded-3xl bg-surface">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface-hover/80 text-text-secondary font-black border-b-2 border-border/60 text-[10px] uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-6 py-5">Veículo</th>
                        <th className="px-6 py-5 text-right">Volume Abastecido</th>
                        <th className="px-6 py-5 text-right">Custo Combustível</th>
                        <th className="px-6 py-5 text-right bg-amber-500/5 text-amber-600 border-l border-amber-500/10">Média (KM / Litro)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {relatorios.cpk.map((v: any) => (
                        <tr key={v.placa} className="hover:bg-surface-hover/50 transition-colors group">
                          <td className="px-6 py-5 font-black text-text-main font-mono text-lg tracking-tight">{v.placa}</td>
                          <td className="px-6 py-5 text-right text-text-secondary font-mono font-medium text-base">
                              {v.litros.toFixed(1)} <span className="text-[10px] uppercase tracking-widest opacity-50 ml-1">Litros</span>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-text-main font-mono text-base">{formatCurrency(v.custoComb)}</td>
                          <td className="px-6 py-5 text-right font-black text-amber-600 font-mono text-xl border-l border-border/40 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors">
                            {v.mediaKmLi > 0 ? v.mediaKmLi.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                      {relatorios.cpk.length === 0 && (
                          <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-text-muted font-bold text-sm uppercase tracking-widest">
                                  Nenhum abastecimento registado neste período.
                              </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {abaAtiva === 'MANUTENCAO' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <Card className="shadow-sm border-border/60 rounded-3xl bg-surface p-6 sm:p-8">
                  <h4 className="font-black text-xl text-text-main mb-8 flex items-center gap-3 tracking-tight">
                    <div className="p-2 bg-text-main text-surface rounded-xl shadow-md"><Wrench className="w-5 h-5" /></div> 
                    Preventiva vs Corretiva
                  </h4>

                  <div className="space-y-10">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-text-secondary font-black uppercase tracking-[0.2em] text-[10px]">Manutenção Preventiva (Ideal)</span>
                        <span className="text-text-main font-black font-mono text-2xl tracking-tighter">{formatCurrency(relatorios.manutencao.preventiva)}</span>
                      </div>
                      <div className="w-full h-5 bg-surface-hover/80 rounded-full overflow-hidden border border-border/60 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                          style={{ width: `${(relatorios.manutencao.preventiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                        >
                           <div className="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-text-secondary font-black uppercase tracking-[0.2em] text-[10px]">Manutenção Corretiva (Falha)</span>
                        <span className="text-text-main font-black font-mono text-2xl tracking-tighter">{formatCurrency(relatorios.manutencao.corretiva)}</span>
                      </div>
                      <div className="w-full h-5 bg-surface-hover/80 rounded-full overflow-hidden border border-border/60 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                          style={{ width: `${(relatorios.manutencao.corretiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-sm text-text-main leading-relaxed flex items-start gap-4 shadow-sm">
                      <div className="p-2 bg-amber-500/20 rounded-xl shrink-0"><AlertTriangle className="w-5 h-5 text-amber-600"/></div>
                      <div>
                        <strong className="text-amber-600 block mb-1 font-black uppercase tracking-widest text-[10px]">Alerta de Gestão de Frota</strong> 
                        <span className="font-medium opacity-90">A proporção ideal global indica que a manutenção corretiva (emergencial/quebras) não deve ultrapassar a margem de <strong className="text-text-main">30%</strong> do custo total de manutenção do mês.</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}