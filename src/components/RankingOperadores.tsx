import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Trophy, Medal, Award, Download, Filter } from 'lucide-react';

// Componentes UI
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Button } from './ui/Button';

interface OperadorRanking {
  id: string;
  nome: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
  fotoUrl?: string;
}

export function RankingOperadores() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ranking, setRanking] = useState<OperadorRanking[]>([]);
  const [loading, setLoading] = useState(true);

  // Formatadores
  const fmtNum = (n: number) => n.toLocaleString('pt-BR');
  const fmtKml = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    // CORREÇÃO 1: Tipagem universal para o setTimeout (funciona no Browser e Node)
    let timeoutId: ReturnType<typeof setTimeout>;

    const carregar = async () => {
      setLoading(true);
      try {
        const res = await api.get('/relatorios/ranking', { params: { ano, mes } });
        setRanking(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar ranking.');
      } finally {
        timeoutId = setTimeout(() => setLoading(false), 300);
      }
    };
    carregar();

    return () => clearTimeout(timeoutId);
  }, [ano, mes]);

  const handleExportar = () => {
    if (!ranking.length) return;
    const dados = ranking.map((op, i) => ({
      'Posição': `${i + 1}º`,
      'Nome': op.nome,
      'Média (Km/L)': op.kml.toFixed(2).replace('.', ','),
      'KM Total': op.totalKM,
      'Consumo (L)': op.totalLitros
    }));
    exportarParaExcel(dados, `Ranking_${mes}_${ano}.xlsx`);
  };

  const top3 = ranking.slice(0, 3);
  const maxKml = ranking.length ? Math.max(...ranking.map(r => r.kml)) : 1;

  const meses = [
    { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Março' },
    { v: 4, l: 'Abril' }, { v: 5, l: 'Maio' }, { v: 6, l: 'Junho' },
    { v: 7, l: 'Julho' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Setembro' },
    { v: 10, l: 'Outubro' }, { v: 11, l: 'Novembro' }, { v: 12, l: 'Dezembro' }
  ];
  const anos = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Ranking de Eficiência
          </h2>
          <p className="text-sm text-gray-500 mt-1">Desempenho e economia dos condutores.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          <div className="flex items-center gap-2 bg-white border border-border p-1 rounded-lg">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="h-9 bg-transparent text-sm text-gray-700 outline-none cursor-pointer border-none focus:ring-0"
            >
              {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
            <div className="w-px h-6 bg-border mx-1"></div>
            <select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              className="h-9 bg-transparent text-sm text-gray-700 outline-none cursor-pointer border-none focus:ring-0"
            >
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <Button
            variant="success"
            onClick={handleExportar}
            disabled={ranking.length === 0}
            className="h-11 shadow-sm"
            icon={<Download className="w-4 h-4" />}
          >
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* --- PODIUM --- */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end max-w-5xl mx-auto">
              <div className="order-2 md:order-1">
                {top3[1] && <CardPodium pos={2} op={top3[1]} />}
              </div>
              <div className="order-1 md:order-2">
                {top3[0] && <CardPodium pos={1} op={top3[0]} isWinner />}
              </div>
              <div className="order-3">
                {top3[2] && <CardPodium pos={3} op={top3[2]} />}
              </div>
            </div>
          )}

          {/* --- LISTA --- */}
          <ListaResponsiva
            itens={ranking}
            emptyMessage="Nenhum dado encontrado para este período."

            // DESKTOP HEADER
            desktopHeader={
              <>
                <th className="px-6 py-4 w-16 text-center">#</th>
                <th className="px-6 py-4">Motorista</th>
                <th className="px-6 py-4 text-right">Eficiência (KM/L)</th>
                <th className="px-6 py-4 text-right">KM Rodado</th>
                <th className="px-6 py-4 text-right">Consumo (L)</th>
              </>
            }

            // DESKTOP ROW
            renderDesktop={(op, idx) => (
              <>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${idx < 3 ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {idx + 1}º
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary uppercase border border-primary/10">
                      {op.nome.charAt(0)}
                    </div>
                    {op.nome}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-mono font-bold text-gray-900 text-base">{fmtKml(op.kml)}</span>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min((op.kml / maxKml) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">{fmtNum(op.totalKM)} <span className="text-xs text-gray-400">km</span></td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">{fmtNum(op.totalLitros)} <span className="text-xs text-gray-400">L</span></td>
              </>
            )}

            // MOBILE CARD
            renderMobile={(op, idx) => (
              <div className="flex items-center gap-4 p-4">
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm border ${idx < 3
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                  {idx + 1}º
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">{op.nome}</h4>
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-bold block mb-0.5">Média</span>
                      <span className="font-mono font-bold text-primary text-sm">{fmtKml(op.kml)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-bold block mb-0.5">KM</span>
                      <span className="font-mono text-gray-600 text-sm">{fmtNum(op.totalKM)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-bold block mb-0.5">Litros</span>
                      <span className="font-mono text-gray-600 text-sm">{fmtNum(op.totalLitros)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </>
      )}
    </div>
  );
}

// Subcomponente Podium
function CardPodium({ pos, op, isWinner }: { pos: number, op: OperadorRanking, isWinner?: boolean }) {
  const config = {
    1: {
      bg: 'bg-gradient-to-b from-yellow-50 via-white to-white',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: Trophy,
      colorIcon: 'text-yellow-500',
      label: 'Campeão'
    },
    2: {
      bg: 'bg-gradient-to-b from-slate-50 via-white to-white',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: Medal,
      colorIcon: 'text-slate-400',
      label: '2º Lugar'
    },
    3: {
      bg: 'bg-gradient-to-b from-orange-50 via-white to-white',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: Award,
      colorIcon: 'text-orange-500',
      label: '3º Lugar'
    }
  }[pos as 1 | 2 | 3];

  const Icon = config.icon;

  return (
    <div className={`
        relative rounded-2xl border p-5 flex flex-col items-center text-center shadow-sm transition-all duration-500
        ${config.bg} ${config.border}
        ${isWinner ? 'h-72 justify-end ring-4 ring-yellow-50 z-10 transform scale-105 shadow-xl' : 'h-60 justify-end opacity-90 hover:opacity-100 hover:scale-105'}
      `}>

      {/* Posição Gigante de Fundo */}
      <div className={`absolute top-2 font-black text-8xl opacity-[0.03] select-none ${config.text}`}>
        {pos}
      </div>

      <div className={`absolute top-4 right-4 ${config.colorIcon}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Avatar */}
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold bg-white text-gray-700 overflow-hidden`}>
          {op.nome.charAt(0)}
        </div>
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white border shadow-sm whitespace-nowrap ${config.text} ${config.border}`}>
          {config.label}
        </div>
      </div>

      <h3 className="font-bold truncate w-full px-2 text-base text-gray-900 mb-1">{op.nome}</h3>

      {/* Stats Box */}
      <div className="w-full bg-white/80 rounded-xl p-3 backdrop-blur-sm border border-black/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Eficiência</span>
          <span className={`font-mono font-bold text-2xl ${config.text}`}>
            {op.kml.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-gray-400 font-normal ml-1">km/l</span>
          </span>
        </div>
      </div>
    </div>
  );
}