import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
// Importação dos tipos (Tipagem estrita)
import type { Veiculo, KpiData } from '../types';

interface DashboardRelatoriosProps {
  token: string; // Mantido para compatibilidade, embora o axios trate
  veiculos: Veiculo[];
}

// === DESIGN DO CARD KPI ===
function KpiCard({ titulo, valor, descricao, corIcone, iconSvg }: {
  titulo: string,
  valor: string,
  descricao: string,
  corIcone: string,
  iconSvg: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-card p-6 shadow-card border border-gray-100 flex items-start gap-4 transition-transform hover:-translate-y-1 hover:shadow-card-hover">
      <div className={`p-3 rounded-xl ${corIcone} flex-shrink-0`}>
        {iconSvg}
      </div>
      <div>
        <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1">
          {titulo}
        </p>
        <h3 className="text-2xl font-bold text-text tracking-tight">
          {valor}
        </h3>
        <p className="text-xs text-gray-400 mt-1 font-medium">
          {descricao}
        </p>
      </div>
    </div>
  );
}

const selectStyle = "w-full appearance-none bg-gray-50 border border-gray-200 text-text py-2.5 px-4 pr-8 rounded-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium cursor-pointer";
const labelStyle = "block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide";

export function DashboardRelatorios({ veiculos }: DashboardRelatoriosProps) {

  // Estados
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Efeito de Carregamento
  useEffect(() => {
    const carregarSumario = async () => {
      setLoading(true);
      setError('');
      try {
        // Tipagem dos parâmetros da requisição
        const params: Record<string, string | number> = { ano, mes };
        if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;

        const response = await api.get('/relatorio/sumario', { params });

        // O backend retorna { filtros: {...}, kpis: {...} }
        // Garantimos que estamos a pegar a parte 'kpis' com a tipagem correta
        setKpis(response.data.kpis as KpiData);

      } catch (err) {
        console.error("Erro ao carregar KPIs:", err);
        setError('Falha ao carregar relatórios.');
      } finally {
        setLoading(false);
      }
    };
    carregarSumario();
  }, [ano, mes, veiculoIdFiltro]);

  // Formatadores
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatKm = (value: number) => `${value.toFixed(0)} km`;
  const formatKML = (value: number) => `${value.toFixed(2).replace('.', ',')} km/l`;
  const formatRperKM = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')} /km`;

  const mesesOptions = [
    { v: 1, n: 'Janeiro' }, { v: 2, n: 'Fevereiro' }, { v: 3, n: 'Março' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Maio' }, { v: 6, n: 'Junho' },
    { v: 7, n: 'Julho' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Setembro' },
    { v: 10, n: 'Outubro' }, { v: 11, n: 'Novembro' }, { v: 12, n: 'Dezembro' },
  ];

  const anosOptions = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const handleExportar = () => {
    if (!kpis) return;
    try {
      const nomeMes = mesesOptions.find(m => m.v === mes)?.n || 'Mes';
      const dadosFormatados = [
        { KPI: 'Custo Total (Geral)', Valor: formatCurrency(kpis.custoTotalGeral) },
        { KPI: 'KM Total Rodado', Valor: formatKm(kpis.kmTotalRodado) },
        { KPI: 'Custo Médio por KM', Valor: formatRperKM(kpis.custoMedioPorKM) },
        { KPI: 'Consumo Médio', Valor: formatKML(kpis.consumoMedioKML) },
        { KPI: 'Combustível', Valor: formatCurrency(kpis.custoTotalCombustivel) },
        { KPI: 'Aditivos', Valor: formatCurrency(kpis.custoTotalAditivo) },
        { KPI: 'Manutenção', Valor: formatCurrency(kpis.custoTotalManutencao) },
      ];
      exportarParaExcel(dadosFormatados, `KPIs_${nomeMes}_${ano}.xlsx`);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">

      {/* BARRA DE FILTROS */}
      <div className="flex flex-wrap gap-4 p-5 bg-white rounded-card shadow-sm border border-gray-100 items-end justify-between">
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">

          {/* Mês */}
          <div className="w-full sm:w-40">
            <label className={labelStyle}>Mês</label>
            <div className="relative">
              <select className={selectStyle} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {mesesOptions.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          {/* Ano */}
          <div className="w-full sm:w-32">
            <label className={labelStyle}>Ano</label>
            <div className="relative">
              <select className={selectStyle} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
                {anosOptions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          {/* Veículo */}
          <div className="w-full sm:w-64">
            <label className={labelStyle}>Veículo</label>
            <div className="relative">
              <select className={selectStyle} value={veiculoIdFiltro} onChange={(e) => setVeiculoIdFiltro(e.target.value)}>
                <option value="">Todas as Viaturas</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>
        </div>

        {/* Exportar */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <Button
            variant="success"
            onClick={handleExportar}
            disabled={!kpis || loading}
            className="w-full lg:w-auto"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            }
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* LOADING & ERROS */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary font-medium">A calcular indicadores...</p>
        </div>
      )}

      {error && <p className="text-center text-error bg-red-50 p-3 rounded-lg border border-red-100 font-medium">{error}</p>}

      {/* GRID DE KPIS */}
      {kpis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            titulo="Custo Total"
            valor={formatCurrency(kpis.custoTotalGeral)}
            descricao="Operação Global"
            corIcone="bg-blue-50 text-blue-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
          />
          <KpiCard
            titulo="Quilometragem"
            valor={formatKm(kpis.kmTotalRodado)}
            descricao="Percorrido no período"
            corIcone="bg-indigo-50 text-indigo-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /></svg>}
          />
          <KpiCard
            titulo="Custo por KM"
            valor={formatRperKM(kpis.custoMedioPorKM)}
            descricao="Eficiência Financeira"
            corIcone="bg-emerald-50 text-emerald-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>}
          />
          <KpiCard
            titulo="Consumo Médio"
            valor={formatKML(kpis.consumoMedioKML)}
            descricao="Eficiência de Combustível"
            corIcone="bg-orange-50 text-orange-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>}
          />
          <KpiCard
            titulo="Total Combustível"
            valor={formatCurrency(kpis.custoTotalCombustivel)}
            descricao="Diesel, Gasolina, etc."
            corIcone="bg-amber-50 text-amber-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" /></svg>}
          />
          <KpiCard
            titulo="Total Aditivos"
            valor={formatCurrency(kpis.custoTotalAditivo)}
            descricao="Arla 32, etc."
            corIcone="bg-cyan-50 text-cyan-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>}
          />
          <KpiCard
            titulo="Total Manutenção"
            valor={formatCurrency(kpis.custoTotalManutencao)}
            descricao="Peças, Serviços e Lavagens"
            corIcone="bg-rose-50 text-rose-600"
            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" /></svg>}
          />
        </div>
      )}
    </div>
  );
}