import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Veiculo, Abastecimento, OrdemServico } from '../types';

interface RelatorioFinanceiroProps {
  onClose: () => void;
  veiculos: Veiculo[];
}

export function ModalRelatorioFinanceiro({ onClose, veiculos }: RelatorioFinanceiroProps) {

  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(false);

  // Estado tipado corretamente
  const [dadosRaw, setDadosRaw] = useState<{
    abastecimentos: Abastecimento[],
    manutencoes: OrdemServico[]
  }>({ abastecimentos: [], manutencoes: [] });

  const [abaAtiva, setAbaAtiva] = useState<'GERAL' | 'CPK' | 'COMBUSTIVEL' | 'MANUTENCAO'>('GERAL');

  // Buscar dados completos do mês (limit=all)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mesAno, mesNum] = mesFiltro.split('-');
        const dataInicio = `${mesFiltro}-01`;
        // Pega o último dia do mês
        const dataFim = new Date(Number(mesAno), Number(mesNum), 0).toISOString().slice(0, 10);

        // Dispara requisições paralelas
        const [resAbast, resManut] = await Promise.all([
          api.get<Abastecimento[]>('/abastecimentos/recentes', { params: { dataInicio, dataFim, limit: 'all' } }),
          api.get<OrdemServico[]>('/ordens-servicos/recentes', { params: { dataInicio, dataFim, limit: 'all' } })
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

  // --- O CÉREBRO: Processamento dos Dados ---
  const relatorios = useMemo(() => {
    const { abastecimentos, manutencoes } = dadosRaw;

    // 1. Resumo Geral
    const totalAbastecimento = abastecimentos.reduce((acc, i) => acc + Number(i.custoTotal), 0);
    const totalManut = manutencoes.reduce((acc, i) => acc + Number(i.custoTotal), 0);

    // 2. CPK (Custo por KM) - Estrutura base
    const veiculoStats: Record<string, any> = {};

    // Inicializa o mapa com todos os veículos ativos
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

    // Processa Abastecimentos (Combustível + Aditivo)
    abastecimentos.forEach(a => {
      // Como atualizamos o types.ts, agora o TS sabe que 'veiculoId' existe na raiz!
      if (a.veiculoId && veiculoStats[a.veiculoId]) {
        veiculoStats[a.veiculoId].custoComb += Number(a.custoTotal);

        const litros = a.itens.reduce((acc, item) =>
          item.produto.tipo === 'COMBUSTIVEL' ? acc + Number(item.quantidade) : acc, 0);

        veiculoStats[a.veiculoId].litros += litros;

        // Atualiza range de KM para cálculo de rodagem
        if (a.kmOdometro > 0) {
          if (a.kmOdometro < veiculoStats[a.veiculoId].minKm) veiculoStats[a.veiculoId].minKm = a.kmOdometro;
          if (a.kmOdometro > veiculoStats[a.veiculoId].maxKm) veiculoStats[a.veiculoId].maxKm = a.kmOdometro;
        }
      }
    });

    // Processa Manutenções
    manutencoes.forEach(m => {
      // m.veiculoId pode ser null (manutenção de equipamento)
      if (m.veiculoId && veiculoStats[m.veiculoId]) {
        veiculoStats[m.veiculoId].custoManut += Number(m.custoTotal);
      }
    });

    // Calcula CPK e Médias Finais
    const listaCPK = Object.values(veiculoStats).map((v: any) => {
      let kmRodado = v.maxKm - v.minKm;

      // Se só teve 1 abastecimento ou dados inconsistentes, kmRodado = 0
      if (kmRodado < 0 || v.minKm === Infinity || v.maxKm === 0) kmRodado = 0;

      // Evita divisão por zero
      const cpk = kmRodado > 0 ? (v.custoComb + v.custoManut) / kmRodado : 0;
      const mediaKmLi = (v.litros > 0 && kmRodado > 0) ? kmRodado / v.litros : 0;

      return { ...v, kmRodado, cpk, mediaKmLi, totalGeral: v.custoComb + v.custoManut };
    }).sort((a, b) => b.totalGeral - a.totalGeral); // Ordena por maior custo total

    // 3. Breakdown de Manutenção
    let manutCorretiva = 0;
    let manutPreventiva = 0;

    manutencoes.forEach(m => {
      const custo = Number(m.custoTotal);
      if (m.tipo === 'CORRETIVA') {
        manutCorretiva += custo;
      } else {
        // Agrupa Preventiva e Lavagem
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in zoom-in-95 flex flex-col">

        {/* HEADER */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-10 gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📊 Inteligência Financeira
            </h2>
            <p className="text-sm text-gray-500">Análise estratégica de custos da frota</p>
          </div>
          <div className="flex gap-3">
            <input
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
            />
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">✕</button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10 w-full">
          <div className="flex px-6 pt-2 pb-0 gap-6 overflow-x-auto custom-scrollbar w-full">
            {['GERAL', 'CPK', 'COMBUSTIVEL', 'MANUTENCAO'].map(aba => (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba as any)}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${abaAtiva === aba
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {aba === 'GERAL' && 'Visão Macro'}
                {aba === 'CPK' && 'Custo por KM (CPK)'}
                {aba === 'COMBUSTIVEL' && 'Auditoria Combustível'}
                {aba === 'MANUTENCAO' && 'DRE Manutenção'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mx-auto mb-4"></div><p>Processando indicadores...</p></div>
          ) : (
            <>
              {/* --- ABA 1: GERAL --- */}
              {abaAtiva === 'GERAL' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 text-sm font-bold uppercase">Total Gasto</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(relatorios.geral.total)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-orange-500 text-sm font-bold uppercase">Combustível</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(relatorios.geral.totalAbastecimento)}</h3>
                      <p className="text-xs text-gray-400 mt-1">{((relatorios.geral.totalAbastecimento / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-blue-500 text-sm font-bold uppercase">Manutenção</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(relatorios.geral.totalManut)}</h3>
                      <p className="text-xs text-gray-400 mt-1">{((relatorios.geral.totalManut / (relatorios.geral.total || 1)) * 100).toFixed(1)}% do total</p>
                    </div>
                  </div>

                  {/* Ranking Top 5 */}
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4">Top 5 Veículos com Maior Custo Total</h4>
                    <div className="space-y-3">
                      {relatorios.cpk.slice(0, 5).map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-bold text-gray-600">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-gray-900">{v.placa}</p>
                              <p className="text-xs text-gray-500">{v.modelo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatMoney(v.totalGeral)}</p>
                            <p className="text-xs text-gray-500">CPK: {formatMoney(v.cpk)}/km</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- ABA 2: CPK --- */}
              {abaAtiva === 'CPK' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3">Veículo</th>
                          <th className="px-4 py-3 text-right">KM Rodado (Est.)</th>
                          <th className="px-4 py-3 text-right">Custo Total</th>
                          <th className="px-4 py-3 text-right bg-blue-50/50 text-blue-700">CPK (R$/KM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {relatorios.cpk.map((v: any) => (
                          <tr key={v.placa} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">
                              {v.placa} <span className="text-gray-400 font-normal">- {v.modelo}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                            <td className="px-4 py-3 text-right font-medium">{formatMoney(v.totalGeral)}</td>
                            <td className={`px-4 py-3 text-right font-bold ${v.cpk > 2.5 ? 'text-red-600' : 'text-blue-600'}`}>
                              {formatMoney(v.cpk)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 text-xs text-gray-500">
                    * O KM Rodado é estimado pela diferença entre o maior e menor odômetro registrado nos abastecimentos do mês.
                  </div>
                </div>
              )}

              {/* --- ABA 3: COMBUSTÍVEL --- */}
              {abaAtiva === 'COMBUSTIVEL' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3">Veículo</th>
                          <th className="px-4 py-3 text-right">Litros Totais</th>
                          <th className="px-4 py-3 text-right">Gasto Comb.</th>
                          <th className="px-4 py-3 text-right bg-orange-50 text-orange-700">Média (KM/L)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {relatorios.cpk.map((v: any) => (
                          <tr key={v.placa} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{v.placa}</td>
                            <td className="px-4 py-3 text-right">{v.litros.toFixed(1)} L</td>
                            <td className="px-4 py-3 text-right">{formatMoney(v.custoComb)}</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600">
                              {v.mediaKmLi > 0 ? v.mediaKmLi.toFixed(2) + ' km/l' : '-'}
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
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-6">Preventiva vs Corretiva</h4>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 font-medium">Preventiva (Ideal)</span>
                            <span className="text-gray-900 font-bold">{formatMoney(relatorios.manutencao.preventiva)}</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(relatorios.manutencao.preventiva / (relatorios.geral.totalManut || 1)) * 100}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 font-medium">Corretiva (Quebras)</span>
                            <span className="text-gray-900 font-bold">{formatMoney(relatorios.manutencao.corretiva)}</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${(relatorios.manutencao.corretiva / (relatorios.geral.totalManut || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-xs text-yellow-800">
                        <strong>Meta:</strong> Tente manter a Corretiva abaixo de 30% do custo total de manutenção.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}