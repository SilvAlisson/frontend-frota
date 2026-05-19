import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import type { AnomaliaAbastecimento } from '../../utils/validateAbastecimento';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ModalConfirmarAnomaliaProps {
  /** Lista de anomalias detectadas. Modal só aparece se não-vazia. */
  anomalias: AnomaliaAbastecimento[];
  /** Custo total formatado para exibição em destaque. */
  custoTotalFormatado: string;
  /** Chamado quando o usuário confirma que os valores estão corretos e deseja prosseguir. */
  onConfirmar: () => void;
  /** Chamado quando o usuário decide voltar e corrigir os valores. */
  onCorrigir: () => void;
  /** Indica se está em modo de apenas aviso (sem bloqueio). */
  isLoading?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * **ModalConfirmarAnomalia** — Modal de confirmação para abastecimentos com
 * valores atípicos.
 *
 * Acessibilidade: role="alertdialog" + aria-labelledby/describedby conforme WCAG 2.1.
 * Renderizado via createPortal para isolamento correto de z-index.
 */
export function ModalConfirmarAnomalia({
  anomalias,
  custoTotalFormatado,
  onConfirmar,
  onCorrigir,
  isLoading = false,
}: ModalConfirmarAnomaliaProps) {
  const titleId = useId();
  const descId = useId();

  const temBloqueio = anomalias.some((a) => a.nivel === 'error');
  const avisos      = anomalias.filter((a) => a.nivel === 'warning');
  const erros       = anomalias.filter((a) => a.nivel === 'error');

  // Lock de scroll do body
  useEffect(() => {
    if (anomalias.length > 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [anomalias.length]);

  if (anomalias.length === 0) return null;

  return createPortal(
    /* Overlay */
    <div
      className="fixed inset-0 z-max flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        className={cn(
          'relative w-full max-w-lg bg-surface rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200',
          // Altura máxima segura com scroll interno para não ultrapassar a viewport
          'max-h-[92dvh] flex flex-col',
          temBloqueio ? 'border-error/50' : 'border-warning/50'
        )}
      >
        {/* ── Cabeçalho (fixo, não scrollável) ── */}
        <div
          className={cn(
            'flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b rounded-t-3xl shrink-0',
            temBloqueio
              ? 'bg-error/10 border-error/20'
              : 'bg-warning/10 border-warning/20'
          )}
        >
          <div
            className={cn(
              'h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm',
              temBloqueio
                ? 'bg-error/10 border-error/30 text-error'
                : 'bg-warning/10 border-warning/30 text-warning'
            )}
            aria-hidden="true"
          >
            {temBloqueio
              ? <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              : <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            }
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className={cn(
                'text-base sm:text-lg font-black tracking-tight leading-tight',
                temBloqueio ? 'text-error' : 'text-warning'
              )}
            >
              {temBloqueio ? 'Valor Bloqueado' : 'Valor Atípico Detectado'}
            </h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-0.5">
              {temBloqueio ? 'Corrija antes de prosseguir' : 'É isso mesmo?'}
            </p>
          </div>
        </div>

        {/* ── Corpo (scrollável se conteúdo for grande) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 sm:py-5 space-y-4 min-h-0" id={descId}>
          {/* Destaque do custo total — flex-wrap para valores longos */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-hover/50 border border-border/60 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
            <span className="text-sm font-bold text-text-secondary shrink-0">Custo Total Calculado:</span>
            <span
              className={cn(
                'text-xl sm:text-2xl font-black font-mono break-all',
                temBloqueio ? 'text-error' : 'text-warning'
              )}
              aria-label={`Valor total: ${custoTotalFormatado}`}
            >
              {custoTotalFormatado}
            </span>
          </div>

          {/* Lista de anomalias */}
          <ul className="space-y-2" role="list" aria-label="Anomalias detectadas">
            {erros.map((a) => (
              <li
                key={a.codigo}
                className="flex items-start gap-3 bg-error/8 border border-error/20 rounded-xl px-4 py-3"
                role="listitem"
              >
                <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-error font-medium leading-relaxed">{a.mensagem}</p>
              </li>
            ))}
            {avisos.map((a) => (
              <li
                key={a.codigo}
                className="flex items-start gap-3 bg-warning/8 border border-warning/20 rounded-xl px-4 py-3"
                role="listitem"
              >
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-text-main font-medium leading-relaxed">{a.mensagem}</p>
              </li>
            ))}
          </ul>

          {/* Mensagem contextual */}
          {!temBloqueio && (
            <p className="text-xs text-text-muted font-medium leading-relaxed px-1 flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" aria-hidden="true" />
              Se os valores estiverem corretos, clique em "Sim, confirmar". Caso contrário, volte e corrija os campos.
            </p>
          )}
        </div>

        {/* ── Rodapé com ações (fixo, não scrollável) ── */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex flex-col-reverse sm:flex-row gap-3 shrink-0 border-t border-border/30">
          <Button
            variant="secondary"
            onClick={onCorrigir}
            disabled={isLoading}
            className="flex-1"
            aria-label="Voltar ao formulário para corrigir os valores"
          >
            ← Corrigir Valores
          </Button>

          {!temBloqueio && (
            <Button
              variant="primary"
              onClick={onConfirmar}
              isLoading={isLoading}
              className={cn(
                'flex-1 font-black',
                'bg-warning hover:bg-warning/90 text-white shadow-button border-warning/30'
              )}
              aria-label="Confirmar que os valores estão corretos e prosseguir"
            >
              Sim, Confirmar
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
