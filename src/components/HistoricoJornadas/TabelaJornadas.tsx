import { Calendar, Camera, ImageOff, Edit, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { DateHelper } from '../../lib/dateHelper';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MobileCardWithActions } from '../ui/MobileCardWithActions';
import { ListaResponsiva } from '../ui/ListaResponsiva';
import { Card } from '../ui/Card';
import { TableStyles } from '../../styles/table';
import type { JornadaHistorico } from '../../hooks/useHistoricoJornadas';

export const getFotoUrl = (jornada: JornadaHistorico, tipo: 'inicio' | 'fim'): string | null => {
  if (tipo === 'inicio') {
    const raw = jornada as unknown as Record<string, unknown>;
    return (jornada.fotoInicioUrl || jornada.fotoInicio || raw.foto_inicio || null) as string | null;
  }
  const raw = jornada as unknown as Record<string, unknown>;
  return (jornada.fotoFimUrl || jornada.fotoFim || raw.foto_fim || null) as string | null;
};

interface TabelaJornadasProps {
  historicoVisivel: JornadaHistorico[];
  totalFiltrado: number;
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEditar: (id: string) => void;
  onExcluir: (id: string) => void;
  onVisualizarFoto: (url: string) => void;
  onCarregarMais: () => void;
  itensPorPagina: number;
}

export function TabelaJornadas({
  historicoVisivel,
  totalFiltrado,
  loading,
  canEdit,
  canDelete,
  onEditar,
  onExcluir,
  onVisualizarFoto,
  onCarregarMais,
  itensPorPagina
}: TabelaJornadasProps) {

  return (
    <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
      {loading ? (
        <div className="p-6 sm:p-8 space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <ListaResponsiva
            virtualized={true}
            itens={historicoVisivel}
            emptyMessage="Nenhuma viagem encontrada neste período ou com os filtros atuais."
            desktopHeader={
              <>
                <th className={`${TableStyles.th} pl-8 py-5 text-left`}>Data e Estado</th>
                <th className={`${TableStyles.th} text-center`}>Veículo</th>
                <th className={`${TableStyles.th} text-center`}>Motorista</th>
                <th className={`${TableStyles.th} text-center`}>Telemetria (KM)</th>
                <th className={`${TableStyles.th} text-center`}>Comprovantes</th>
                {(canEdit || canDelete) && <th className={`${TableStyles.th} text-right pr-8`}>Gestão</th>}
              </>
            }
            renderDesktop={(j) => {
              const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
              const imgInicio = getFotoUrl(j, 'inicio');
              const imgFim = getFotoUrl(j, 'fim');

              return (
                <>
                  <td className={`${TableStyles.td} pl-8`}>
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="font-bold text-text-main text-sm flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-text-muted/60" />
                        {DateHelper.getCompleta(j.dataInicio)}
                      </span>
                      {j.dataFim ? (
                        <Badge variant="success" className="text-[10px] h-5 px-2 tracking-widest">FINALIZADA</Badge>
                      ) : (
                        <Badge variant="info" className="text-[10px] h-5 px-2 tracking-widest animate-pulse shadow-sm">EM ROTA</Badge>
                      )}
                      {j.observacoes && (
                        <div 
                          className={`mt-1 text-[10px] font-medium max-w-[200px] line-clamp-2 leading-tight flex items-start gap-1 ${j.observacoes.includes('⚠️') ? 'text-amber-600 dark:text-amber-500' : 'text-text-muted'}`}
                          title={j.observacoes}
                        >
                          {j.observacoes.includes('⚠️') && <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />}
                          {j.observacoes.includes('⚠️') 
                            ? j.observacoes.replace(/⚠️\s*/g, '') 
                            : `Obs: ${j.observacoes}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-center`}>
                    <div className="w-full flex flex-col gap-1 items-center justify-center text-center">
                      <span className="font-mono font-black text-primary text-base tracking-tight block w-full">{j.veiculo?.placa || '---'}</span>
                      <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider block w-full">{j.veiculo?.modelo || 'Veículo Excluído'}</span>
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-center`}>
                    <span className="font-medium text-text-main text-sm text-center block w-full">{j.operador?.nome || 'Motorista Excluído'}</span>
                  </td>
                  <td className={`${TableStyles.td} text-center`}>
                    <div className="w-full flex flex-col gap-1 items-center justify-center text-center">
                      <span className="font-sans font-black tracking-tight text-text-main text-base block w-full">
                        {kmPercorrido > 0 ? `${kmPercorrido.toLocaleString('pt-BR')} km` : '--'}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono font-bold bg-surface-hover px-1.5 py-0.5 rounded-md border border-border/50 block w-fit mx-auto">
                        {j.kmInicio} → {j.kmFim || '...'}
                      </span>
                    </div>
                  </td>
                  
                  <td className={`${TableStyles.td} text-center`}>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => imgInicio && onVisualizarFoto(imgInicio)}
                        disabled={!imgInicio}
                        className={`w-9 h-9 min-w-[36px] min-h-[36px] transition-all ${imgInicio 
                          ? 'bg-info/10 text-info border border-info/20 hover:bg-info/20 hover:scale-105 cursor-pointer shadow-sm' 
                          : 'bg-surface-hover text-text-muted/40 border border-border cursor-not-allowed'}`}
                        title={imgInicio ? "Ver Foto Hodômetro Inicial" : "Foto Indisponível"}
                      >
                        {imgInicio ? <Camera className="w-4 h-4"/> : <ImageOff className="w-4 h-4"/>}
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => imgFim && onVisualizarFoto(imgFim)}
                        disabled={!imgFim}
                        className={`w-9 h-9 min-w-[36px] min-h-[36px] transition-all ${imgFim 
                          ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20 hover:scale-105 cursor-pointer shadow-sm' 
                          : 'bg-surface-hover text-text-muted/40 border border-border cursor-not-allowed'}`}
                        title={imgFim ? "Ver Foto Hodômetro Final" : "Foto Indisponível"}
                      >
                        {imgFim ? <Camera className="w-4 h-4"/> : <ImageOff className="w-4 h-4"/>}
                      </Button>
                    </div>
                  </td>

                  {(canEdit || canDelete) && (
                    <td className={`${TableStyles.td} text-right pr-8`}>
                      <div className="flex justify-end gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => onEditar(j.id)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-lg" onClick={() => onExcluir(j.id)} title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </>
              );
            }}
            renderMobile={(j) => {
              const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
              const imgInicio = getFotoUrl(j, 'inicio');
              const imgFim = getFotoUrl(j, 'fim');

              return (
                <MobileCardWithActions
                  onEditar={canEdit ? () => onEditar(j.id) : undefined}
                  onExcluir={canDelete ? () => onExcluir(j.id) : undefined}
                  className="p-5 flex flex-col gap-4 border-b border-border/60 hover:bg-surface-hover/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                        <span className="text-lg font-black leading-none">{DateHelper.getDia(j.dataInicio)}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-0.5">
                          {DateHelper.getMesCurto(j.dataInicio)}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <span className="font-mono font-black text-primary text-lg tracking-tight leading-none block">{j.veiculo?.placa || 'Sem Placa'}</span>
                        <span className="text-xs text-text-secondary font-medium">{j.operador?.nome || 'Motorista Excluído'}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      {j.dataFim ? (
                        <Badge variant="success" className="text-[9px] h-5 px-1.5 shadow-sm">FINALIZADA</Badge>
                      ) : (
                        <Badge variant="info" className="text-[9px] h-5 px-1.5 animate-pulse shadow-sm">EM ROTA</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-surface-hover/50 p-3 rounded-xl border border-border/40 mt-1">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">Trajeto Odómetro</span>
                      <span className="text-xs font-sans font-black tracking-tight text-text-main">{j.kmInicio} <span className="text-text-muted mx-0.5">→</span> {j.kmFim || '...'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Distância</span>
                      <span className="font-sans font-black tracking-tight text-text-main text-lg">
                        {kmPercorrido > 0 ? `${kmPercorrido.toLocaleString('pt-BR')} km` : '--'}
                      </span>
                    </div>
                  </div>

                  {j.observacoes && (
                    <div className={`p-2.5 rounded-xl border text-[10px] font-medium leading-relaxed flex items-start gap-2 ${
                      j.observacoes.includes('⚠️') 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-500' 
                        : 'bg-surface-hover border-border text-text-muted'
                    }`}>
                      {j.observacoes.includes('⚠️') && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      {j.observacoes.includes('⚠️') 
                        ? j.observacoes.replace(/⚠️\s*/g, '') 
                        : j.observacoes}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {imgInicio ? (
                      <Button variant="secondary" className="h-10 text-xs text-info bg-info/10 border-info/20 hover:bg-info/20 font-bold shadow-sm" onClick={() => onVisualizarFoto(imgInicio)}>
                        <Camera className="w-3.5 h-3.5 mr-2"/> Ver Início
                      </Button>
                    ) : (
                      <div className="h-10 flex items-center justify-center text-xs font-bold text-text-muted/50 bg-surface-hover rounded-xl border border-border border-dashed">
                        <ImageOff className="w-3.5 h-3.5 mr-2"/> Sem Início
                      </div>
                    )}
                    {imgFim ? (
                      <Button variant="secondary" className="h-10 text-xs text-success bg-success/10 border-success/20 hover:bg-success/20 font-bold shadow-sm" onClick={() => onVisualizarFoto(imgFim)}>
                        <Camera className="w-3.5 h-3.5 mr-2"/> Ver Fim
                      </Button>
                    ) : (
                      <div className="h-10 flex items-center justify-center text-xs font-bold text-text-muted/50 bg-surface-hover rounded-xl border border-border border-dashed">
                        <ImageOff className="w-3.5 h-3.5 mr-2"/> Sem Fim
                      </div>
                    )}
                  </div>
                </MobileCardWithActions>
              );
            }}
          />

          {historicoVisivel.length < totalFiltrado && (
            <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
              <Button 
                variant="secondary" 
                onClick={onCarregarMais}
                className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group cursor-pointer"
              >
                Ver mais {Math.min(itensPorPagina, totalFiltrado - historicoVisivel.length)} Viagens
                <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
