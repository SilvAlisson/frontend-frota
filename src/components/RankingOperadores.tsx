import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface RankingProps { }

interface OperadorRanking {
  id: string;
  nome: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
  fotoUrl?: string; // Preparado para quando o backend enviar a foto
}

// Configuração visual do Pódio (Design Industrial)
const podiumConfig = [
  { 
    pos: 1, 
    label: 'Campeão de Eficiência',
    bg: 'bg-gradient-to-b from-yellow-50 to-white', 
    border: 'border-yellow-200', 
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '👑' 
  },
  { 
    pos: 2, 
    label: 'Excelente Desempenho',
    bg: 'bg-gradient-to-b from-slate-50 to-white', 
    border: 'border-slate-200', 
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: '🥈' 
  },
  { 
    pos: 3, 
    label: 'Alta Performance',
    bg: 'bg-gradient-to-b from-orange-50 to-white', 
    border: 'border-orange-200', 
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🥉' 
  }
];

export function RankingOperadores({ }: RankingProps) {

  // Filtros
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  // Dados
  const [ranking, setRanking] = useState<OperadorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Buscar Dados
  useEffect(() => {
    const carregarRanking = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/relatorios/ranking-operadores', {
          params: { ano, mes }
        });
        setRanking(response.data);
      } catch (err) {
        console.error("Erro ao buscar ranking:", err);
        setError('Falha ao carregar ranking de motoristas.');
        toast.error('Erro ao carregar dados.');
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    carregarRanking();
  }, [ano, mes]);

  // Formatadores Monoespaçados (Alinhamento Perfeito)
  const formatKm = (value: number) => value.toLocaleString('pt-BR');
  const formatLitros = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const formatKML = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    if (ranking.length === 0) return;
    const promessa = new Promise((resolve, reject) => {
      try {
        const nomeMes = mesesOptions.find(m => m.v === mes)?.n || 'Mes';
        const dados = ranking.map((op, i) => ({
          'Posição': `${i + 1}º`,
          'Motorista': op.nome,
          'Média (KM/L)': formatKML(op.kml),
          'KM Rodado': formatKm(op.totalKM),
          'Litros': formatLitros(op.totalLitros),
        }));
        exportarParaExcel(dados, `Ranking_${nomeMes}_${ano}.xlsx`);
        resolve(true);
      } catch (err) { reject(err); }
    });
    toast.promise(promessa, { loading: 'Exportando...', success: 'Ranking exportado!', error: 'Erro na exportação.' });
  };

  const maxKml = ranking.length > 0 ? Math.max(...ranking.map(r => r.kml)) : 1;
  const top3 = ranking.slice(0, 3);
  
  // Estilos de Input (Consistente com Dashboard)
  const selectStyle = "w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium cursor-pointer text-sm shadow-sm hover:border-gray-300 font-sans";
  const labelStyle = "block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider pl-1 font-sans";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* HEADER DE COMANDO (Glass Panel) */}
      <div className="glass-panel p-1 rounded-xl sticky top-0 z-10">
        <div className="flex flex-wrap gap-4 p-3 bg-white/50 rounded-lg items-end justify-between">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-end">
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
          </div>

          <div className="w-full lg:w-auto">
            <Button
              variant="success"
              onClick={handleExportar}
              disabled={ranking.length === 0 || loading}
              className="w-full shadow-sm"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
            >
              Excel
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mx-auto mb-4"></div>
          <p className="text-gray-400 font-sans text-sm animate-pulse">Calculando performance...</p>
        </div>
      )}

      {/* PODIUM (TOP 3) - Cartões Destacados */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          {top3.map((op, index) => {
            const config = podiumConfig[index];
            return (
              <div 
                key={op.id} 
                className={`
                  relative rounded-xl p-6 border shadow-sm transition-all hover:shadow-md hover:-translate-y-1
                  flex flex-col items-center text-center group
                  ${config.bg} ${config.border}
                `}
              >
                <div className="absolute top-4 right-4 text-2xl filter grayscale group-hover:grayscale-0 transition-all">{config.icon}</div>
                
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-sm bg-white border-2 ${config.border} text-gray-500`}>
                  {op.nome.charAt(0)}
                </div>

                <div className={`text-[10px] uppercase font-bold tracking-widest mb-2 px-2 py-0.5 rounded-full border ${config.badge}`}>
                  {config.label}
                </div>
                
                <h3 className={`text-lg font-bold truncate w-full ${config.text}`}>
                  {op.nome}
                </h3>

                <div className="mt-4 w-full bg-white/60 rounded-lg p-3 border border-white/50">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Eficiência</span>
                  <span className="text-3xl font-mono font-bold text-gray-900 tracking-tight">
                    {formatKML(op.kml)} <span className="text-sm font-sans text-gray-400 font-normal">km/l</span>
                  </span>
                </div>

                <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/40 p-2 rounded-lg border border-black/5">
                    <span className="block text-gray-400 font-bold mb-0.5 uppercase tracking-wider text-[9px]">Distância</span>
                    <span className="font-mono text-gray-700">{formatKm(op.totalKM)} km</span>
                  </div>
                  <div className="bg-white/40 p-2 rounded-lg border border-black/5">
                    <span className="block text-gray-400 font-bold mb-0.5 uppercase tracking-wider text-[9px]">Consumo</span>
                    <span className="font-mono text-gray-700">{formatLitros(op.totalLitros)} L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LISTA COMPLETA (TABELA CLEAN) */}
      {!loading && ranking.length > 0 && (
        <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Ranking Geral da Frota
            </h3>
            <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 text-gray-400 font-mono">
              {ranking.length} Motoristas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/30 text-left border-b border-gray-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16 text-center">#</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Motorista</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Eficiência</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Distância</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Consumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ranking.map((op, index) => {
                  const percentual = (op.kml / maxKml) * 100;
                  const isTop3 = index < 3;
                  
                  return (
                    <tr key={op.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-3 text-center">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold
                          ${isTop3 ? 'bg-primary/10 text-primary' : 'text-gray-400 bg-gray-100'}
                        `}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mr-3 border border-gray-200 uppercase">
                            {op.nome.charAt(0)}
                          </div>
                          <span className={`text-sm font-medium ${isTop3 ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                            {op.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono font-bold text-gray-900 text-sm">{formatKML(op.kml)}</span>
                          {/* Barra de Progresso Ultra-fina */}
                          <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${index === 0 ? 'bg-primary' : 'bg-primary/60'}`} 
                              style={{ width: `${percentual}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-gray-600">
                        {formatKm(op.totalKM)} <span className="text-[10px] text-gray-400">km</span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-gray-600">
                        {formatLitros(op.totalLitros)} <span className="text-[10px] text-gray-400">L</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">Nenhum dado de abastecimento para este período.</p>
        </div>
      )}
    </div>
  );
}