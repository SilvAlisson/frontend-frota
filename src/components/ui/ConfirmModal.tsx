import { useEffect } from 'react';
import { Button } from '../ui/Button';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils'; // 🪄 Nosso utilitário de classes

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
            btnVariant: 'primary' as const, // Primary para não ser destrutivo
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

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop com Blur Premium */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onCancel : undefined}
            />

            {/* Card do Modal com Animação de Zoom */}
            <div className="relative bg-surface rounded-2xl shadow-float border border-border/60 w-full max-w-sm overflow-hidden p-6 sm:p-8 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">

                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors disabled:opacity-50 hover:bg-surface-hover p-1.5 rounded-lg"
                    aria-label="Fechar modal"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-5 shadow-inner border border-white/20", style.iconBg, style.iconColor)}>
                        {style.icon}
                    </div>

                    <h3 className="text-xl font-black text-text-main tracking-tight">
                        {title}
                    </h3>

                    <div className="text-sm font-medium text-text-secondary mt-2.5 leading-relaxed">
                        {description}
                    </div>
                </div>

                {/* Botões usando o nosso Button Inteligente */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
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
                        isLoading={isLoading} // 🔥 A mágica do Loading entra aqui!
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}