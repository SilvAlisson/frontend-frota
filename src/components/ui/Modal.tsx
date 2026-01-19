import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // Para ajustar largura (ex: max-w-2xl, max-w-4xl)
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {

    // Fecha ao pressionar ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">

            {/* Backdrop (Vidro Escuro) */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Container do Modal */}
            <div
                className={cn(
                    "relative bg-white rounded-2xl shadow-float w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]",
                    "transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
                    className
                )}
            >
                {/* Header (Fixo) */}
                {/* CORREÇÃO: Removemos a verificação (title || onClose) pois onClose é obrigatório */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
                    {title && (
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight font-sans">
                            {title}
                        </h3>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-auto"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Com Scroll) */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}