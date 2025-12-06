import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { TableStyles } from '../styles/table';

interface RankingProps { }

interface OperadorRanking {
  id: string;
  nome: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
}

// Cores e Ícones das medalhas
const medalConfig = [
  { color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🥇' }, // 1º Ouro
  { color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', icon: '🥈' },       // 2º Prata
  { color: 'text-amber-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: '🥉' }   // 3º Bronze
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
        const response = await api.get('/relatorio/ranking-operadores', {
          params: { ano, mes }
        });
        setRanking(response.data);
      } catch (err) {
        console.error("Erro ao buscar ranking:", err);
        setError('Falha ao carregar ranking de motoristas.');
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    carregarRanking();
  }, [ano, mes]);

  const formatKm = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const formatLitros = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
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

    const exportPromise = new Promise((resolve, reject) => {
      try {
        const nomeMes = mesesOptions.find(m => m.v === mes)?.n || 'Mes';
        const dadosFormatados = ranking.map((op, index) => ({
          'Posição': `${index + 1}º`,
          'Motorista': op.nome,
          'Média (KM/L)': formatKML(op.kml),
          'KM Rodado': formatKm(op.totalKM),
          'Litros (Comb.)': formatLitros(op.totalLitros),
        }));
        exportarParaExcel(dadosFormatados, `Ranking_Motoristas_${nomeMes}_${ano}.xlsx`);
        resolve(true);
      } catch (err) { reject(err); }
    });

    toast.promise(exportPromise, {
      loading: 'Gerando ranking...',
      success: 'Planilha exportada!',
      error: 'Erro na exportação.'
    });
  };

  // Cálculo para barras de progresso (baseado no maior KML)
  const maxKml = ranking.length > 0 ? Math.max(...ranking.map(r => r.kml)) : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* CABEÇALHO E FILTROS */}
      <div className="bg-gradient-to-r from-yellow-50 to-white p-6 rounded-2xl border border-yellow-100/50 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Ranking de Eficiência
            </h3>
            <p className="text-sm text-text-secondary mt-1 max-w-md">
              Reconhecimento dos motoristas com melhor desempenho e economia de combustível.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <div className="relative group">
              <select
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 font-medium text-sm cursor-pointer transition-all hover:border-yellow-400"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {mesesOptions.map(m => (
                  <option key={m.v} value={m.v}>{m.n}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 group-hover:text-yellow-600 transition-colors">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            <div className="relative group">
              <select
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 font-medium text-sm cursor-pointer transition-all hover:border-yellow-400"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
              >
                {anosOptions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 group-hover:text-yellow-600 transition-colors">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            <Button
              variant="success"
              onClick={handleExportar}
              disabled={ranking.length === 0 || loading}
              isLoading={loading}
              className="bg-green-600 text-white border-transparent shadow-sm hover:bg-green-700 h-[38px]"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      {loading && (
        <div className="text-center py-20 opacity-60">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-yellow-500 mx-auto mb-4"></div>
          <p className="text-text-secondary font-medium">Calculando os campeões...</p>
        </div>
      )}

      {error && <p className="text-center text-error bg-red-50 p-4 rounded-lg border border-red-100 font-medium">{error}</p>}

      {!loading && !error && ranking.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 0-1.125-1.125h-2.75a1.125 1.125 0 0 0-1.125 1.125v8.625" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Nenhum dado de motorista encontrado para este período.</p>
        </div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div className="bg-white shadow-card rounded-2xl border border-gray-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className={`${TableStyles.th} text-center w-16`}>Pos.</th>
                <th className={TableStyles.th}>Motorista</th>
                <th className={`${TableStyles.th} w-1/3`}>Eficiência (KM/L)</th>
                <th className={`${TableStyles.th} text-right hidden sm:table-cell`}>KM Rodado</th>
                <th className={`${TableStyles.th} text-right hidden sm:table-cell`}>Consumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ranking.map((op, index) => {
                const medalha = medalConfig[index];
                const percentual = (op.kml / maxKml) * 100;

                return (
                  <tr key={op.id} className={`${TableStyles.rowHover} ${index < 3 ? 'bg-yellow-50/10' : ''}`}>
                    <td className={`${TableStyles.td} text-center`}>
                      {medalha ? (
                        <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full ${medalha.bg} border ${medalha.border} text-lg shadow-sm`}>
                          {medalha.icon}
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                      )}
                    </td>

                    <td className={`${TableStyles.td} font-medium text-gray-900`}>
                      {op.nome}
                      {index === 0 && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 font-bold">TOP 1</span>}
                    </td>

                    <td className={TableStyles.td}>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary w-12 text-right">{formatKML(op.kml)}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className={`h-full rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-primary/50'}`}
                            style={{ width: `${percentual}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className={`${TableStyles.td} text-right text-gray-600 hidden sm:table-cell font-mono`}>{formatKm(op.totalKM)}</td>
                    <td className={`${TableStyles.td} text-right text-gray-600 hidden sm:table-cell font-mono`}>{formatLitros(op.totalLitros)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}