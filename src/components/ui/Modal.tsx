import React, { useEffect, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Drawer } from 'vaul';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  nested?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, nested = false }: ModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const titleId = useId();

  // Bloqueia o scroll do body quando o modal desktop abre
  useEffect(() => {
    if (isOpen && isDesktop) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, isDesktop]);

  // Restaura o scroll do Viewport mobile ao fechar (Bug de teclado vazio do iOS)
  useEffect(() => {
    if (!isOpen && !isDesktop) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, isDesktop]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Acessibilidade: Fechar via ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  // --- MODO MOBILE (GAVETA / DRAWER - VAUL) ---
  if (!isDesktop) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        shouldScaleBackground
        nested={nested}
        dismissible={false}
        repositionInputs={false} // Evita que o Vaul empurre a tela e cause o bug do espaço vazio
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-overlay" />

          <Drawer.Content
            className={cn(
              "bg-surface flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 z-modal outline-none border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]",
              className
            )}
            style={{
              maxHeight: 'calc(100svh - 2rem)',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
            }}
            aria-describedby={undefined}
          >
            {/* Pega-mão (Handle) */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border/80 mt-4 mb-2" />

            {/* 🔥 A SOLUÇÃO DEFINITIVA ESTÁ AQUI 🔥 */}
            {/* Título e Descrição OBRIGATÓRIOS, sempre montados e invisíveis para o usuário */}
            <Drawer.Title className="sr-only">
              {title || "Caixa de diálogo"}
            </Drawer.Title>
            
            <Drawer.Description className="sr-only">
              {title ? `Conteúdo sobre ${title}` : "Conteúdo da janela modal"}
            </Drawer.Description>

            {/* Cabeçalho Visual: Usa HTML normal (h3) em vez de componentes Radix */}
            {title && (
              <div className="px-6 pb-4 flex items-center justify-between border-b border-border/50 shrink-0">
                <h3 id={titleId} className="font-black text-xl text-text-main tracking-tight">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-3 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-surface-hover transition-all active:scale-95 bg-surface-hover/50"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* data-vaul-no-drag impede o Vaul de roubar o toque na área de scroll */}
            <div
              data-vaul-no-drag
              className="flex-1 overflow-y-auto overflow-x-hidden p-5 scrollbar-thin min-h-0 relative overscroll-contain"
            >
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // --- MODO DESKTOP (PORTAL + MODAL FIXO) ---
  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={undefined} 
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 starting:opacity-0 starting:backdrop-blur-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card do Modal */}
      <div
        className={cn(
          "relative bg-surface rounded-[2rem] shadow-2xl shadow-black/60 border border-white/10 flex flex-col",
          "w-full max-w-lg",
          "max-h-[92dvh]",
          "transform transition-all duration-300 ease-out starting:opacity-0 starting:scale-95 starting:translate-y-4",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-border/50 shrink-0 bg-surface/95 backdrop-blur rounded-t-[2rem] z-10">
          {title ? (
            <h3 id={titleId} className="text-lg sm:text-xl font-black text-text-main tracking-tight">
              {title}
            </h3>
          ) : (
            <div /> // Elemento vazio para manter o botão "X" alinhado à direita
          )}
          <button
            onClick={onClose}
            className="p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-surface-hover transition-all active:scale-95 ml-auto"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Corpo com scroll interno */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full rounded-b-[2rem] bg-surface scrollbar-thin min-h-0">
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}