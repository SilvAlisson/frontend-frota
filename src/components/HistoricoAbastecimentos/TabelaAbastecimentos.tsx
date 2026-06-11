import { Calendar, Gauge, Receipt, Droplets, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DateHelper } from '../../lib/dateHelper';
import { formatarDinheiro } from '../../lib/formatters';
import type { Abastecimento } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';
import { DropdownAcoes } from '../ui/DropdownAcoes';
import { MobileCardWithActions } from '../ui/MobileCardWithActions';
import { DataTable } from '../ui/DataTable';
import { Card } from '../ui/Card';

interface TabelaAbastecimentosProps {
  historicoVisivel: Abastecimento[];
  totalFiltrado: number;
  loading: boolean;
  canEdit: boolean;
  userRole: string;
  onEditar: (id: string) => void;
  onExcluir: (id: string) => void;
  onVisualizarDoc: (url: string, titulo: string) => void;
  onCarregarMais: () => void;
  onAprovar: (id: string) => Promise<void>;
  itensPorPagina: number;
}

export function TabelaAbastecimentos({
  historicoVisivel,
  totalFiltrado,
  loading,
  canEdit,
  userRole,
  onEditar,
  onExcluir,
  onVisualizarDoc,
  onCarregarMais,
  onAprovar,
  itensPorPagina
}: TabelaAbastecimentosProps) {

  const getCombustivelBadge = (ab: Abastecimento) => {
    const itemCombustivel = ab.itens?.find(i => i.produto.tipo === 'COMBUSTIVEL');
    const nome = itemCombustivel ? itemCombustivel.produto.nome : 'Outros';
    
    const nomeUpper = nome.toUpperCase();
    let variant: "neutral" | "warning" | "success" | "info" = "neutral";
    
    if (nomeUpper.includes('DIESEL')) variant = "neutral";
    if (nomeUpper.includes('GASOLINA')) variant = "warning";
    if (nomeUpper.includes('ETANOL')) variant = "success";
    if (nomeUpper.includes('ARLA')) variant = "info";

    return <Badge variant={variant}>{nome}</Badge>;
  };

  return (
    <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
      {loading ? (
        <div className="p-6 sm:p-8 space-y-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <DataTable
            virtualized={true}
            data={historicoVisivel}
            emptyMessage="Nenhum abastecimento encontrado com estes filtros."
            desktopGridCols="grid-cols-[1.5fr_2fr_1.5fr_1.5fr_1fr]"
            columns={[
              {
                header: 'Data e Hora',
                headerClassName: 'pl-8 py-5 text-left',
                className: 'pl-8 py-5',
                cell: (ab: Abastecimento) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-text-main flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-muted/60" />
                      {DateHelper.getCompleta(ab.dataHora)}
                    </span>
                    <span className="text-xs text-text-secondary font-mono ml-6 tracking-widest opacity-80">
                      {DateHelper.getHora(ab.dataHora)}
                    </span>
                  </div>
                )
              },
              {
                header: 'Identificação',
                headerClassName: 'text-left',
                className: 'py-5',
                cell: (ab: Abastecimento) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-mono font-black text-primary text-base tracking-tight">{ab.veiculo?.placa || 'N/D'}</span>
                    <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">{ab.operador?.nome || 'Sistema'}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-main font-bold bg-surface-hover px-2 py-1 rounded-md w-fit border border-border/60">
                      <Gauge className="w-3.5 h-3.5 opacity-60" /> {ab.kmOdometro.toLocaleString('pt-BR')} KM
                    </div>
                    {ab.observacoes && (
                      <div className="mt-1 text-[10px] text-text-muted italic line-clamp-2 max-w-[200px]" title={ab.observacoes}>
                        Obs: {ab.observacoes}
                      </div>
                    )}
                    {ab.status === 'PENDENTE_AVALIACAO' && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning font-bold bg-warning/10 px-2 py-1 rounded-md w-fit border border-warning/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> AGUARDANDO APROVAÇÃO
                      </div>
                    )}
                  </div>
                )
              },
              {
                header: 'Produto Abastecido',
                headerClassName: 'text-center',
                className: 'py-5 text-center',
                cell: (ab: Abastecimento) => (
                  <div className="flex flex-col gap-2.5 items-center justify-center">
                    {getCombustivelBadge(ab)}
                    {ab.fotoNotaFiscalUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onVisualizarDoc(ab.fotoNotaFiscalUrl || '', `Abastecimento - ${ab.veiculo?.placa || 'Veículo'}`)}
                            aria-label="Visualizar nota fiscal"
                            className="h-10 w-10 text-info hover:text-info bg-info/10 hover:bg-info/20 border border-info/20 mx-auto transition-all shadow-sm group"
                          >
                            <Receipt className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Visualizar Nota Fiscal</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )
              },
              {
                header: 'Custo Financeiro',
                headerClassName: 'text-center',
                className: 'py-5 text-center',
                cell: (ab: Abastecimento) => (
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <span className="font-mono font-black text-text-main text-base inline-block w-full">{formatarDinheiro(ab.custoTotal)}</span>
                    <span className="text-[11px] text-text-secondary font-bold flex items-center gap-1.5 bg-surface-hover w-fit px-1.5 py-0.5 rounded border border-border/50 mx-auto">
                      <Droplets className="w-3 h-3 text-info " />
                      {(ab.itens || []).map(i => `${i.quantidade}${i.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}`).join(' + ')}
                    </span>
                  </div>
                )
              },
              {
                header: 'Gestão',
                headerClassName: 'text-right pr-8',
                className: 'text-right pr-8 py-5',
                cell: (ab: Abastecimento) => (
                  <div className="flex items-center justify-end gap-2">
                    {ab.status === 'PENDENTE_AVALIACAO' && userRole === 'ADMIN' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => onAprovar(ab.id)}
                        className="h-8 bg-success/10 text-success border-success/20 hover:bg-success/20 whitespace-nowrap"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Aprovar
                      </Button>
                    )}
                    <DropdownAcoes 
                      onEditar={canEdit ? () => onEditar(ab.id) : undefined}
                      onExcluir={userRole === 'ADMIN' ? () => onExcluir(ab.id) : undefined}
                    />
                  </div>
                )
              }
            ]}
            renderMobile={(ab) => (
              <MobileCardWithActions 
                onEditar={canEdit ? () => onEditar(ab.id) : undefined}
                onExcluir={userRole === 'ADMIN' ? () => onExcluir(ab.id) : undefined}
                className="p-5 flex flex-col gap-4 border-b border-border/60 last:border-0 hover:bg-surface-hover/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                      <span className="text-lg font-black leading-none">{DateHelper.getDia(ab.dataHora)}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-0.5">
                        {DateHelper.getMesCurto(ab.dataHora)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <span className="font-mono font-black text-primary text-lg tracking-tight leading-none">{ab.veiculo?.placa || 'Sem Placa'}</span>
                      <span className="text-xs text-text-secondary font-medium mt-1">{ab.fornecedor?.nome || 'Fornecedor Local'}</span>
                      {ab.observacoes && (
                        <span className="text-[10px] text-text-muted italic mt-1 line-clamp-2" title={ab.observacoes}>
                          Obs: {ab.observacoes}
                        </span>
                      )}
                      {ab.status === 'PENDENTE_AVALIACAO' && (
                        <span className="mt-2 text-[9px] text-warning font-black uppercase tracking-widest bg-warning/10 px-2 py-0.5 rounded border border-warning/30 w-fit">
                          Requer Aprovação
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-surface-hover/50 p-3 rounded-xl border border-border/40">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-0.5">Custo</span>
                    <span className="font-mono font-black text-text-main">{formatarDinheiro(ab.custoTotal)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1.5">Produto</span>
                    {getCombustivelBadge(ab)}
                  </div>
                </div>
                
                {ab.fotoNotaFiscalUrl && (
                  <Button
                    variant="ghost"
                    onClick={() => onVisualizarDoc(ab.fotoNotaFiscalUrl || '', `Abastecimento - ${ab.veiculo?.placa || 'Veículo'}`)}
                    aria-label={`Visualizar nota fiscal do abastecimento de ${ab.veiculo?.placa || 'veículo'}`}
                    icon={<Receipt className="w-4 h-4" />}
                    className="w-full bg-info/10 text-info border border-info/20 hover:bg-info/20 mt-1"
                  >
                    Visualizar Nota de Serviço
                  </Button>
                )}

                {ab.status === 'PENDENTE_AVALIACAO' && userRole === 'ADMIN' && (
                  <Button
                    variant="secondary"
                    onClick={() => onAprovar(ab.id)}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="w-full bg-success/10 text-success border-success/20 hover:bg-success/20 mt-1"
                  >
                    Aprovar Abastecimento
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
                Carregar mais {Math.min(itensPorPagina, totalFiltrado - historicoVisivel.length)} registros
                <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
