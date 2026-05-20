import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    const titleId = useId();
    const descId = useId();

    // Lock de scroll do body
    useEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    // Fechar via ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onCancel();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isLoading, onCancel]);

    if (!isOpen) return null;

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

    return createPortal(
        <div
            className="fixed inset-0 z-max flex items-center justify-center p-4 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
        >
            {/* Backdrop com Blur Premium */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={!isLoading ? onCancel : undefined}
                aria-hidden="true"
            />

            {/* Card do Modal — viewport-safe */}
            <div className="relative bg-surface rounded-2xl shadow-2xl shadow-black/60 border border-white/10 w-full max-w-sm max-h-[92dvh] overflow-y-auto scrollbar-thin p-5 sm:p-6 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">

                {/* Botão fechar */}
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors disabled:opacity-50 hover:bg-surface-hover rounded-xl"
                    aria-label="Fechar modal"
                >
                    <X className="w-5 h-5" />
                </button>

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
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
        </div>,
        document.body
    );
}
