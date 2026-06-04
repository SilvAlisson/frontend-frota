import { Filter, Plus, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AcaoSST, ProgramaSST } from '../../../hooks/useSST';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { EmptyState } from '../../ui/EmptyState';
import { Badge } from '../../ui/Badge';
import { PROGRAMAS, PROGRAMA_CORES, STATUS_CONFIG } from '../constants';

interface PlanoAcaoSSTProps {
  acoesFiltradas: AcaoSST[];
  filtroPrograma: ProgramaSST | '';
  setFiltroPrograma: (prog: ProgramaSST | '') => void;
  abrirNovaAcao: () => void;
  abrirEdicao: (acao: AcaoSST) => void;
  setAcaoParaExcluir: (acao: AcaoSST) => void;
}

export function PlanoAcaoSST({
  acoesFiltradas,
  filtroPrograma,
  setFiltroPrograma,
  abrirNovaAcao,
  abrirEdicao,
  setAcaoParaExcluir,
}: PlanoAcaoSSTProps) {
  return (
    <div id="sst-tab-plano" role="tabpanel" aria-label="Plano de Ação" className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="w-full sm:w-72">
          <Select
            label="Filtrar por Programa"
            options={PROGRAMAS}
            value={filtroPrograma}
            onChange={(e) => setFiltroPrograma(e.target.value as ProgramaSST | '')}
            icon={<Filter className="w-4 h-4" />}
            containerClassName="!mb-0"
          />
        </div>
        {filtroPrograma && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltroPrograma('')}
            className="text-text-muted h-11"
          >
            Limpar filtro
          </Button>
        )}
      </div>

      {acoesFiltradas.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma ação cadastrada"
          description="Comece cadastrando a primeira ação do Plano de SST."
          action={
            <Button onClick={abrirNovaAcao} icon={<Plus className="w-4 h-4" />}>
              Cadastrar Primeira Ação
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden lg:block rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Plano de Ação SST">
                <thead>
                  <tr className="bg-surface-hover/60 border-b border-border/60">
                    {['Ação', 'Unid.', 'Programa', 'Responsável', 'Vencimento', 'Realizado', 'Status', 'Obs.', ''].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-text-muted whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {acoesFiltradas.map((acao) => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0);
                    const venc = new Date(acao.vencimento);
                    const isVencida = venc < hoje && acao.status !== 'REALIZADO';
                    return (
                      <tr
                        key={acao.id}
                        className={cn(
                          'hover:bg-surface-hover/30 transition-colors group',
                          isVencida && 'bg-error/5'
                        )}
                      >
                        <td className="px-4 py-4 max-w-[220px]">
                          <p className="font-medium text-text-main text-xs leading-relaxed line-clamp-3" title={acao.acao}>{acao.acao}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-text-muted whitespace-nowrap">{acao.unidade}</td>
                        <td className="px-4 py-4">
                          <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border', PROGRAMA_CORES[acao.programa])}>
                            {acao.programa}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-text-secondary font-medium whitespace-nowrap">{acao.responsaveis}</td>
                        <td className="px-4 py-4 text-xs font-mono font-bold text-text-main whitespace-nowrap">
                          {new Date(acao.vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-4 text-xs text-text-muted">{acao.realizado || '—'}</td>
                        <td className="px-4 py-4">
                          <Badge variant={STATUS_CONFIG[acao.status].variant}>
                            {STATUS_CONFIG[acao.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 max-w-[140px]">
                          <p className="text-xs text-text-muted line-clamp-2" title={acao.observacao ?? ''}>{acao.observacao || '—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Editar ação: ${acao.acao}`}
                              onClick={() => abrirEdicao(acao)}
                              className="h-8 w-8 text-text-muted hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Excluir ação: ${acao.acao}`}
                              onClick={() => setAcaoParaExcluir(acao)}
                              className="h-8 w-8 text-text-muted hover:text-error hover:bg-error/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {acoesFiltradas.map((acao) => (
              <div
                key={acao.id}
                className="bg-surface border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', PROGRAMA_CORES[acao.programa])}>
                      {acao.programa}
                    </span>
                    <Badge variant={STATUS_CONFIG[acao.status].variant}>
                      {STATUS_CONFIG[acao.status].label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label={`Editar: ${acao.acao}`} onClick={() => abrirEdicao(acao)} className="h-8 w-8 text-text-muted hover:text-primary">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Excluir: ${acao.acao}`} onClick={() => setAcaoParaExcluir(acao)} className="h-8 w-8 text-text-muted hover:text-error">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm font-medium text-text-main leading-relaxed">{acao.acao}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-hover/40 rounded-xl p-3 border border-border/40 text-xs">
                  <div>
                    <span className="text-text-muted font-bold uppercase tracking-wider block text-[9px] mb-0.5">Responsável</span>
                    <span className="text-text-main font-bold">{acao.responsaveis}</span>
                  </div>
                  <div>
                    <span className="text-text-muted font-bold uppercase tracking-wider block text-[9px] mb-0.5">Vencimento</span>
                    <span className="text-text-main font-mono font-bold">{new Date(acao.vencimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {acao.realizado && (
                    <div className="col-span-2">
                      <span className="text-text-muted font-bold uppercase tracking-wider block text-[9px] mb-0.5">Realizado</span>
                      <span className="text-text-main font-medium">{acao.realizado}</span>
                    </div>
                  )}
                </div>
                {acao.observacao && (
                  <p className="text-xs text-text-muted italic border-t border-border/40 pt-3">{acao.observacao}</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-text-muted text-right font-medium">{acoesFiltradas.length} ação(ões) exibida(s)</p>
        </>
      )}
    </div>
  );
}
