import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { TableStyles } from '../styles/table';

// Interface corrigida: sem a propriedade 'token'
interface RankingProps {
  // token removido
}

interface OperadorRanking {
  id: string;
  nome: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
}

// Cores das medalhas
const medalColors = [
  'text-yellow-500', // 1º Ouro
  'text-gray-400',   // 2º Prata
  'text-amber-700'   // 3º Bronze
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
      } finally {
        setLoading(false);
      }
    };

    carregarRanking();
  }, [ano, mes]);

  const formatKm = (value: number) => value.toFixed(0);
  const formatLitros = (value: number) => value.toFixed(1);
  const formatKML = (value: number) => value.toFixed(2).replace('.', ',');

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

    const nomeMes = mesesOptions.find(m => m.v === mes)?.n || 'Mes';

    try {
      const dadosFormatados = ranking.map((op, index) => ({
        'Posição': `${index + 1}º`,
        'Motorista': op.nome,
        'Média (KM/L)': formatKML(op.kml),
        'KM Rodado': formatKm(op.totalKM),
        'Litros (Comb.)': formatLitros(op.totalLitros),
      }));

      exportarParaExcel(dadosFormatados, `Ranking_Motoristas_${nomeMes}_${ano}.xlsx`);
    } catch (err) {
      alert('Ocorreu um erro ao preparar os dados para exportação.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-primary text-center">
        Ranking de Eficiência (KM/L) - Motoristas
      </h3>

      {/* Filtros e Ações */}
      <div className="flex flex-wrap gap-4 p-4 bg-white shadow-sm rounded-lg border border-gray-100 items-end justify-between">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-40">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1">Mês</label>
            <div className="relative">
              <select
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {mesesOptions.map(m => (
                  <option key={m.v} value={m.v}>{m.n}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-32">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1">Ano</label>
            <div className="relative">
              <select
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
              >
                {anosOptions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button
            variant="success"
            onClick={handleExportar}
            disabled={ranking.length === 0 || loading}
            isLoading={loading}
            className="w-full sm:w-auto"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            }
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-text-secondary">A calcular indicadores...</p>
        </div>
      )}

      {error && <p className="text-center text-error bg-red-50 p-4 rounded-md border border-red-100">{error}</p>}

      {!loading && !error && ranking.length === 0 && (
        <div className={TableStyles.emptyState}>
          <p>Nenhum dado de motorista encontrado para este período.</p>
        </div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div className="overflow-hidden shadow-card rounded-lg border border-gray-100">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className={TableStyles.th}>Pos.</th>
                <th className={TableStyles.th}>Motorista</th>
                <th className={`${TableStyles.th} text-right`}>Média (KM/L)</th>
                <th className={`${TableStyles.th} text-right`}>KM Rodado</th>
                <th className={`${TableStyles.th} text-right`}>Litros (Comb.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranking.map((op, index) => (
                <tr key={op.id} className={TableStyles.rowHover}>
                  <td className={`${TableStyles.td} text-center font-bold`}>
                    <span className={`${medalColors[index] || 'text-text-secondary'} text-lg`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                    </span>
                  </td>
                  <td className={`${TableStyles.td} font-medium`}>{op.nome}</td>
                  <td className={`${TableStyles.td} text-right font-bold text-lg text-primary`}>{formatKML(op.kml)}</td>
                  <td className={`${TableStyles.td} text-right text-text-secondary`}>{formatKm(op.totalKM)}</td>
                  <td className={`${TableStyles.td} text-right text-text-secondary`}>{formatLitros(op.totalLitros)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}