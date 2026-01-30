import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { X, TrendingUp, Fuel, Wrench, BarChart3, PieChart, Activity } from 'lucide-react';
import type { Veiculo, Abastecimento, OrdemServico } from '../types';

interface RelatorioFinanceiroProps {
  onClose: () => void;
  veiculos: Veiculo[];
}

// Subcomponente de Tab (Aba) Modernizado
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${active
      ? 'border-primary text-primary'
      : 'border-transparent text-text-secondary hover:text-text-main hover:border-border'
      }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-text-muted'}`} />
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

  // Buscar dados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mesAno, mesNum] = mesFiltro.split('-');
        const dataInicio = `${mesFiltro}-01`;
        const dataFim = new Date(Number(mesAno), Number(mesNum), 0).toISOString().slice(0, 10);

        const [resAbast, resManut] = await Promise.all([
          api.get<Abastecimento[]>('/abastecimentos/recentes', { params: { dataInicio, dataFim, limit: 'all' } }),
          // [CORREÇÃO CRÍTICA]: A rota correta é /manutencoes/recentes, não /ordens-servico/recentes
          api.get<OrdemServico[]>('/manutencoes/recentes', { params: { dataInicio, dataFim, limit: 'all' } })
        ]);

        setDadosRaw({
          abastecimentos: resAbast.data,
          manutencoes: resManut.data
        });
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados financeiros.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mesFiltro]);

  // --- CÁLCULOS (useMemo) ---
  const relatorios = useMemo(() => {
    const { abastecimentos, manutencoes } = dadosRaw;

    // 1. Totais Gerais
    const totalAbastecimento = abastecimentos.reduce((acc, i) => acc + Number(i.custoTotal), 0);
    const totalManut = manutencoes.reduce((acc, i) => acc + Number(i.custoTotal), 0);

    // 2. Análise por Veículo (CPK)
    const veiculoStats: Record<string, any> = {};

    // Inicializa estrutura
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

    // Popula com Abastecimentos
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

    // Popula com Manutenções
    manutencoes.forEach(m => {
      if (m.veiculoId && veiculoStats[m.veiculoId]) {
        veiculoStats[m.veiculoId].custoManut += Number(m.custoTotal);
      }
    });

    // Calcula Métricas Finais
    const listaCPK = Object.values(veiculoStats).map((v: any) => {
      let kmRodado = v.maxKm - v.minKm;
      if (kmRodado < 0 || v.minKm === Infinity || v.maxKm === 0) kmRodado = 0;

      const totalGeral = v.custoComb + v.custoManut;
      const cpk = kmRodado > 0 ? totalGeral / kmRodado : 0;
      const mediaKmLi = (v.litros > 0 && kmRodado > 0) ? kmRodado / v.litros : 0;

      return { ...v, kmRodado, cpk, mediaKmLi, totalGeral };
    }).sort((a, b) => b.totalGeral - a.totalGeral);

    // 3. Manutenção (Preventiva vs Corretiva)
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

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Container Principal com Estilo Moderno */}
      <div className="bg-background w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-float animate-in zoom-in-95 flex flex-col border border-border">

        {/* HEADER FIXO */}
        <div className="bg-surface px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-center sticky top-0 z-20 gap-3 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Inteligência Financeira
            </h2>
            <p className="text-sm text-text-secondary">Análise estratégica de custos da frota</p>
          </div>
          <div className="flex gap-3">
            <input
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="border border-input rounded-lg px-3 py-1.5 text-sm bg-surface text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={onClose}
              className="p-2 bg-surface hover:bg-surface-hover border border-border rounded-full text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ABAS */}
        <div className="bg-surface border-b border-border sticky top-[76px] z-10 w-full px-6 pt-2 overflow-x-auto custom-scrollbar">
          <div className="flex gap-6 min-w-max">
            <TabButton
              active={abaAtiva === 'GERAL'}
              onClick={() => setAbaAtiva('GERAL')}
              icon={PieChart}
              label="Visão Macro"
            />
            <TabButton
              active={abaAtiva === 'CPK'}
              onClick={() => setAbaAtiva('CPK')}
              icon={BarChart3}
              label="Custo por KM (CPK)"
            />
            <TabButton
              active={abaAtiva === 'COMBUSTIVEL'}
              onClick={() => setAbaAtiva('COMBUSTIVEL')}
              icon={Fuel}
              label="Auditoria Combustível"
            />
            <TabButton
              active={abaAtiva === 'MANUTENCAO'}
              onClick={() => setAbaAtiva('MANUTENCAO')}
              icon={Wrench}
              label="DRE Manutenção"
            />
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary mb-4"></div>
              <p className="text-text-muted font-medium">Processando indicadores...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* --- ABA 1: GERAL --- */}
              {abaAtiva === 'GERAL' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
                      <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Total Gasto</p>
                      <h3 className="text-3xl font-bold text-text-main">{formatMoney(relatorios.geral.total)}</h3>
                    </div>
                    <div className="bg-surface p-6 rounded-xl border border-border shadow-card relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Fuel className="w-16 h-16" /></div>
                      <p className="text-warning-600 text-xs font-bold uppercase tracking-wider mb-1">Combustível</p>
                      <h3 className="text-2xl font-bold text-text-main">{formatMoney(relatorios.geral.totalAbastecimento)}</h3>
                      <p className="text-xs text-text-muted mt-1">
                        {((relatorios.geral.totalAbastecimento / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                    <div className="bg-surface p-6 rounded-xl border border-border shadow-card relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wrench className="w-16 h-16" /></div>
                      <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Manutenção</p>
                      <h3 className="text-2xl font-bold text-text-main">{formatMoney(relatorios.geral.totalManut)}</h3>
                      <p className="text-xs text-text-muted mt-1">
                        {((relatorios.geral.totalManut / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
                    <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" /> Top 5 Veículos (Maior Custo)
                    </h4>
                    <div className="space-y-3">
                      {relatorios.cpk.slice(0, 5).map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded-full text-xs font-bold text-primary">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-text-main text-sm">{v.placa}</p>
                              <p className="text-xs text-text-secondary">{v.modelo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-text-main text-sm">{formatMoney(v.totalGeral)}</p>
                            <p className="text-xs text-text-muted">CPK: {formatMoney(v.cpk)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- ABA 2: CPK --- */}
              {abaAtiva === 'CPK' && (
                <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-surface-hover text-text-secondary font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Veículo</th>
                          <th className="px-4 py-3 text-right">KM Rodado (Est.)</th>
                          <th className="px-4 py-3 text-right">Custo Total</th>
                          <th className="px-4 py-3 text-right bg-primary/5 text-primary">CPK (R$/KM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {relatorios.cpk.map((v: any) => (
                          <tr key={v.placa} className="hover:bg-surface-hover transition-colors">
                            <td className="px-4 py-3 font-medium text-text-main">
                              {v.placa} <span className="text-text-muted font-normal">- {v.modelo}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-text-secondary">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                            <td className="px-4 py-3 text-right font-medium text-text-main">{formatMoney(v.totalGeral)}</td>
                            <td className={`px-4 py-3 text-right font-bold ${v.cpk > 2.5 ? 'text-error' : 'text-primary'}`}>
                              {formatMoney(v.cpk)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-background text-xs text-text-muted border-t border-border">
                    * O KM Rodado é estimado pela diferença entre o maior e menor odômetro registrados no mês.
                  </div>
                </div>
              )}

              {/* --- ABA 3: COMBUSTÍVEL --- */}
              {abaAtiva === 'COMBUSTIVEL' && (
                <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-surface-hover text-text-secondary font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Veículo</th>
                          <th className="px-4 py-3 text-right">Litros</th>
                          <th className="px-4 py-3 text-right">Gasto ($)</th>
                          <th className="px-4 py-3 text-right bg-warning/5 text-warning-700">Média (KM/L)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {relatorios.cpk.map((v: any) => (
                          <tr key={v.placa} className="hover:bg-surface-hover transition-colors">
                            <td className="px-4 py-3 font-medium text-text-main">{v.placa}</td>
                            <td className="px-4 py-3 text-right text-text-secondary">{v.litros.toFixed(1)} L</td>
                            <td className="px-4 py-3 text-right font-medium text-text-main">{formatMoney(v.custoComb)}</td>
                            <td className="px-4 py-3 text-right font-bold text-warning-600">
                              {v.mediaKmLi > 0 ? v.mediaKmLi.toFixed(2) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- ABA 4: MANUTENÇÃO --- */}
              {abaAtiva === 'MANUTENCAO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
                    <h4 className="font-bold text-text-main mb-6 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-text-muted" /> Preventiva vs Corretiva
                    </h4>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-text-secondary font-medium">Preventiva (Ideal)</span>
                          <span className="text-text-main font-bold">{formatMoney(relatorios.manutencao.preventiva)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${(relatorios.manutencao.preventiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-text-secondary font-medium">Corretiva (Quebras)</span>
                          <span className="text-text-main font-bold">{formatMoney(relatorios.manutencao.corretiva)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
                          <div
                            className="h-full bg-error rounded-full transition-all duration-1000"
                            style={{ width: `${(relatorios.manutencao.corretiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-warning/10 rounded-lg border border-warning/20 text-xs text-warning-700 leading-relaxed">
                      <strong>Dica de Gestão:</strong> O ideal é que a manutenção corretiva (emergencial) não ultrapasse 30% do custo total de manutenção.
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}