import * as Dialog from '@radix-ui/react-dialog';
import { X, ZoomIn, Camera, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LightboxProps {
  /** URL da imagem a ser exibida. `null` ou `undefined` mantém o Lightbox fechado. */
  src: string | null | undefined;
  /** Texto alternativo descritivo da imagem (WCAG 1.1.1 — Nível A). */
  alt: string;
  /** Legenda exibida abaixo da imagem. Se omitida, herda o valor de `alt`. */
  caption?: string;
  /** Callback disparado ao fechar o Lightbox (ESC, clique no backdrop ou no botão X). */
  onClose: () => void;
  /** Classe extra para o container interno da imagem. */
  imageClassName?: string;
}

// ─── Tipos de estado da imagem ────────────────────────────────────────────────

type ImageStatus = 'loading' | 'loaded' | 'error';

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * **Lightbox** — Visualizador de imagem fullscreen construído sobre o
 * `@radix-ui/react-dialog`, garantindo:
 * - **Focus trap** automático (foco preso dentro do modal enquanto aberto)
 * - **Fechamento via ESC** nativo do Radix
 * - **aria-labelledby / aria-describedby** para leitores de tela
 * - **Estados de loading e erro** da imagem tratados com feedback visual
 * - **Dark mode** nativo via tokens do Design System KLIN
 */
export function Lightbox({ src, alt, caption, onClose, imageClassName }: LightboxProps) {
  const isOpen = !!src;
  const [imageStatus, setImageStatus] = useState<ImageStatus>('loading');

  // Reseta o estado da imagem sempre que uma nova URL é carregada
  useEffect(() => {
    if (src) setImageStatus('loading');
  }, [src]);

  const handleImageLoad = useCallback(() => setImageStatus('loaded'), []);
  const handleImageError = useCallback(() => setImageStatus('error'), []);

  const displayCaption = caption ?? alt;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>

        {/*
         * Overlay escuro com blur.
         * `animate-in fade-in` → micro-animação de 200ms (WCAG 2.3.3 / UX guideline)
         */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-[200] bg-black/90 backdrop-blur-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'duration-200'
          )}
        />

        {/*
         * Conteúdo do Dialog — centralizado na viewport.
         * `aria-labelledby` e `aria-describedby` são resolvidos pelo Radix
         * automaticamente via `Dialog.Title` e `Dialog.Description`.
         */}
        <Dialog.Content
          className={cn(
            'fixed inset-0 z-[201] flex flex-col items-center justify-center p-4 sm:p-8',
            'focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'duration-200'
          )}
          // Impede que cliques na área da imagem fechem o dialog acidentalmente
          onPointerDownOutside={onClose}
        >
          {/* ── Título oculto visualmente mas lido por screen readers ── */}
          <Dialog.Title className="sr-only">
            Visualizador de Imagem: {alt}
          </Dialog.Title>

          {/* ── Descrição oculta visualmente mas anunciada por screen readers ── */}
          <Dialog.Description className="sr-only">
            Pressione Escape ou clique fora da imagem para fechar o visualizador.
          </Dialog.Description>

          {/* ── Botão Fechar (topo direito) ── */}
          <Dialog.Close
            className={cn(
              'absolute top-4 right-4 sm:top-6 sm:right-6 z-10',
              'flex items-center justify-center h-10 w-10 rounded-full',
              'bg-white/10 hover:bg-white/25 text-white',
              'transition-all duration-150 shadow-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              'cursor-pointer'
            )}
            aria-label="Fechar visualizador de imagem"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Dialog.Close>

          {/* ── Área da imagem com estados de loading / loaded / error ── */}
          <div
            className="relative flex items-center justify-center w-full max-w-5xl"
            // Bloqueia propagação para que o click na imagem não feche o dialog
            onClick={(e) => e.stopPropagation()}
          >
            {/* Estado: CARREGANDO */}
            {imageStatus === 'loading' && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60"
                aria-live="polite"
                aria-label="Carregando imagem..."
              >
                <Loader2 className="w-10 h-10 animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium tracking-wide">Carregando imagem…</span>
              </div>
            )}

            {/* Estado: ERRO */}
            {imageStatus === 'error' && (
              <div
                className="flex flex-col items-center justify-center gap-4 text-white/70 py-16 px-8 text-center"
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle className="w-12 h-12 text-warning" aria-hidden="true" />
                <p className="text-base font-bold">Não foi possível carregar a imagem.</p>
                <p className="text-sm opacity-70">A URL pode estar expirada ou inacessível.</p>
              </div>
            )}

            {/* A imagem é sempre renderizada; `sr-only` gerencia visibilidade até carregar */}
            {src && (
              <img
                src={src}
                alt={alt}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={cn(
                  'max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl',
                  'ring-1 ring-white/10 transition-opacity duration-300',
                  imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0',
                  imageStatus === 'loading' && 'pointer-events-none',
                  imageClassName
                )}
              />
            )}
          </div>

          {/* ── Legenda ── */}
          {imageStatus === 'loaded' && displayCaption && (
            <p
              className={cn(
                'mt-5 text-white/60 text-sm font-bold uppercase tracking-widest',
                'flex items-center gap-2',
                'animate-in fade-in slide-in-from-bottom-2 duration-300'
              )}
              aria-label={`Legenda: ${displayCaption}`}
            >
              <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
              {displayCaption}
            </p>
          )}

          {/* ── Dica de teclado ── */}
          {imageStatus === 'loaded' && (
            <div className="mt-3 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <ZoomIn className="w-3.5 h-3.5 text-white/30" aria-hidden="true" />
              <span className="text-white/30 text-xs tracking-wider">
                Pressione <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/50">ESC</kbd> para fechar
              </span>
            </div>
          )}
        </Dialog.Content>

      </Dialog.Portal>
    </Dialog.Root>
  );
}
