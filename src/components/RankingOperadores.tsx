import { useState, useMemo } from 'react';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Trophy, Download, Truck, AlertTriangle, Calendar, Loader2 } from 'lucide-react';

// Hooks Globais
import { useRankingVeiculos } from '../hooks/useRankingVeiculos';

// Componentes UI
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Select } from './ui/Select'; 
import { TableStyles } from '../styles/table';
import { CardPodium } from './dashboard/CardPodium';

export function RankingOperadores() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const { data: ranking = [], isLoading: loading } = useRankingVeiculos(ano, mes);

  // Formatadores
  const fmtNum = (n: number) => n.toLocaleString('pt-BR');
  const fmtKml = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      loading: 'Gerando relatório...',
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
            Análise de consumo por ativo (Veículo).
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
              className="h-11 sm:h-11 w-full sm:w-auto bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm"
              icon={<Download className="w-4 h-4" />}
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60 gap-4 animate-in fade-in duration-500">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-text-secondary font-black uppercase tracking-widest animate-pulse">Compilando ranking da frota...</p>
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

          {/* --- LISTA COM ALINHAMENTO CORRIGIDO --- */}
          <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
            <ListaResponsiva
              itens={ranking}
              emptyMessage="Nenhum dado consolidado encontrado para este período."

              // HEADER
              desktopHeader={
                <>
                  <th className={`${TableStyles.th} pl-8 py-5 text-center`}>Posição</th>
                  <th className={`${TableStyles.th} w-full text-left`}>Veículo</th>
                  <th className={`${TableStyles.th} text-right whitespace-nowrap`}>Eficiência (Km/L)</th>
                  <th className={`${TableStyles.th} text-right whitespace-nowrap`}>Distância (KM)</th>
                  <th className={`${TableStyles.th} text-right pr-8 whitespace-nowrap`}>Consumo Total</th>
                </>
              }

              // ROW
              renderDesktop={(v, idx) => (
                <>
                  <td className={`${TableStyles.td} text-center pl-8`}>
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black shadow-sm border ${
                        idx === 0 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                        idx === 1 ? 'bg-slate-500/10 text-slate-500 border-slate-500/30' :
                        idx === 2 ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                        'bg-surface-hover text-text-muted border-border/60'
                      }`}>
                      {idx + 1}º
                    </span>
                  </td>

                  <td className={`${TableStyles.td} w-full text-left`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="block font-black text-text-main text-base tracking-tight leading-none truncate">{v.placa}</span>
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-1 truncate">{v.modelo}</span>
                      </div>
                    </div>
                  </td>

                  <td className={`${TableStyles.td} text-right whitespace-nowrap`}>
                    <div className="flex flex-col items-end gap-1.5 w-full">
                      <div className="flex items-center justify-end gap-2 w-full">
                        {isConsumoRuim(v.kml) && (
                          <span title="Consumo Crítico - Alerta de Manutenção">
                             <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
                          </span>
                        )}
                        <span className={`font-mono font-black text-lg tracking-tight ${isConsumoRuim(v.kml) ? 'text-error' : 'text-text-main'}`}>
                          {fmtKml(v.kml)}
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-surface-hover rounded-full overflow-hidden shadow-inner border border-border/40 ml-auto">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-yellow-500' : isConsumoRuim(v.kml) ? 'bg-error' : 'bg-primary'}`}
                          style={{ width: `${Math.min((v.kml / maxKml) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className={`${TableStyles.td} text-right font-mono font-bold text-text-secondary text-base whitespace-nowrap`}>
                     {fmtNum(v.totalKM)} <span className="text-[10px] text-text-muted uppercase tracking-widest ml-0.5">km</span>
                  </td>

                  <td className={`${TableStyles.td} text-right font-mono font-bold text-text-secondary text-base pr-8 whitespace-nowrap`}>
                     {fmtNum(v.totalLitros)} <span className="text-[10px] text-text-muted uppercase tracking-widest ml-0.5">L</span>
                  </td>
                </>
              )}

              // MOBILE CARD
              renderMobile={(v, idx) => (
                <div className="flex items-start gap-4 p-5 border-b border-border/60 last:border-0 hover:bg-surface-hover/30 transition-colors">
                  <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg border shadow-sm ${
                      idx === 0 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                      idx === 1 ? 'bg-slate-500/10 text-slate-500 border-slate-500/30' :
                      idx === 2 ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
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
          </Card>
        </>
      )}
    </div>
  );
}
