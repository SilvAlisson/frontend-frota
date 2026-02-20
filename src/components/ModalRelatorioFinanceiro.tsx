import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';
import { 
  X, TrendingUp, Fuel, Wrench, BarChart3, PieChart, 
  Activity, AlertTriangle, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
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
      "shrink-0 pb-3 px-4 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/20 select-none",
      active
        ? "border-primary text-primary"
        : "border-transparent text-text-secondary hover:text-text-main hover:border-border"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "text-text-muted")} />
    {label}
  </button>
);

// Tooltip Premium para o novo gráfico
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface/90 backdrop-blur-md border border-border/60 p-4 rounded-2xl shadow-float animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" /> {data.placa} <span className="text-text-secondary/50 font-medium lowercase tracking-normal">({data.modelo})</span>
        </p>
        <p className="text-2xl font-black text-text-main font-mono tracking-tighter">
          {formatCurrency(data.totalGeral)}
        </p>
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/50 text-xs font-medium">
           <span className="flex items-center gap-1 text-text-secondary"><Fuel className="w-3 h-3"/> {formatCurrency(data.custoComb)}</span>
           <span className="flex items-center gap-1 text-text-secondary"><Wrench className="w-3 h-3"/> {formatCurrency(data.custoManut)}</span>
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
        toast.error("Erro ao carregar dados financeiros.");
      } finally {
        if (mounted) setTimeout(() => setLoading(false), 300);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [mesFiltro]);

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
    }).sort((a, b) => b.totalGeral - a.totalGeral);

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

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-surface w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col border border-border/50 animate-pulse">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface-hover/30 rounded-t-[2rem]">
                <div className="space-y-3">
                    <div className="h-6 w-56 bg-border/50 rounded-lg"></div>
                    <div className="h-4 w-40 bg-border/30 rounded-lg"></div>
                </div>
                <div className="h-10 w-10 bg-border/50 rounded-xl"></div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="h-40 bg-surface-hover/50 rounded-2xl border border-border/40"></div>
                <div className="h-40 bg-surface-hover/50 rounded-2xl border border-border/40"></div>
                <div className="h-40 bg-surface-hover/50 rounded-2xl border border-border/40"></div>
            </div>
             <div className="p-6 flex-1 pt-0">
                <div className="h-full bg-surface-hover/50 rounded-2xl border border-border/40"></div>
            </div>
        </div>
      </div>
    )
  }

  const top5Grafico = relatorios.cpk.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      <div className="bg-surface w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[2rem] shadow-float border border-border/50 overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">

        <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur shadow-sm shrink-0">
          
          <div className="px-6 sm:px-8 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
            <div>
              <h2 className="text-2xl font-black text-text-main flex items-center gap-2.5 tracking-tight">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-inner">
                   <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                Inteligência Financeira
              </h2>
              <p className="text-sm font-medium text-text-secondary mt-1.5 ml-1">Análise estratégica e rateio de custos da frota</p>
            </div>
            
            <div className="flex gap-3 items-center w-full sm:w-auto bg-surface-hover p-1.5 rounded-2xl border border-border/60">
              <div className="relative flex-1 sm:flex-none">
                  <input
                    type="month"
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    className="w-full sm:w-auto h-10 border-none rounded-xl px-4 text-sm font-bold bg-transparent text-text-main focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer uppercase tracking-wider font-mono"
                  />
              </div>
              
              <div className="w-px h-6 bg-border mx-1"></div>

              <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="rounded-xl h-10 w-10 p-0 hover:bg-black/5 text-text-muted hover:text-text-main transition-colors shrink-0"
                  title="Fechar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="w-full px-6 sm:px-8 mt-2 overflow-x-auto custom-scrollbar border-b border-border/60">
            <div className="flex gap-6 min-w-max">
              <TabButton active={abaAtiva === 'GERAL'} onClick={() => setAbaAtiva('GERAL')} icon={PieChart} label="Visão Macro" />
              <TabButton active={abaAtiva === 'CPK'} onClick={() => setAbaAtiva('CPK')} icon={BarChart3} label="Custo por KM (CPK)" />
              <TabButton active={abaAtiva === 'COMBUSTIVEL'} onClick={() => setAbaAtiva('COMBUSTIVEL')} icon={Fuel} label="Auditoria Combustível" />
              <TabButton active={abaAtiva === 'MANUTENCAO'} onClick={() => setAbaAtiva('MANUTENCAO')} icon={Wrench} label="DRE Manutenção" />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto bg-surface/50 min-h-0 flex-1 custom-scrollbar">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

            {abaAtiva === 'GERAL' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="flex flex-col justify-between border-l-[4px] border-l-gray-800 min-h-[140px] shadow-sm hover:shadow-md transition-shadow group">
                    <div>
                        <p className="text-text-muted text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><DollarSign className="w-4 h-4"/> Gasto Total do Mês</p>
                        <h3 className="text-4xl font-black text-text-main tracking-tighter font-mono">{formatCurrency(relatorios.geral.total)}</h3>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden group border-l-[4px] border-l-amber-500 min-h-[140px] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12"><Fuel className="w-24 h-24" /></div>
                    <div className="relative z-10">
                        <p className="text-amber-600 text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><Fuel className="w-4 h-4"/> Combustível</p>
                        <h3 className="text-3xl font-black text-text-main font-mono tracking-tight">{formatCurrency(relatorios.geral.totalAbastecimento)}</h3>
                    </div>
                    <div className="text-xs font-bold text-text-muted mt-2 relative z-10">
                      <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mr-1">
                        {((relatorios.geral.totalAbastecimento / (relatorios.geral.total || 1)) * 100).toFixed(1)}%
                      </span> do orçamento
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden group border-l-[4px] border-l-primary min-h-[140px] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12"><Wrench className="w-24 h-24" /></div>
                    <div className="relative z-10">
                        <p className="text-primary text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><Wrench className="w-4 h-4"/> Manutenção</p>
                        <h3 className="text-3xl font-black text-text-main font-mono tracking-tight">{formatCurrency(relatorios.geral.totalManut)}</h3>
                    </div>
                    <div className="text-xs font-bold text-text-muted mt-2 relative z-10">
                      <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">
                        {((relatorios.geral.totalManut / (relatorios.geral.total || 1)) * 100).toFixed(1)}%
                      </span> do orçamento
                    </div>
                  </Card>
                </div>

                <Card className="border-border/60 shadow-card">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-lg text-text-main flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Activity className="w-5 h-5 text-primary" /></div>
                        Top 5: Maior Consumo Financeiro
                      </h4>
                      <p className="text-sm font-medium text-text-secondary mt-1 ml-1">Veículos que mais geraram custos no mês (Combustível + Manutenção)</p>
                    </div>
                  </div>
                  
                  {top5Grafico.length > 0 ? (
                    <div className="h-[300px] w-full mt-4 -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top5Grafico} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="placa" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: 'currentColor', fontWeight: 'bold', fontFamily: 'monospace' }}
                            className="text-text-main"
                          />
                          <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} content={<CustomBarTooltip />} />
                          <Bar dataKey="totalGeral" radius={[0, 8, 8, 0]} barSize={32} animationDuration={1000}>
                            {top5Grafico.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#10b981'} fillOpacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center border border-dashed border-border/60 rounded-xl bg-surface/50">
                        <p className="text-text-muted font-bold text-sm">Sem dados de consumo para formar ranking.</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {abaAtiva === 'CPK' && (
              <Card padding="none" className="overflow-hidden border border-border/60 shadow-card rounded-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface-hover/50 text-text-muted font-black border-b border-border text-[10px] uppercase tracking-[0.15em]">
                      <tr>
                        <th className="px-6 py-4">Veículo</th>
                        <th className="px-6 py-4 text-right">KM Rodado</th>
                        <th className="px-6 py-4 text-right">Custo Total</th>
                        <th className="px-6 py-4 text-right bg-primary/5 text-primary border-l border-border/50">Custo por KM (CPK)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {relatorios.cpk.map((v: any) => (
                        <tr key={v.placa} className="hover:bg-surface-hover transition-colors group">
                          <td className="px-6 py-4 font-black text-text-main">
                            <div className="flex flex-col"><span className="font-mono tracking-tight text-base">{v.placa}</span><span className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">{v.modelo}</span></div>
                          </td>
                          <td className="px-6 py-4 text-right text-text-secondary font-mono font-medium">{v.kmRodado.toLocaleString('pt-BR')} <span className="text-[10px] uppercase tracking-wider opacity-60">km</span></td>
                          <td className="px-6 py-4 text-right font-black text-text-main font-mono">{formatCurrency(v.totalGeral)}</td>
                          <td className={cn("px-6 py-4 text-right font-black font-mono border-l border-border/50 text-base", v.cpk > 2.5 ? "text-error bg-error/5" : "text-primary bg-primary/5")}>
                            {formatCurrency(v.cpk)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-surface-hover/30 text-xs text-text-secondary font-medium border-t border-border/60 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  O KM Rodado é estimado pela diferença entre o maior e menor odômetro registrados no mês pela telemetria.
                </div>
              </Card>
            )}

            {abaAtiva === 'COMBUSTIVEL' && (
              <Card padding="none" className="overflow-hidden border border-border/60 shadow-card rounded-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface-hover/50 text-text-muted font-black border-b border-border text-[10px] uppercase tracking-[0.15em]">
                      <tr>
                        <th className="px-6 py-4">Veículo</th>
                        <th className="px-6 py-4 text-right">Volume Abastecido</th>
                        <th className="px-6 py-4 text-right">Custo Total</th>
                        <th className="px-6 py-4 text-right bg-amber-500/5 text-amber-600 border-l border-border/50">Média (KM/L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {relatorios.cpk.map((v: any) => (
                        <tr key={v.placa} className="hover:bg-surface-hover transition-colors group">
                          <td className="px-6 py-4 font-black text-text-main font-mono text-base">{v.placa}</td>
                          <td className="px-6 py-4 text-right text-text-secondary font-mono font-medium">{v.litros.toFixed(1)} <span className="text-[10px] uppercase tracking-wider opacity-60">L</span></td>
                          <td className="px-6 py-4 text-right font-black text-text-main font-mono">{formatCurrency(v.custoComb)}</td>
                          <td className="px-6 py-4 text-right font-black text-amber-600 font-mono text-base border-l border-border/50 bg-amber-500/5">
                            {v.mediaKmLi > 0 ? v.mediaKmLi.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {abaAtiva === 'MANUTENCAO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-card border-border/60">
                  <h4 className="font-black text-lg text-text-main mb-6 flex items-center gap-2.5 pb-4 border-b border-border/50">
                    <div className="p-1.5 bg-text-muted/10 rounded-lg"><Wrench className="w-5 h-5 text-text-main" /></div> 
                    Preventiva vs Corretiva
                  </h4>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between text-sm mb-2.5">
                        <span className="text-text-secondary font-bold uppercase tracking-wider text-xs">Preventiva (Ideal)</span>
                        <span className="text-text-main font-black font-mono">{formatCurrency(relatorios.manutencao.preventiva)}</span>
                      </div>
                      <div className="w-full h-4 bg-surface-hover rounded-full overflow-hidden border border-border/50 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(relatorios.manutencao.preventiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2.5">
                        <span className="text-text-secondary font-bold uppercase tracking-wider text-xs">Corretiva (Quebras)</span>
                        <span className="text-text-main font-black font-mono">{formatCurrency(relatorios.manutencao.corretiva)}</span>
                      </div>
                      <div className="w-full h-4 bg-surface-hover rounded-full overflow-hidden border border-border/50 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(relatorios.manutencao.corretiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-sm text-text-main leading-relaxed flex gap-3 shadow-sm">
                      <div className="p-1 bg-amber-500/20 rounded-full h-fit shrink-0"><AlertTriangle className="w-4 h-4 text-amber-600"/></div>
                      <div>
                        <strong className="text-amber-600">Alerta de Gestão:</strong> A proporção ideal global é que a manutenção corretiva (emergencial) não ultrapasse a margem de 30% do custo total de manutenção.
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