import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';

// Tipos
interface KpiProps {
  titulo: string;
  valor: string;
  descricao: string;
  icon?: React.ReactNode; // Adicionado suporte a ícone
  corBorda?: string; // Adicionado suporte a cor da borda lateral
}

interface DashboardRelatoriosProps {
  token: string;
  veiculos: any[];
}

interface KpiData {
  custoTotalGeral: number;
  custoTotalCombustivel: number;
  custoTotalAditivo: number;
  custoTotalManutencao: number;
  kmTotalRodado: number;
  litrosTotaisConsumidos: number;
  consumoMedioKML: number;
  custoMedioPorKM: number;
}

// Sub-Componente: Card de KPI Melhorado
function KpiCard({ titulo, valor, descricao, icon, corBorda = "border-primary" }: KpiProps) {
  return (
    <div className={`bg-white shadow-sm rounded-card p-5 border-l-4 ${corBorda} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start">
        <div>
           <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{titulo}</h3>
           <p className="text-2xl font-bold text-text">{valor}</p>
        </div>
        {icon && <div className="p-2 bg-gray-50 rounded-full text-text-secondary">{icon}</div>}
      </div>
      <p className="mt-2 text-xs text-text-secondary">{descricao}</p>
    </div>
  );
}

// Componente Principal
export function DashboardRelatorios({ token, veiculos }: DashboardRelatoriosProps) {
  
  // 1. Estados para os filtros
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(''); // '' significa "Frota Inteira"
  
  // 2. Estados para os dados
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Efeito que busca os dados na API
  useEffect(() => {
    const carregarSumario = async () => {
      setLoading(true);
      setError('');
      try {
        const api = axios.create({
          baseURL: RENDER_API_BASE_URL,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const params: any = {
          ano,
          mes
        };
        if (veiculoIdFiltro) {
          params.veiculoId = veiculoIdFiltro;
        }
        
        const response = await api.get('/relatorio/sumario', { params });
        setKpis(response.data.kpis);

      } catch (err) {
        console.error("Erro ao buscar sumário:", err);
        setError('Falha ao carregar relatórios.');
      } finally {
        setLoading(false);
      }
    };

    carregarSumario();
  }, [token, ano, mes, veiculoIdFiltro]);

  // 4. Funções de Formatação
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatKm = (value: number) => `${value.toFixed(0)} KM`;
  const formatKML = (value: number) => `${value.toFixed(2).replace('.', ',')} KM/L`;
  const formatRperKM = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')} /KM`;

  // 5. Opções dos Filtros
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
    if (!kpis) {
      alert("Nenhum dado de KPI para exportar.");
      return;
    }
    
    const nomeMes = mesesOptions.find(m => m.v === mes)?.n || 'Mes';

    try {
      const dadosFormatados = [
        { KPI: 'Custo Total (Geral)', Valor: formatCurrency(kpis.custoTotalGeral) },
        { KPI: 'KM Total Rodado', Valor: formatKm(kpis.kmTotalRodado) },
        { KPI: 'Custo Médio por KM', Valor: formatRperKM(kpis.custoMedioPorKM) },
        { KPI: 'Consumo Médio (KM/L)', Valor: formatKML(kpis.consumoMedioKML) },
        { KPI: 'Custo (Combustível)', Valor: formatCurrency(kpis.custoTotalCombustivel) },
        { KPI: 'Custo (Aditivos)', Valor: formatCurrency(kpis.custoTotalAditivo) },
        { KPI: 'Custo (Manutenção)', Valor: formatCurrency(kpis.custoTotalManutencao) },
      ];
      
      exportarParaExcel(dadosFormatados, `KPIs_Frota_${nomeMes}_${ano}.xlsx`);

    } catch (err) {
      alert('Ocorreu um erro ao preparar os dados para exportação.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filtros de Data e Veículo */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end justify-between">
        
        <div className="flex flex-wrap gap-4 items-end w-full md:w-auto">
          {/* Select Mês */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">Mês</label>
            <div className="relative">
                <select 
                  className="appearance-none shadow-sm border border-gray-300 rounded-input w-full py-2 px-3 text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 bg-white"
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                >
                  {mesesOptions.map(m => (
                    <option key={m.v} value={m.v}>{m.n}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
          </div>

           {/* Select Ano */}
           <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">Ano</label>
             <div className="relative">
                <select 
                  className="appearance-none shadow-sm border border-gray-300 rounded-input w-full py-2 px-3 text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 bg-white"
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                >
                   {anosOptions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
          </div>
          
          {/* Select Veículo */}
          <div className="flex-grow min-w-[200px]">
            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">Veículo</label>
             <div className="relative">
                <select 
                  className="appearance-none shadow-sm border border-gray-300 rounded-input w-full py-2 px-3 text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 bg-white"
                  value={veiculoIdFiltro}
                  onChange={(e) => setVeiculoIdFiltro(e.target.value)}
                >
                  <option value="">-- Frota Inteira --</option>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
          </div>
        </div>

        {/* Botão de Exportar */}
        <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
           <Button
              variant="success"
              onClick={handleExportar}
              disabled={!kpis || loading}
              className="w-full md:w-auto"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Exportar KPIs
            </Button>
        </div>
      </div>

      {/* Conteúdo (Loading, Erro ou KPIs) */}
      {loading && (
         <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-text-secondary">A calcular indicadores...</p>
         </div>
      )}
      
      {error && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200">{error}</p>}

      {kpis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* GRUPO 1: GERAL E OPERACIONAL */}
          <KpiCard 
            titulo="Custo Total (Geral)"
            valor={formatCurrency(kpis.custoTotalGeral)}
            descricao="Combustível + Aditivos + Manutenção"
            corBorda="border-primary"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
          />
          <KpiCard 
            titulo="KM Total Rodado"
            valor={formatKm(kpis.kmTotalRodado)}
            descricao="Distância percorrida no período"
            corBorda="border-blue-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>}
          />
          <KpiCard 
            titulo="Custo Médio por KM"
            valor={formatRperKM(kpis.custoMedioPorKM)}
            descricao="Eficiência de custo operacional"
            corBorda="border-indigo-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>}
          />
          <KpiCard 
            titulo="Consumo Médio"
            valor={formatKML(kpis.consumoMedioKML)}
            descricao="Eficiência de combustível"
            corBorda="border-green-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>}
          />
          
          {/* GRUPO 2: DETALHAMENTO DE CUSTOS */}
           <KpiCard 
            titulo="Total em Combustível"
            valor={formatCurrency(kpis.custoTotalCombustivel)}
            descricao="Diesel, Gasolina, Etanol, etc."
            corBorda="border-orange-400"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" /></svg>}
          />
           <KpiCard 
            titulo="Total em Aditivos"
            valor={formatCurrency(kpis.custoTotalAditivo)}
            descricao="Arla 32 e outros complementos"
            corBorda="border-cyan-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>}
          />
           <KpiCard 
            titulo="Total em Manutenção"
            valor={formatCurrency(kpis.custoTotalManutencao)}
            descricao="Peças, serviços e lavagens"
            corBorda="border-red-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" /></svg>}
          />
        </div>
      )}
    </div>
  );
}