import { FileText, FileWarning, Edit, RefreshCcw, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { getStatusInfo, getStatusBadge } from '../../utils/documentUtils';
import type { DocumentoLegal } from '../../types';

interface DocumentoCardProps {
  doc: DocumentoLegal;
  somenteLeitura: boolean;
  isDeleting: boolean;
  onEdit: (id: string) => void;
  onRenew: (id: string) => void;
  onDelete: (id: string, titulo: string) => void;
  onView: (url: string, titulo: string) => void;
}

export function DocumentoCard({
  doc,
  somenteLeitura,
  isDeleting,
  onEdit,
  onRenew,
  onDelete,
  onView
}: DocumentoCardProps) {
  const status = getStatusInfo(doc.dataValidade, doc.categoria);
  const isAst = doc.categoria === 'AST';
  const StatusIcon = status.icon;

  return (
    <div
      className={`
        flex flex-col p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-300 relative group h-full
        ${isDeleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}
        ${isAst
          ? 'bg-gradient-to-br from-surface to-warning-500/5 border-warning-500/30 hover:border-warning-500/50'
          : 'bg-surface border-border/60 hover:border-primary/40'}
      `}
    >
      {/* Grupo de Botões de Ação (Editar e Apagar) */}
      {!somenteLeitura && (
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all bg-surface-hover/80 lg:bg-transparent rounded-xl p-1 shadow-sm lg:shadow-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(doc.id)}
            disabled={isDeleting}
            className="h-8 w-8 text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar Detalhes"
            aria-label="Editar Detalhes"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {status.text.includes('Permanente') === false && doc.status !== 'ARQUIVADO' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRenew(doc.id)}
              disabled={isDeleting}
              className="h-8 w-8 text-text-muted hover:text-warning-600 hover:bg-warning-500/10 transition-colors"
              title="Renovar Documento"
              aria-label="Renovar Documento"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(doc.id, doc.titulo)}
            disabled={isDeleting}
            className="h-8 w-8 text-text-muted hover:text-error hover:bg-error/10 transition-colors opacity-50 hover:opacity-100"
            title="Remover Permanentemente (Admin)"
            aria-label="Remover Permanentemente (Admin)"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-error" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      )}

      <div className="flex items-start gap-4 flex-1">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-inner ${isAst ? 'bg-warning-500/10 text-warning-600 border-warning-500/20' : 'bg-surface-hover/80 text-text-secondary border-border/60'}`}>
          {isAst ? <FileWarning className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0 pr-16 lg:pr-8 group-hover:pr-16 transition-all">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] ${isAst ? 'text-warning-700 bg-warning-500/10 border border-warning-500/20' : 'text-text-secondary bg-surface-hover border border-border/60'}`}>
              {doc.categoria.replace(/_/g, ' ')}
            </span>
            {doc.veiculoId && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black bg-primary/10 text-primary border border-primary/20 tracking-widest">
                VINCULADO
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black tracking-widest border ${getStatusBadge(doc.status).color}`}>
              {getStatusBadge(doc.status).text}
            </span>
          </div>

          <h4 className="font-black text-base text-text-main truncate tracking-tight leading-tight mb-1" title={doc.titulo}>{doc.titulo}</h4>
          <p className="text-xs text-text-secondary font-medium line-clamp-2 min-h-[2.5em] opacity-80">
            {doc.descricao || <span className="italic opacity-60">Sem anotações complementares.</span>}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
        <div className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${doc.status === 'ARQUIVADO' ? 'bg-surface-hover/80 text-text-muted border-border/80' : status.color}`}>
          {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
          {doc.status === 'ARQUIVADO' ? 'Histórico' : status.text}
        </div>

        <button
          onClick={() => onView(doc.arquivoUrl, doc.titulo)}
          className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-white bg-primary/10 hover:bg-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm focus-ring touch-target"
          title="Visualizar Documento"
        >
          Visualizar<ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
