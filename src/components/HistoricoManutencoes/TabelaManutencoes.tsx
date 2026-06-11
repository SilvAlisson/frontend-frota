import { Calendar, FileText, FileX, ChevronDown } from 'lucide-react';
import { DateHelper } from '../../lib/dateHelper';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';
import { DropdownAcoes } from '../ui/DropdownAcoes';
import { MobileCardWithActions } from '../ui/MobileCardWithActions';
import { ListaResponsiva } from '../ui/ListaResponsiva';
import { Card } from '../ui/Card';
import { TableStyles } from '../../styles/table';
import type { OrdemServico } from '../../types';

export const extrairPlaca = (placaBruta: string) => {
  if (!placaBruta) return '---';
  const match = placaBruta.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return placaBruta.trim();
};

interface TabelaManutencoesProps {
  historicoVisivel: OrdemServico[];
  totalFiltrado: number;
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEditar: (os: OrdemServico) => void;
  onExcluir: (id: string) => void;
  onVisualizarDoc: (url: string, titulo: string) => void;
  onCarregarMais: () => void;
  itensPorPagina: number;
}

export function TabelaManutencoes({
  historicoVisivel,
  totalFiltrado,
  loading,
  canEdit,
  canDelete,
  onEditar,
  onExcluir,
  onVisualizarDoc,
  onCarregarMais,
  itensPorPagina
}: TabelaManutencoesProps) {

  const getBadgeTipo = (tipo: string) => {
    const map: Record<string, "warning" | "info" | "success" | "neutral"> = {
      'CORRETIVA': 'warning',
      'PREVENTIVA': 'info',
      'LAVAGEM': 'success'
    };
    return <Badge variant={map[tipo] || 'neutral'}>{tipo}</Badge>;
  };

  const getBadgeStatus = (status: string) => {
    const map: Record<string, "warning" | "info" | "success" | "danger" | "neutral"> = {
      'PENDENTE': 'warning',
      'EM_ANDAMENTO': 'info',
      'CONCLUIDA': 'success',
      'CANCELADA': 'danger'
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

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
            emptyMessage="Nenhum Registro encontrado com estes filtros."
            desktopGridCols="grid-cols-[1.2fr_3fr_1.5fr_1fr_80px]"
            desktopHeader={
              <>
                <th className={`${TableStyles.th} justify-start text-left pl-8 py-5`}>Data da OS</th>
                <th className={`${TableStyles.th} justify-start text-left`}>Identificação</th>
                <th className={`${TableStyles.th} justify-center text-center whitespace-nowrap`}>Custo Financeiro</th>
                <th className={`${TableStyles.th} justify-center text-center whitespace-nowrap`}>Ticket Manutenção</th>
                <th className={`${TableStyles.th} justify-end text-right pr-8`}>Gestão</th>
              </>
            }
            renderDesktop={(os) => (
              <>
                <td className={`${TableStyles.td} justify-start text-left pl-8`}>
                  <div className="flex flex-col gap-2 items-start">
                    <span className="font-bold text-text-main flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-muted/60" />
                      {DateHelper.getCompleta(os.data)}
                    </span>
                    {getBadgeTipo(os.tipo)}
                  </div>
                </td>

                <td className={`${TableStyles.td} justify-start text-left min-w-0`}>
                  <div className="flex flex-col gap-1 max-w-[280px] min-w-0">
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="font-mono font-black text-primary text-base tracking-tight truncate">{extrairPlaca(os.veiculo?.placa || 'N/D')}</span>
                      <span className="text-[10px] bg-surface-hover px-1.5 py-0.5 rounded border border-border/60 font-bold uppercase tracking-widest text-text-secondary shrink-0">{os.veiculo?.modelo}</span>
                    </div>
                    <span className="text-xs text-text-secondary font-medium mt-1 truncate" title={os.fornecedor?.nome}>{os.fornecedor?.nome || 'Oficina Não Registrada'}</span>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1.5 leading-snug line-clamp-2" title={(os.itens || []).map(i => i.produto.nome).join(', ')}>
                      {(os.itens || []).map(i => i.produto.nome).join(', ')}
                    </p>
                    {os.observacoes && (
                      <div className="mt-1.5 text-[10px] text-text-muted italic line-clamp-2 max-w-[200px]" title={os.observacoes}>
                        Obs: {os.observacoes}
                      </div>
                    )}
                  </div>
                </td>

                <td className={`${TableStyles.td} justify-center text-center whitespace-nowrap`}>
                  <span className="font-mono font-black text-text-main text-base inline-block w-full">
                    {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </td>

                <td className={`${TableStyles.td} justify-center text-center`}>
                  {os.fotoComprovanteUrl ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onVisualizarDoc(os.fotoComprovanteUrl || '', `Manutenção - ${extrairPlaca(os.veiculo?.placa || '')}`)}
                          className="h-10 w-10 bg-info/10 text-info hover:bg-info/20 transition-all shadow-sm border border-info/20 group"
                          aria-label="Visualizar Nota de Serviço"
                        >
                          <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Visualizar Comprovante</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center p-2 rounded-xl bg-surface-hover text-text-muted/40 border border-border/50 cursor-not-allowed">
                          <FileX className="w-5 h-5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Sem anexo físico</TooltipContent>
                    </Tooltip>
                  )}
                </td>

                <td className={`${TableStyles.td} justify-end text-right pr-8`}>
                  <DropdownAcoes
                    onEditar={canEdit ? () => onEditar(os) : undefined}
                    onExcluir={canDelete ? () => onExcluir(os.id) : undefined}
                  />
                </td>
              </>
            )}
            renderMobile={(os) => (
              <MobileCardWithActions
                onEditar={canEdit ? () => onEditar(os) : undefined}
                onExcluir={canDelete ? () => onExcluir(os.id) : undefined}
                className="p-5 flex flex-col gap-4 border-b border-border/60 hover:bg-surface-hover/30 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                      <span className="text-lg font-black leading-none">{DateHelper.getDia(os.data)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                        {DateHelper.getMesCurto(os.data)}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-mono font-black text-primary text-lg tracking-tight leading-none block mb-1 truncate">{extrairPlaca(os.veiculo?.placa || 'Sem Placa')}</span>
                      <span className="text-xs text-text-secondary font-medium truncate">{os.fornecedor?.nome || 'Oficina não registrada'}</span>
                      {os.observacoes && (
                        <span className="text-[10px] text-text-muted italic mt-1 line-clamp-2" title={os.observacoes}>
                          Obs: {os.observacoes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <div className="scale-90 origin-right">
                        {getBadgeStatus(os.status)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-surface-hover/50 p-3 rounded-xl border border-border/40">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">Serviço</span>
                    {getBadgeTipo(os.tipo)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Custo da OS</span>
                    <span className="font-mono font-black text-text-main text-lg tracking-tighter">
                      {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                {os.fotoComprovanteUrl && (
                  <Button
                    variant="secondary"
                    className="w-full text-xs font-bold h-11 bg-info/10 text-info border-info/20 hover:bg-info/20 shadow-sm transition-all"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={() => onVisualizarDoc(os.fotoComprovanteUrl || '', `Manutenção - ${extrairPlaca(os.veiculo?.placa || '')}`)}
                  >
                    Visualizar Nota de Serviço
                  </Button>
                )}
              </MobileCardWithActions>
            )}
          />

          {historicoVisivel.length < totalFiltrado && (
            <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
              <Button
                variant="secondary"
                onClick={onCarregarMais}
                className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group"
              >
                Ver mais {Math.min(itensPorPagina, totalFiltrado - historicoVisivel.length)} Fichas
                <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
