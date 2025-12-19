import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import type { Veiculo, KpiData } from '../types';

interface DashboardRelatoriosProps {
  veiculos: Veiculo[];
  onDrillDown?: (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => void;
}

// --- COMPONENTE INTERNO: CARD KPI INDUSTRIAL ---
// Design focado em dados: removemos ícones decorativos para focar no valor e no status.
function KpiCard({
  titulo,
  valor,
  descricao,
  onClick,
  loading,
  variant = 'default'
}: {
  titulo: string,
  valor: string,
  descricao: string,
  onClick?: () => void,
  loading?: boolean,
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {

  if (loading) {
    return (
      <div className="bg-white rounded-xl h-[120px] p-5 shadow-sm border border-gray-100 animate-pulse flex flex-col justify-between">
        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
        <div className="h-3 bg-gray-50 rounded w-full"></div>
      </div>
    );
  }

  // Mapeamento de cores de borda baseadas no tema OKLCH definido no index.css
  const borderColors = {
    default: 'border-l-primary',       // Azul Marca
    success: 'border-l-status-success', // Verde
    warning: 'border-l-status-warning', // Âmbar
    danger: 'border-l-status-danger',   // Vermelho
    info: 'border-l-blue-400'           // Azul Claro
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white rounded-xl p-5 shadow-sm border border-gray-200 
        flex flex-col justify-between h-full min-h-[120px]
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer
        border-l-[4px] ${borderColors[variant] || borderColors.default}
      `}
    >
      {/* Cabeçalho: Título Técnico */}
      <div className="flex justify-between items-start">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">
          {titulo}
        </h4>
        {/* Ícone de seta sutil que aparece no hover */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </div>

      {/* Valor: Fonte Mono para precisão numérica */}
      <div className="mt-2">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-mono">
          {valor}
        </span>
      </div>

      {/* Rodapé: Contexto */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium truncate">
          {descricao}
        </p>
      </div>
    </div>
  );
}

// Estilos reutilizáveis para inputs
const selectStyle = "w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium cursor-pointer text-sm shadow-sm hover:border-gray-300 font-sans";
const labelStyle = "block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider pl-1 font-sans";

export function DashboardRelatorios({ veiculos, onDrillDown }: DashboardRelatoriosProps) {

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarSumario = async () => {
      setLoading(true);
      setError('');
      try {
        const params: Record<string, string | number> = { ano, mes };
        if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;

        const response = await api.get('/relatorio/sumario', { params });
        setKpis(response.data.kpis as KpiData);

      } catch (err) {
        console.error("Erro ao carregar KPIs:", err);
        setError('Não foi possível atualizar os indicadores.');
        toast.error("Falha ao carregar dados do dashboard.");
      } finally {
        // Pequeno delay para suavizar a transição do esqueleto
        setTimeout(() => setLoading(false), 300);
      }
    };
    carregarSumario();
  }, [ano, mes, veiculoIdFiltro]);

  // Formatadores (Usando toLocaleString para garantir padrão BR)
  const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatKm = (value: number) => `${value.toLocaleString('pt-BR')} km`;
  const formatKML = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatRperKM = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

    const promessaExportacao = new Promise((resolve, reject) => {
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
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promessaExportacao, {
      loading: 'Gerando planilha...',
      success: 'Relatório exportado com sucesso!',
      error: 'Erro ao exportar dados.'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER DE CONTROLE (Glassmorphism) */}
      <div className="bg-white/80 backdrop-blur-md p-1 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50/50 rounded-lg items-end justify-between">
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-end">
            {/* Filtro Mês */}
            <div className="w-full sm:w-40">
              <label className={labelStyle}>Mês</label>
              <div className="relative">
                <select className={selectStyle} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                  {mesesOptions.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Filtro Ano */}
            <div className="w-full sm:w-28">
              <label className={labelStyle}>Ano</label>
              <div className="relative">
                <select className={selectStyle} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
                  {anosOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Filtro Veículo */}
            <div className="w-full sm:w-64">
              <label className={labelStyle}>Veículo</label>
              <div className="relative">
                <select className={selectStyle} value={veiculoIdFiltro} onChange={(e) => setVeiculoIdFiltro(e.target.value)}>
                  <option value="">Todos da Frota</option>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Exportar */}
          <div className="w-full lg:w-auto">
            <Button
              variant="success"
              onClick={handleExportar}
              disabled={!kpis || loading}
              className="w-full shadow-sm"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Excel
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm font-medium flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          {error}
        </div>
      )}

      {/* --- BENTO GRID: LAYOUT INTELIGENTE --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* DESTAQUE: Custo Total (Ocupa 2 colunas em telas grandes) */}
        <div className="lg:col-span-2">
          <KpiCard
            loading={loading}
            titulo="Custo Total Operacional"
            valor={kpis ? formatCurrency(kpis.custoTotalGeral) : '-'}
            descricao="Soma de combustível, manutenções e insumos no período"
            onClick={() => onDrillDown?.('GERAL')}
            variant="default" // Cor da Marca
          />
        </div>

        {/* MÉTRICAS FÍSICAS */}
        <KpiCard
          loading={loading}
          titulo="Quilometragem"
          valor={kpis ? formatKm(kpis.kmTotalRodado) : '-'}
          descricao="Distância total percorrida pela frota"
          onClick={() => onDrillDown?.('JORNADA')}
          variant="info"
        />

        <KpiCard
          loading={loading}
          titulo="Média Consumo"
          valor={kpis ? formatKML(kpis.consumoMedioKML) + ' km/l' : '-'}
          descricao="Eficiência energética média"
          onClick={() => onDrillDown?.('ABASTECIMENTO')}
          variant="success"
        />

        {/* CUSTOS DETALHADOS */}
        <KpiCard
          loading={loading}
          titulo="Combustível"
          valor={kpis ? formatCurrency(kpis.custoTotalCombustivel) : '-'}
          descricao="Abastecimentos (Diesel, GNV, Gasolina)"
          onClick={() => onDrillDown?.('ABASTECIMENTO')}
          variant="default"
        />

        <KpiCard
          loading={loading}
          titulo="Manutenção"
          valor={kpis ? formatCurrency(kpis.custoTotalManutencao) : '-'}
          descricao="Peças, Serviços Mecânicos e Lavagens"
          onClick={() => onDrillDown?.('MANUTENCAO')}
          variant="warning" // Atenção para manutenção
        />

        <KpiCard
          loading={loading}
          titulo="Aditivos (Arla)"
          valor={kpis ? formatCurrency(kpis.custoTotalAditivo) : '-'}
          descricao="Arla 32 e Lubrificantes"
          onClick={() => onDrillDown?.('ABASTECIMENTO')}
          variant="info"
        />

        <KpiCard
          loading={loading}
          titulo="Custo por KM"
          valor={kpis ? formatRperKM(kpis.custoMedioPorKM) + '/km' : '-'}
          descricao="Indicador chave de eficiência financeira"
          onClick={() => onDrillDown?.('ABASTECIMENTO')}
          variant={kpis && kpis.custoMedioPorKM > 3.5 ? 'danger' : 'success'} // Condicional inteligente
        />
      </div>
    </div>
  );
}