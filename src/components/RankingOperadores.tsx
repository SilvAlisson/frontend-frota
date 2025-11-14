import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';

// Tipos
interface RankingProps {
  token: string;
}
interface OperadorRanking {
  id: string;
  nome: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
}

// Estilos (para a tabela)
const thStyle = "px-4 py-2 text-left text-sm font-semibold text-gray-700 bg-gray-100 border-b";
const tdStyle = "px-4 py-2 text-sm text-gray-800 border-b";
const medalColors = [
  'text-yellow-500', // 1º Ouro
  'text-gray-500',   // 2º Prata
  'text-yellow-700'  // 3º Bronze
];

export function RankingOperadores({ token }: RankingProps) {
  
  // 1. Estados para os filtros (igual ao DashboardRelatorios)
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1); // JS Mês é 0-11
  
  // 2. Estados para os dados
  const [ranking, setRanking] = useState<OperadorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Efeito que busca os dados na API
  useEffect(() => {
    const carregarRanking = async () => {
      setLoading(true);
      setError('');
      try {
        const api = axios.create({
          baseURL: RENDER_API_BASE_URL, 
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Chama a nova rota de ranking com os filtros
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
  }, [token, ano, mes]); // Recarrega se o token, ano ou mês mudarem

  // 4. Funções de Formatação
  const formatKm = (value: number) => value.toFixed(0);
  const formatLitros = (value: number) => value.toFixed(1);
  const formatKML = (value: number) => value.toFixed(2).replace('.', ',');

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

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-klin-azul text-center">
        Ranking de Eficiência (KM/L) - Motoristas
      </h3>

      {/* 6. Filtros de Data (Igual ao DashboardRelatorios) */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mês</label>
          <select 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {mesesOptions.map(m => (
              <option key={m.v} value={m.v}>{m.n}</option>
            ))}
          </select>
        </div>
         <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Ano</label>
          <select 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
             {anosOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 7. Conteúdo (Loading, Erro ou Tabela) */}
      {loading && <p className="text-center text-klin-azul">A calcular ranking...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && !error && ranking.length === 0 && (
         <p className="text-center text-gray-500 py-4">
            Nenhum dado de motorista encontrado para este período.
         </p>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div className="overflow-x-auto shadow rounded-lg border">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={thStyle}>Pos.</th>
                <th className={thStyle}>Motorista</th>
                <th className={thStyle + " text-right"}>Média (KM/L)</th>
                <th className={thStyle + " text-right"}>KM Rodado</th>
                <th className={thStyle + " text-right"}>Litros (Comb.)</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {ranking.map((op, index) => (
                <tr key={op.id}>
                  <td className={tdStyle + " text-center font-bold"}>
                    <span className={medalColors[index] || 'text-gray-900'}>
                      {index + 1}º
                    </span>
                  </td>
                  <td className={tdStyle}>{op.nome}</td>
                  <td className={tdStyle + " text-right font-bold text-lg text-klin-azul"}>{formatKML(op.kml)}</td>
                  <td className={tdStyle + " text-right"}>{formatKm(op.totalKM)} KM</td>
                  <td className={tdStyle + " text-right"}>{formatLitros(op.totalLitros)} L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}