import { useEffect, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Drawer } from 'vaul';

type ModalVariant = 'danger' | 'primary' | 'warning' | 'success';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    variant?: ModalVariant;
}

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

export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    isLoading = false,
    variant = 'danger'
}: ConfirmModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const titleId = useId();
    const descId = useId();

    // Lock de scroll do body (Desktop)
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

    // Fechar via ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onCancel();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isLoading, onCancel]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !isOpen) return null;

    const variants = {
        danger: {
            iconBg: 'bg-error/10',
            iconColor: 'text-error',
            btnVariant: 'danger' as const,
            icon: <AlertTriangle className="w-6 h-6" />
        },
        warning: {
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-600',
            btnVariant: 'primary' as const,
            icon: <AlertTriangle className="w-6 h-6" />
        },
        primary: {
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            btnVariant: 'primary' as const,
            icon: <Info className="w-6 h-6" />
        },
        success: {
            iconBg: 'bg-success/10',
            iconColor: 'text-success',
            btnVariant: 'success' as const,
            icon: <CheckCircle2 className="w-6 h-6" />
        }
    };

    const style = variants[variant];

    const content = (
        <div className="flex flex-col items-center text-center pt-2">
            <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-4 shadow-inner border border-white/20", style.iconBg, style.iconColor)}>
                {style.icon}
            </div>

            <h3 id={titleId} className="text-lg sm:text-xl font-black text-text-main tracking-tight">
                {title}
            </h3>

            <div id={descId} className="text-sm font-medium text-text-secondary mt-2 leading-relaxed">
                {description}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 w-full"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    {cancelLabel}
                </Button>

                <Button
                    type="button"
                    variant={style.btnVariant}
                    className="flex-1 w-full"
                    onClick={onConfirm}
                    isLoading={isLoading}
                >
                    {confirmLabel}
                </Button>
            </div>
        </div>
    );

    // --- MODO MOBILE (GAVETA / DRAWER - VAUL) ---
    if (!isDesktop) {
      return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && !isLoading && onCancel()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-overlay" />
            <Drawer.Content 
              className="bg-surface flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 z-modal outline-none border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]"
            >
              <Drawer.Title className="sr-only">{title || "Confirmação"}</Drawer.Title>
              <Drawer.Description className="sr-only">Conteúdo de confirmação</Drawer.Description>
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border/80 mt-4 mb-2" />
              <div className="p-6 pb-safe">
                {content}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }

    // --- MODO DESKTOP (PORTAL + MODAL FIXO) ---
    return createPortal(
        <div
            className="fixed inset-0 z-max flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
        >
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={!isLoading ? onCancel : undefined}
                aria-hidden="true"
            />
            <div className="relative bg-surface rounded-[2rem] shadow-2xl shadow-black/60 border border-white/10 w-full max-w-sm max-h-[92dvh] overflow-y-auto scrollbar-thin p-5 sm:p-6 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 z-10">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors disabled:opacity-50 hover:bg-surface-hover rounded-xl"
                    aria-label="Fechar modal"
                >
                    <X className="w-5 h-5" />
                </button>
                {content}
            </div>
        </div>,
        document.body
    );
}
