import { useEffect } from 'react';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

type ModalVariant = 'danger' | 'primary' | 'warning' | 'success';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: React.ReactNode; // Permite passar JSX (ex: texto com negrito)
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

    // Fecha ao pressionar ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onCancel();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isLoading, onCancel]);

    if (!isOpen) return null;

    // Configuração de estilos e ícones
    const variants = {
        danger: {
            iconBg: 'bg-error/10',
            iconColor: 'text-error',
            btnVariant: 'danger' as const,
            icon: <AlertTriangle className="w-6 h-6" />
        },
        warning: {
            iconBg: 'bg-warning/10',
            iconColor: 'text-warning',
            // Como não criamos btn 'warning', usamos primary ou danger dependendo do contexto.
            // Aqui vou usar primary para não ser destrutivo, mas com destaque.
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

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop com Blur (Vidro) */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={!isLoading ? onCancel : undefined}
            />

            {/* Card do Modal */}
            <div className="relative bg-white rounded-2xl shadow-float w-full max-w-sm overflow-hidden p-6 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Botão de Fechar (X) no canto */}
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Ícone Circular */}
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${style.iconBg} mb-5 ${style.iconColor}`}>
                        {style.icon}
                    </div>

                    <h3 className="text-xl font-bold text-text-main tracking-tight">
                        {title}
                    </h3>

                    <div className="text-sm text-text-secondary mt-2 leading-relaxed">
                        {description}
                    </div>
                </div>

                {/* Footer de Ações */}
                <div className="flex gap-3 mt-8">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 justify-center"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>

                    <Button
                        type="button"
                        variant={style.btnVariant}
                        className="flex-1 justify-center shadow-lg"
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}