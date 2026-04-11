import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Sistema de Variantes (espelha o Input.tsx) ────────────────────────────────

const textareaVariants = cva(
  // Base idêntica ao Input, adaptada para elemento <textarea>
  [
    'flex w-full text-sm transition-all duration-200 outline-none resize-none',
    'placeholder:text-text-muted/60',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'read-only:cursor-default read-only:bg-surface-hover/50 read-only:border-border/40',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-surface border border-border/60 rounded-xl',
          'focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background focus:border-primary',
          'shadow-sm hover:border-border',
          'disabled:bg-surface-hover/50 disabled:border-border/40',
          'text-text-main',
        ].join(' '),
        ghost: [
          'bg-transparent border-transparent rounded-xl',
          'hover:bg-surface-hover/80 focus:bg-surface-hover',
          'shadow-none focus:ring-0',
          'text-text-main',
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  /** Rótulo do campo — renderiza um `<label>` semanticamente vinculado via `htmlFor`. */
  label?: string;
  /** Mensagem de erro. Ativa estado visual de erro e é vinculada via `aria-describedby`. */
  error?: string;
  /** Texto de ajuda exibido abaixo do campo (helper text). Também vinculado via `aria-describedby`. */
  helperText?: string;
  /**
   * Quando `true`, o textarea cresce automaticamente conforme o usuário digita,
   * eliminando a necessidade de scrollbar interna.
   * @default false
   */
  autoResize?: boolean;
  /** Altura mínima em pixels quando `autoResize` está ativo. @default 80 */
  minHeight?: number;
  /** Classe extra para o div container externo. */
  containerClassName?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * **Textarea** — Campo de texto multilinha do Design System KLIN.
 *
 * Segue exatamente o mesmo padrão visual do `Input.tsx` e implementa:
 * - `aria-invalid` para sinalizar erro a tecnologias assistivas
 * - `aria-describedby` composto (error + helperText) conforme WCAG 1.3.1
 * - `autoResize` via `scrollHeight` para crescimento orgânico sem barra interna
 * - Estados `disabled` e `readOnly` com cursores e opacidades semânticos
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      autoResize = false,
      minHeight = 80,
      className,
      containerClassName,
      id,
      variant,
      onChange,
      style,
      rows = 3,
      ...rest
    },
    externalRef
  ) => {
    // ── IDs acessíveis ──────────────────────────────────────────────────────────
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    // Monta o aria-describedby apenas com os IDs que existem no DOM
    const ariaDescribedBy =
      [error ? errorId : null, helperText && !error ? helperId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    // ── Auto-resize ─────────────────────────────────────────────────────────────
    const internalRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Usa uma callback ref para unificar ref interna (auto-resize) e ref externa
     * (forwarded pelo consumidor, ex: react-hook-form).
     */
    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        if (typeof externalRef === 'function') {
          externalRef(node);
        } else if (externalRef) {
          (externalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [externalRef]
    );

    /** Ajusta a altura do textarea ao seu conteúdo atual. */
    const adjustHeight = useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      // Reset para calcular o scrollHeight real sem a altura atual inflada
      el.style.height = `${minHeight}px`;
      el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
    }, [autoResize, minHeight]);

    // Ajusta na montagem (caso o campo já tenha valor inicial)
    useEffect(() => {
      adjustHeight();
    }, [adjustHeight]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        onChange?.(e);
      },
      [adjustHeight, onChange]
    );

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>

        {/* ── Label ── */}
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none ml-1"
          >
            {label}
          </label>
        )}

        {/* ── Campo + ícone de erro ── */}
        <div className="relative group w-full">
          <textarea
            ref={setRef}
            id={textareaId}
            rows={autoResize ? undefined : rows}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            className={cn(
              textareaVariants({ variant }),
              // Padding padrão (horizontal confortável, vertical generoso)
              'px-4 py-3',
              // Espaço para o ícone de erro não sobrepor o texto
              error ? 'pr-11 border-error border text-error focus:border-error focus:ring-error/20 placeholder:text-error/50' : '',
              // Esconde resize handle quando autoResize está ativo
              autoResize ? 'overflow-hidden' : 'resize-y',
              className
            )}
            style={{
              minHeight: `${minHeight}px`,
              ...style,
            }}
            {...rest}
          />

          {/* ── Ícone de erro embutido (canto superior direito) ── */}
          {error && (
            <div
              className="absolute right-3 top-3 text-error pointer-events-none animate-in zoom-in-95 duration-200"
              aria-hidden="true"
            >
              <AlertCircle className="w-5 h-5 opacity-80" />
            </div>
          )}
        </div>

        {/* ── Mensagem de erro (tem prioridade sobre helperText) ── */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-error font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ml-1 mt-0.5"
          >
            {error}
          </p>
        )}

        {/* ── Helper text (só exibido quando não há erro) ── */}
        {helperText && !error && (
          <p
            id={helperId}
            className="text-xs text-text-muted font-medium ml-1 mt-0.5 leading-relaxed"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
