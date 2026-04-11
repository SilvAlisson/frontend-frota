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
 * Apresenta ao usuário as anomalias detectadas e pergunta "É isso mesmo?",
 * evitando registros com erro de digitação (ex: R$700.000 por engano).
 *
 * - Anomalias `warning` → permitem confirmar ou corrigir.
 * - Anomalias `error`   → apenas mostram o bloqueio e permitem corrigir.
 *
 * Acessibilidade: role="alertdialog" + foco gerenciado conforme WCAG 2.1.
 */
export function ModalConfirmarAnomalia({
  anomalias,
  custoTotalFormatado,
  onConfirmar,
  onCorrigir,
  isLoading = false,
}: ModalConfirmarAnomaliaProps) {
  if (anomalias.length === 0) return null;

  const temBloqueio = anomalias.some((a) => a.nivel === 'error');
  const avisos      = anomalias.filter((a) => a.nivel === 'warning');
  const erros       = anomalias.filter((a) => a.nivel === 'error');

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="anomalia-titulo"
      aria-describedby="anomalia-descricao"
    >
      <div
        className={cn(
          'relative w-full max-w-lg bg-surface rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200',
          temBloqueio ? 'border-error/50' : 'border-warning/50'
        )}
      >
        {/* ── Cabeçalho ── */}
        <div
          className={cn(
            'flex items-center gap-4 px-6 py-5 border-b rounded-t-3xl',
            temBloqueio
              ? 'bg-error/10 border-error/20'
              : 'bg-warning/10 border-warning/20'
          )}
        >
          <div
            className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm',
              temBloqueio
                ? 'bg-error/10 border-error/30 text-error'
                : 'bg-warning/10 border-warning/30 text-warning'
            )}
            aria-hidden="true"
          >
            {temBloqueio
              ? <XCircle className="w-6 h-6" />
              : <AlertTriangle className="w-6 h-6" />
            }
          </div>
          <div>
            <h2
              id="anomalia-titulo"
              className={cn(
                'text-lg font-black tracking-tight leading-tight',
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

        {/* ── Corpo ── */}
        <div className="px-6 py-5 space-y-4" id="anomalia-descricao">
          {/* Destaque do custo total */}
          <div className="flex items-center justify-between bg-surface-hover/50 border border-border/60 rounded-2xl px-5 py-4">
            <span className="text-sm font-bold text-text-secondary">Custo Total Calculado:</span>
            <span
              className={cn(
                'text-2xl font-black font-mono',
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

        {/* ── Rodapé com ações ── */}
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
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
    </div>
  );
}
