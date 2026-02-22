import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Trophy, Medal, Award, Download, Truck, AlertTriangle, Calendar } from 'lucide-react';

// Componentes UI
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
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
    const carregar = async () => {
      setLoading(true);
      try {
        const res = await api.get('/relatorios/ranking-veiculos', { params: { ano, mes } });
        setRanking(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar ranking da frota.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [ano, mes]);

  const handleExportar = () => {
    if (!ranking.length) return;
    
    const acaoExportar = async () => {
      const dados = ranking.map((v, i) => ({
        'Posição': `${i + 1}º`,
        'Veículo': `${v.placa} - ${v.modelo}`,
        'Média (Km/L)': v.kml.toFixed(2).replace('.', ','),
        'KM Total': v.totalKM,
        'Consumo (L)': v.totalLitros
      }));
      exportarParaExcel(dados, `Ranking_Frota_${mes}_${ano}.xlsx`);
    };

    toast.promise(acaoExportar(), {
      loading: 'A gerar relatório...',
      success: 'Ranking exportado com sucesso!',
      error: 'Erro ao gerar planilha.'
    });
  };

  const top3 = useMemo(() => ranking.slice(0, 3), [ranking]);
  const maxKml = useMemo(() => ranking.length ? Math.max(...ranking.map(r => r.kml)) : 1, [ranking]);
  const isConsumoRuim = (kml: number) => kml < 2.0;

  const opcoesMes = useMemo(() => [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ], []);

  const opcoesAno = useMemo(() => [
    { value: new Date().getFullYear(), label: String(new Date().getFullYear()) },
    { value: new Date().getFullYear() - 1, label: String(new Date().getFullYear() - 1) },
    { value: new Date().getFullYear() - 2, label: String(new Date().getFullYear() - 2) }
  ], []);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-border/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-sm" /> Eficiência da Frota
          </h2>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Análise de consumo por ativo (Veículo). Identifique falhas mecânicas e oportunidades de economia.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-end bg-surface p-2 rounded-2xl border border-border/60 shadow-sm">
          <div className="w-full sm:w-44">
            <Select
              options={opcoesMes}
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              icon={<Calendar className="w-4 h-4" />}
              containerClassName="!mb-0"
            />
          </div>
          
          <div className="w-full sm:w-32">
            <Select
              options={opcoesAno}
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              containerClassName="!mb-0"
            />
          </div>

          <div className="w-full sm:w-auto mt-2 sm:mt-0 ml-auto">
            <Button
              variant="secondary"
              onClick={handleExportar}
              disabled={ranking.length === 0 || loading}
              className="h-11 sm:h-11 w-full sm:w-auto bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 shadow-sm"
              icon={<Download className="w-4 h-4" />}
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-surface-hover/50 rounded-3xl border border-border/40" />)}
        </div>
      ) : (
        <>
          {/* --- PODIUM --- */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end max-w-5xl mx-auto px-2">
              <div className="order-2 md:order-1 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                {top3[1] && <CardPodium pos={2} veiculo={top3[1]} />}
              </div>
              <div className="order-1 md:order-2 animate-in slide-in-from-bottom-12 duration-500">
                {top3[0] && <CardPodium pos={1} veiculo={top3[0]} isWinner />}
              </div>
              <div className="order-3 animate-in slide-in-from-bottom-6 duration-1000 delay-200">
                {top3[2] && <CardPodium pos={3} veiculo={top3[2]} />}
              </div>
            </div>
          )}

          {/* --- LISTA COM ALINHAMENTO FORÇADO --- */}
          <Card padding="none" className="overflow-hidden border-border/50 shadow-sm rounded-3xl bg-surface">
            <div className="overflow-x-auto"> {/* Garante que a tabela não quebra ecrãs menores */}
              <ListaResponsiva
                itens={ranking}
                emptyMessage="Nenhum dado consolidado encontrado para este período."

                // ✨ DESKTOP HEADER COM MIN-WIDTH ABSOLUTO
                desktopHeader={
                  <>
                    <th className={`${TableStyles.th} w-24 min-w-[6rem] text-center pl-6 py-5`}>Posição</th>
                    <th className={`${TableStyles.th} w-auto min-w-[15rem] text-left`}>Veículo</th>
                    <th className={`${TableStyles.th} w-48 min-w-[12rem] text-right`}>Eficiência (Km/L)</th>
                    <th className={`${TableStyles.th} w-40 min-w-[10rem] text-right`}>Distância (KM)</th>
                    <th className={`${TableStyles.th} w-44 min-w-[11rem] text-right pr-8`}>Consumo Total</th>
                  </>
                }

                // ✨ DESKTOP ROW COM AS MESMAS MIN-WIDTH
                renderDesktop={(v, idx) => (
                  <tr className="hover:bg-surface-hover/50 transition-colors group">
                    <td className={`${TableStyles.td} w-24 min-w-[6rem] text-center pl-6`}>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black shadow-sm ${
                          idx === 0 ? 'bg-yellow-500 text-white border-yellow-600' :
                          idx === 1 ? 'bg-slate-200 text-slate-700 border-slate-300' :
                          idx === 2 ? 'bg-orange-200 text-orange-800 border-orange-300' :
                          'bg-surface-hover text-text-muted border-border/60'
                        } border`}>
                        {idx + 1}º
                      </span>
                    </td>
                    <td className={`${TableStyles.td} w-auto min-w-[15rem] text-left`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="block font-black text-text-main text-base tracking-tight leading-none truncate" title={v.placa}>{v.placa}</span>
                          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-1 truncate" title={v.modelo}>{v.modelo}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`${TableStyles.td} w-48 min-w-[12rem] text-right`}>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          {isConsumoRuim(v.kml) && (
                            <span title="Consumo Crítico - Alerta de Manutenção">
                               <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
                            </span>
                          )}
                          <span className={`font-mono font-black text-lg tracking-tight ${isConsumoRuim(v.kml) ? 'text-error' : 'text-text-main'}`}>
                            {fmtKml(v.kml)}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-surface-hover rounded-full overflow-hidden shadow-inner border border-border/40">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-yellow-500' : isConsumoRuim(v.kml) ? 'bg-error' : 'bg-primary'}`}
                            style={{ width: `${Math.min((v.kml / maxKml) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={`${TableStyles.td} w-40 min-w-[10rem] text-right font-mono font-bold text-text-secondary text-base`}>
                       {fmtNum(v.totalKM)} <span className="text-[10px] text-text-muted uppercase tracking-widest ml-0.5">km</span>
                    </td>
                    <td className={`${TableStyles.td} w-44 min-w-[11rem] text-right font-mono font-bold text-text-secondary text-base pr-8`}>
                       {fmtNum(v.totalLitros)} <span className="text-[10px] text-text-muted uppercase tracking-widest ml-0.5">L</span>
                    </td>
                  </tr>
                )}

                // MOBILE CARD
                renderMobile={(v, idx) => (
                  <div className="flex items-start gap-4 p-5 border-b border-border/60 last:border-0 hover:bg-surface-hover/30 transition-colors">
                    <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg border shadow-sm ${
                        idx === 0 ? 'bg-yellow-500 text-white border-yellow-600' :
                        idx === 1 ? 'bg-slate-200 text-slate-700 border-slate-300' :
                        idx === 2 ? 'bg-orange-200 text-orange-800 border-orange-300' :
                        'bg-surface-hover text-text-muted border-border/60'
                      }`}>
                      {idx + 1}º
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-black text-text-main text-lg tracking-tight leading-none">{v.placa}</h4>
                          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-1 truncate max-w-[150px]">{v.modelo}</p>
                        </div>
                        {isConsumoRuim(v.kml) && <Badge variant="danger" className="text-[9px] px-1.5 shadow-sm">Crítico</Badge>}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 bg-surface-hover/50 p-2.5 rounded-xl border border-border/40">
                        <div className="flex flex-col items-center justify-center p-1 bg-surface rounded-lg border border-border/50">
                          <span className="text-[9px] uppercase text-text-muted font-black tracking-widest mb-0.5">Média</span>
                          <span className={`font-mono font-black text-sm tracking-tighter ${isConsumoRuim(v.kml) ? 'text-error' : 'text-primary'}`}>{fmtKml(v.kml)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1 bg-surface rounded-lg border border-border/50">
                          <span className="text-[9px] uppercase text-text-muted font-black tracking-widest mb-0.5">KM</span>
                          <span className="font-mono font-bold text-text-secondary text-sm tracking-tighter">{fmtNum(v.totalKM)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1 bg-surface rounded-lg border border-border/50">
                          <span className="text-[9px] uppercase text-text-muted font-black tracking-widest mb-0.5">Litros</span>
                          <span className="font-mono font-bold text-text-secondary text-sm tracking-tighter">{fmtNum(v.totalLitros)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
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
      bg: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      border: 'border-yellow-400',
      text: 'text-white',
      icon: Trophy,
      colorIcon: 'text-yellow-100',
      label: 'Mais Econômico'
    },
    2: {
      bg: 'bg-gradient-to-br from-slate-200 to-slate-300',
      border: 'border-slate-300',
      text: 'text-slate-800',
      icon: Medal,
      colorIcon: 'text-slate-500',
      label: '2º Lugar'
    },
    3: {
      bg: 'bg-gradient-to-br from-orange-200 to-orange-300',
      border: 'border-orange-300',
      text: 'text-orange-900',
      icon: Award,
      colorIcon: 'text-orange-600',
      label: '3º Lugar'
    }
  }[pos as 1 | 2 | 3];

  const Icon = config.icon;

  return (
    <div className={`
        relative rounded-3xl border p-6 flex flex-col items-center text-center shadow-card transition-all duration-500 overflow-hidden
        ${config.bg} ${config.border}
        ${isWinner ? 'h-72 justify-end ring-4 ring-yellow-500/20 z-10 transform sm:scale-105 shadow-xl' : 'h-64 justify-end opacity-95 hover:opacity-100 sm:hover:scale-105'}
      `}>

      {/* Reflexo / Brilho */}
      <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Posição Gigante de Fundo */}
      <div className={`absolute -top-4 -right-2 font-black text-9xl opacity-20 select-none ${config.text} drop-shadow-md`}>
        {pos}
      </div>

      <div className={`absolute top-5 left-5 p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner ${config.text}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Avatar do Veículo */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-2xl border-4 border-white/30 shadow-lg flex items-center justify-center bg-white/10 backdrop-blur-md overflow-hidden transform group-hover:scale-110 transition-transform">
          <Truck className={`w-10 h-10 ${config.text} drop-shadow-md`} />
        </div>
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg bg-white shadow-md whitespace-nowrap ${config.text.replace('text-white', 'text-yellow-700')}`}>
          {config.label}
        </div>
      </div>

      <h3 className={`font-black truncate w-full px-2 text-2xl tracking-tight leading-none mb-1 ${config.text} drop-shadow-sm`}>{veiculo.placa}</h3>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 opacity-80 ${config.text}`}>{veiculo.modelo}</p>

      {/* Stats Box */}
      <div className="w-full bg-white/20 rounded-2xl p-3 backdrop-blur-md border border-white/30 shadow-inner">
        <div className="flex flex-col">
          <span className={`text-[9px] uppercase tracking-[0.2em] font-black mb-0.5 opacity-80 ${config.text}`}>Média de Consumo</span>
          <span className={`font-mono font-black text-3xl tracking-tighter drop-shadow-sm ${config.text}`}>
            {veiculo.kml.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[10px] uppercase tracking-widest font-bold ml-1 opacity-70">km/l</span>
          </span>
        </div>
      </div>
    </div>
  );
}