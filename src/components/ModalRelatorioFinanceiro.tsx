import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';
import { 
  X, TrendingUp, Fuel, Wrench, BarChart3, PieChart, 
  Activity, AlertTriangle
} from 'lucide-react';

// --- COMPONENTES PRIMITIVOS ---
import { Button } from './ui/Button';
import { Card } from './ui/Card';

import type { Veiculo, Abastecimento, OrdemServico } from '../types';

interface RelatorioFinanceiroProps {
  onClose: () => void;
  veiculos: Veiculo[];
}

// ABA REESTILIZADA (Com shrink-0 para impedir esmagamento visual)
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    type="button"
    className={cn(
      "shrink-0 pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-t-lg select-none",
      active
        ? "border-primary text-primary bg-primary/5"
        : "border-transparent text-text-secondary hover:text-text-main hover:bg-gray-50"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-text-muted")} />
    {label}
  </button>
);

export function ModalRelatorioFinanceiro({ onClose, veiculos }: RelatorioFinanceiroProps) {
  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'GERAL' | 'CPK' | 'COMBUSTIVEL' | 'MANUTENCAO'>('GERAL');

  const [dadosRaw, setDadosRaw] = useState<{
    abastecimentos: Abastecimento[],
    manutencoes: OrdemServico[]
  }>({ abastecimentos: [], manutencoes: [] });

  // BUSCAR DADOS
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
          // Mantendo sua correção da rota
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

  // CÁLCULOS (Lógica original mantida 100%)
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

  // SKELETON LOADING UI (Evita layout shift quando abre)
  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-background w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-border animate-pulse">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-36 bg-gray-200 rounded-xl"></div>
                <div className="h-36 bg-gray-200 rounded-xl"></div>
                <div className="h-36 bg-gray-200 rounded-xl"></div>
            </div>
             <div className="p-6 flex-1">
                <div className="h-full bg-gray-200 rounded-xl"></div>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Container Principal */}
      <div className="bg-background w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col border border-border">

        {/* --- HEADER UNIFICADO (STICKY) --- */}
        {/* Aqui está a correção: Header e Abas no MESMO bloco sticky */}
        <div className="sticky top-0 z-20 bg-surface border-b border-border shadow-sm shrink-0">
          
          {/* Linha Superior: Título e Filtros */}
          <div className="px-6 pt-5 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                   <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                Inteligência Financeira
              </h2>
              <p className="text-sm text-text-secondary mt-1 ml-1">Análise estratégica de custos da frota</p>
            </div>
            
            <div className="flex gap-3 items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                  <input
                    type="month"
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    className="w-full sm:w-auto h-10 border border-input rounded-lg px-3 text-sm bg-surface text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  />
              </div>
              
              <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="rounded-full h-10 w-10 p-0 hover:bg-gray-100 shrink-0"
                  title="Fechar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Linha Inferior: Abas de Navegação */}
          <div className="w-full px-6 pt-2 overflow-x-auto custom-scrollbar">
            <div className="flex gap-4 min-w-max pb-px">
              <TabButton active={abaAtiva === 'GERAL'} onClick={() => setAbaAtiva('GERAL')} icon={PieChart} label="Visão Macro" />
              <TabButton active={abaAtiva === 'CPK'} onClick={() => setAbaAtiva('CPK')} icon={BarChart3} label="Custo por KM (CPK)" />
              <TabButton active={abaAtiva === 'COMBUSTIVEL'} onClick={() => setAbaAtiva('COMBUSTIVEL')} icon={Fuel} label="Auditoria Combustível" />
              <TabButton active={abaAtiva === 'MANUTENCAO'} onClick={() => setAbaAtiva('MANUTENCAO')} icon={Wrench} label="DRE Manutenção" />
            </div>
          </div>
        </div>

        {/* --- CONTEÚDO (Scrollável) --- */}
        <div className="p-6 space-y-6 bg-gray-50/30 min-h-0 flex-1">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* ABA GERAL */}
            {abaAtiva === 'GERAL' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Card Total */}
                  <Card className="flex flex-col justify-between border-l-4 border-l-gray-800 min-h-[140px]">
                    <div>
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Total Gasto</p>
                        <h3 className="text-3xl font-bold text-text-main tracking-tight">{formatCurrency(relatorios.geral.total)}</h3>
                    </div>
                    <div className="text-xs text-text-muted mt-4 pt-4 border-t border-border">Consolidado do Mês</div>
                  </Card>

                  {/* Card Combustível */}
                  <Card className="relative overflow-hidden group border-l-4 border-l-amber-500 min-h-[140px] flex flex-col justify-between">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 rotate-12"><Fuel className="w-20 h-20" /></div>
                    <div>
                        <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">Combustível</p>
                        <h3 className="text-2xl font-bold text-text-main">{formatCurrency(relatorios.geral.totalAbastecimento)}</h3>
                    </div>
                    <div className="text-xs text-text-muted mt-2">
                      {((relatorios.geral.totalAbastecimento / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total
                    </div>
                  </Card>

                  {/* Card Manutenção */}
                  <Card className="relative overflow-hidden group border-l-4 border-l-primary min-h-[140px] flex flex-col justify-between">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 rotate-12"><Wrench className="w-20 h-20" /></div>
                    <div>
                        <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Manutenção</p>
                        <h3 className="text-2xl font-bold text-text-main">{formatCurrency(relatorios.geral.totalManut)}</h3>
                    </div>
                    <div className="text-xs text-text-muted mt-2">
                      {((relatorios.geral.totalManut / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total
                    </div>
                  </Card>
                </div>

                {/* Ranking Top 5 */}
                <Card padding="none" className="border border-border">
                  <div className="p-6 border-b border-border bg-gray-50/50">
                    <h4 className="font-bold text-text-main flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded text-primary"><Activity className="w-4 h-4" /></div>
                      Top 5 Veículos (Maior Custo)
                    </h4>
                  </div>
                  <div className="divide-y divide-border">
                    {relatorios.cpk.slice(0, 5).map((v: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-sm font-bold text-gray-600">{idx + 1}</span>
                          <div>
                            <p className="font-bold text-text-main text-sm flex items-center gap-2">
                                {v.placa} <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-normal">{v.modelo}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-main text-sm">{formatCurrency(v.totalGeral)}</p>
                          <p className="text-xs text-text-muted">CPK: {formatCurrency(v.cpk)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ABA CPK */}
            {abaAtiva === 'CPK' && (
              <Card padding="none" className="overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-text-secondary font-bold border-b border-border text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Veículo</th>
                        <th className="px-6 py-4 text-right">KM Rodado</th>
                        <th className="px-6 py-4 text-right">Custo Total</th>
                        <th className="px-6 py-4 text-right bg-primary/5 text-primary border-l border-border">CPK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {relatorios.cpk.map((v: any) => (
                        <tr key={v.placa} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-text-main">
                            <div className="flex flex-col"><span>{v.placa}</span><span className="text-xs text-text-muted font-normal">{v.modelo}</span></div>
                          </td>
                          <td className="px-6 py-4 text-right text-text-secondary font-mono">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                          <td className="px-6 py-4 text-right font-medium text-text-main font-mono">{formatCurrency(v.totalGeral)}</td>
                          <td className={cn("px-6 py-4 text-right font-bold font-mono border-l border-border", v.cpk > 2.5 ? "text-red-600 bg-red-50/50" : "text-primary bg-primary/5")}>
                            {formatCurrency(v.cpk)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 text-xs text-text-muted border-t border-border flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  O KM Rodado é estimado pela diferença entre o maior e menor odômetro registrados no mês.
                </div>
              </Card>
            )}

            {/* ABA COMBUSTIVEL */}
            {abaAtiva === 'COMBUSTIVEL' && (
              <Card padding="none" className="overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-text-secondary font-bold border-b border-border text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Veículo</th>
                        <th className="px-6 py-4 text-right">Litros Abastecidos</th>
                        <th className="px-6 py-4 text-right">Gasto ($)</th>
                        <th className="px-6 py-4 text-right bg-amber-50 text-amber-700 border-l border-border">Média (KM/L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {relatorios.cpk.map((v: any) => (
                        <tr key={v.placa} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-text-main">{v.placa}</td>
                          <td className="px-6 py-4 text-right text-text-secondary font-mono">{v.litros.toFixed(1)} L</td>
                          <td className="px-6 py-4 text-right font-medium text-text-main font-mono">{formatCurrency(v.custoComb)}</td>
                          <td className="px-6 py-4 text-right font-bold text-amber-600 font-mono border-l border-border bg-amber-50/30">
                            {v.mediaKmLi > 0 ? v.mediaKmLi.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ABA MANUTENCAO */}
            {abaAtiva === 'MANUTENCAO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h4 className="font-bold text-text-main mb-6 flex items-center gap-2 pb-4 border-b border-border">
                    <Wrench className="w-5 h-5 text-text-muted" /> Preventiva vs Corretiva
                  </h4>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-secondary font-medium">Preventiva (Ideal)</span>
                        <span className="text-text-main font-bold">{formatCurrency(relatorios.manutencao.preventiva)}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(relatorios.manutencao.preventiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-secondary font-medium">Corretiva (Quebras)</span>
                        <span className="text-text-main font-bold">{formatCurrency(relatorios.manutencao.corretiva)}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(relatorios.manutencao.corretiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 leading-relaxed flex gap-3">
                      <div className="p-1 bg-amber-100 rounded-full h-fit"><AlertTriangle className="w-4 h-4 text-amber-600"/></div>
                      <div>
                        <strong>Dica de Gestão:</strong> O ideal é que a manutenção corretiva (emergencial) não ultrapasse 30% do custo total de manutenção.
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