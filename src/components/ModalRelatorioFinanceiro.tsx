import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { X, TrendingUp, Fuel, Wrench, BarChart3, PieChart, Activity } from 'lucide-react'; // Ícones Lucide
import type { Veiculo, Abastecimento, OrdemServico } from '../types';

interface RelatorioFinanceiroProps {
  onClose: () => void;
  veiculos: Veiculo[];
}

// Subcomponente de Tab (Aba) para limpar o código principal
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${active
      ? 'border-primary text-primary'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
      }`}
  >
    <Icon className="w-4 h-4" />
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
          api.get<OrdemServico[]>('/ordens-servico/recentes', { params: { dataInicio, dataFim, limit: 'all' } })
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

        const litros = a.itens.reduce((acc, item) =>
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
      <div className="bg-gray-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col">

        {/* HEADER FIXO */}
        <div className="bg-white px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-center sticky top-0 z-20 gap-3 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Inteligência Financeira
            </h2>
            <p className="text-sm text-gray-500">Análise estratégica de custos da frota</p>
          </div>
          <div className="flex gap-3">
            <input
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ABAS */}
        <div className="bg-white border-b border-border sticky top-[76px] z-10 w-full px-6 pt-2 overflow-x-auto custom-scrollbar">
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
              <p className="text-gray-500 font-medium">Processando indicadores...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* --- ABA 1: GERAL --- */}
              {abaAtiva === 'GERAL' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Gasto</p>
                      <h3 className="text-3xl font-bold text-gray-900">{formatMoney(relatorios.geral.total)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 p-4 opacity-5"><Fuel className="w-16 h-16" /></div>
                      <p className="text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">Combustível</p>
                      <h3 className="text-2xl font-bold text-gray-900">{formatMoney(relatorios.geral.totalAbastecimento)}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {((relatorios.geral.totalAbastecimento / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 p-4 opacity-5"><Wrench className="w-16 h-16" /></div>
                      <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Manutenção</p>
                      <h3 className="text-2xl font-bold text-gray-900">{formatMoney(relatorios.geral.totalManut)}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {((relatorios.geral.totalManut / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" /> Top 5 Veículos (Maior Custo)
                    </h4>
                    <div className="space-y-3">
                      {relatorios.cpk.slice(0, 5).map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-bold text-gray-600">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{v.placa}</p>
                              <p className="text-xs text-gray-500">{v.modelo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-sm">{formatMoney(v.totalGeral)}</p>
                            <p className="text-xs text-gray-500">CPK: {formatMoney(v.cpk)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- ABA 2: CPK --- */}
              {abaAtiva === 'CPK' && (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Veículo</th>
                          <th className="px-4 py-3 text-right">KM Rodado (Est.)</th>
                          <th className="px-4 py-3 text-right">Custo Total</th>
                          <th className="px-4 py-3 text-right bg-primary/5 text-primary">CPK (R$/KM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {relatorios.cpk.map((v: any) => (
                          <tr key={v.placa} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium">
                              {v.placa} <span className="text-gray-400 font-normal">- {v.modelo}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMoney(v.totalGeral)}</td>
                            <td className={`px-4 py-3 text-right font-bold ${v.cpk > 2.5 ? 'text-red-600' : 'text-primary'}`}>
                              {formatMoney(v.cpk)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 text-xs text-gray-500 border-t border-border">
                    * O KM Rodado é estimado pela diferença entre o maior e menor odômetro registrados no mês.
                  </div>
                </div>
              )}

              {/* --- ABA 3: COMBUSTÍVEL --- */}
              {abaAtiva === 'COMBUSTIVEL' && (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Veículo</th>
                          <th className="px-4 py-3 text-right">Litros</th>
                          <th className="px-4 py-3 text-right">Gasto ($)</th>
                          <th className="px-4 py-3 text-right bg-orange-50 text-orange-700">Média (KM/L)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {relatorios.cpk.map((v: any) => (
                          <tr key={v.placa} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium">{v.placa}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{v.litros.toFixed(1)} L</td>
                            <td className="px-4 py-3 text-right font-medium">{formatMoney(v.custoComb)}</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600">
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
                  <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-400" /> Preventiva vs Corretiva
                    </h4>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-600 font-medium">Preventiva (Ideal)</span>
                          <span className="text-gray-900 font-bold">{formatMoney(relatorios.manutencao.preventiva)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${(relatorios.manutencao.preventiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-600 font-medium">Corretiva (Quebras)</span>
                          <span className="text-gray-900 font-bold">{formatMoney(relatorios.manutencao.corretiva)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-1000"
                            style={{ width: `${(relatorios.manutencao.corretiva / (relatorios.geral.totalManut || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800 leading-relaxed">
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