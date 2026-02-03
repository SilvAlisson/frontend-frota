import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Trophy, Medal, Award, Download, Filter, Truck, AlertTriangle } from 'lucide-react';

// Componentes UI
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { TableStyles } from '../styles/table';

interface VeiculoRanking {
  id: string;
  placa: string;
  modelo: string;
  totalKM: number;
  totalLitros: number;
  kml: number;
}

export function RankingOperadores() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ranking, setRanking] = useState<VeiculoRanking[]>([]);
  const [loading, setLoading] = useState(true);

  // Formatadores
  const fmtNum = (n: number) => n.toLocaleString('pt-BR');
  const fmtKml = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const carregar = async () => {
      setLoading(true);
      try {
        const res = await api.get('/relatorios/ranking-veiculos', { params: { ano, mes } });
        setRanking(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar ranking da frota.');
      } finally {
        timeoutId = setTimeout(() => setLoading(false), 300);
      }
    };
    carregar();

    return () => clearTimeout(timeoutId);
  }, [ano, mes]);

  const handleExportar = () => {
    if (!ranking.length) return;
    const dados = ranking.map((v, i) => ({
      'Posição': `${i + 1}º`,
      'Veículo': `${v.placa} - ${v.modelo}`,
      'Média (Km/L)': v.kml.toFixed(2).replace('.', ','),
      'KM Total': v.totalKM,
      'Consumo (L)': v.totalLitros
    }));
    exportarParaExcel(dados, `Ranking_Frota_${mes}_${ano}.xlsx`);
  };

  const top3 = ranking.slice(0, 3);
  const maxKml = ranking.length ? Math.max(...ranking.map(r => r.kml)) : 1;
  const isConsumoRuim = (kml: number) => kml < 2.0;

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
          <h2 className="text-2xl font-bold text-text-main tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Eficiência da Frota
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Análise de consumo por ativo (Veículo). Identifique falhas mecânicas e oportunidades de economia.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-lg shadow-sm">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="h-9 bg-transparent text-sm text-gray-700 outline-none cursor-pointer border-none focus:ring-0 font-medium"
            >
              {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
            <div className="w-px h-6 bg-border mx-1"></div>
            <select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              className="h-9 bg-transparent text-sm text-gray-700 outline-none cursor-pointer border-none focus:ring-0 font-medium"
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
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-surface-hover rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* --- PODIUM --- */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end max-w-5xl mx-auto">
              <div className="order-2 md:order-1">
                {top3[1] && <CardPodium pos={2} veiculo={top3[1]} />}
              </div>
              <div className="order-1 md:order-2">
                {top3[0] && <CardPodium pos={1} veiculo={top3[0]} isWinner />}
              </div>
              <div className="order-3">
                {top3[2] && <CardPodium pos={3} veiculo={top3[2]} />}
              </div>
            </div>
          )}

          {/* --- LISTA --- */}
          <Card noPadding>
            <ListaResponsiva
              itens={ranking}
              emptyMessage="Nenhum dado encontrado para este período."

              // DESKTOP HEADER
              desktopHeader={
                <>
                  <th className={`${TableStyles.th} w-16 text-center`}>#</th>
                  <th className={TableStyles.th}>Veículo</th>
                  <th className={`${TableStyles.th} text-right`}>Eficiência (Km/L)</th>
                  <th className={`${TableStyles.th} text-right`}>KM Rodado</th>
                  <th className={`${TableStyles.th} text-right`}>Consumo (L)</th>
                </>
              }

              // DESKTOP ROW
              renderDesktop={(v, idx) => (
                <>
                  <td className={`${TableStyles.td} text-center`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${idx < 3 ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-500/20' : 'bg-surface-hover text-text-muted'
                      }`}>
                      {idx + 1}º
                    </span>
                  </td>
                  <td className={TableStyles.td}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-text-main">{v.placa}</span>
                        <span className="text-xs text-text-secondary">{v.modelo}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-right`}>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        {isConsumoRuim(v.kml) && (
                          // CORREÇÃO APLICADA AQUI: Envolvendo o ícone em um span com title
                          <span title="Consumo crítico">
                             <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
                          </span>
                        )}
                        <span className={`font-mono font-bold text-base ${isConsumoRuim(v.kml) ? 'text-error' : 'text-text-main'}`}>{fmtKml(v.kml)}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : isConsumoRuim(v.kml) ? 'bg-error' : 'bg-primary'}`}
                          style={{ width: `${Math.min((v.kml / maxKml) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-right font-mono text-text-secondary`}>{fmtNum(v.totalKM)} <span className="text-xs text-text-muted">km</span></td>
                  <td className={`${TableStyles.td} text-right font-mono text-text-secondary`}>{fmtNum(v.totalLitros)} <span className="text-xs text-text-muted">L</span></td>
                </>
              )}

              // MOBILE CARD
              renderMobile={(v, idx) => (
                <div className="flex items-center gap-4 p-4">
                  <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm border ${idx < 3
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-500/20'
                    : 'bg-surface-hover text-text-muted border-border'
                    }`}>
                    {idx + 1}º
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-text-main text-sm">{v.placa}</h4>
                        <p className="text-xs text-text-secondary">{v.modelo}</p>
                      </div>
                      {isConsumoRuim(v.kml) && <Badge variant="danger" className="text-[10px] px-1.5">Atenção</Badge>}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase text-text-muted font-bold block mb-0.5">Média</span>
                        <span className={`font-mono font-bold text-sm ${isConsumoRuim(v.kml) ? 'text-error' : 'text-primary'}`}>{fmtKml(v.kml)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-text-muted font-bold block mb-0.5">KM</span>
                        <span className="font-mono text-text-secondary text-sm">{fmtNum(v.totalKM)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-text-muted font-bold block mb-0.5">Litros</span>
                        <span className="font-mono text-text-secondary text-sm">{fmtNum(v.totalLitros)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
}

// Subcomponente Podium
function CardPodium({ pos, veiculo, isWinner }: { pos: number, veiculo: VeiculoRanking, isWinner?: boolean }) {
  const config = {
    1: {
      bg: 'bg-gradient-to-b from-yellow-500/10 via-surface to-surface',
      border: 'border-yellow-500/30',
      text: 'text-yellow-700',
      icon: Trophy,
      colorIcon: 'text-yellow-500',
      label: 'Mais Econômico'
    },
    2: {
      bg: 'bg-gradient-to-b from-slate-200/50 via-surface to-surface',
      border: 'border-slate-300',
      text: 'text-slate-700',
      icon: Medal,
      colorIcon: 'text-slate-400',
      label: '2º Lugar'
    },
    3: {
      bg: 'bg-gradient-to-b from-orange-200/30 via-surface to-surface',
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
        relative rounded-2xl border p-5 flex flex-col items-center text-center shadow-card transition-all duration-500
        ${config.bg} ${config.border}
        ${isWinner ? 'h-72 justify-end ring-4 ring-yellow-500/10 z-10 transform scale-105 shadow-float' : 'h-60 justify-end opacity-90 hover:opacity-100 hover:scale-105'}
      `}>

      {/* Posição Gigante de Fundo */}
      <div className={`absolute top-2 font-black text-8xl opacity-[0.05] select-none ${config.text}`}>
        {pos}
      </div>

      <div className={`absolute top-4 right-4 ${config.colorIcon}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Avatar do Veículo */}
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-full border-4 border-surface shadow-lg flex items-center justify-center text-2xl font-bold bg-surface text-text-secondary overflow-hidden`}>
          <Truck className="w-8 h-8 text-text-muted" />
        </div>
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface border shadow-sm whitespace-nowrap ${config.text} ${config.border}`}>
          {config.label}
        </div>
      </div>

      <h3 className="font-bold truncate w-full px-2 text-xl text-text-main leading-none">{veiculo.placa}</h3>
      <p className="text-xs text-text-secondary mb-3">{veiculo.modelo}</p>

      {/* Stats Box */}
      <div className="w-full bg-surface/60 rounded-xl p-3 backdrop-blur-sm border border-border">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">Eficiência</span>
          <span className={`font-mono font-bold text-2xl ${config.text}`}>
            {veiculo.kml.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-text-muted font-normal ml-1">km/l</span>
          </span>
        </div>
      </div>
    </div>
  );
}