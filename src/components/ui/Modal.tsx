import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Drawer } from 'vaul';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    
    // Bloqueia o scroll do body quando o modal abre
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

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !isOpen) return null;

    // --- MODO MOBILE (GAVETA / DRAWER - VAUL) ---
    if (!isDesktop) {
        return (
            <Drawer.Root 
                open={isOpen} 
                onOpenChange={(open) => !open && onClose()} 
                shouldScaleBackground
                // dragResistanceRatio removido pois causava erro de tipo
            >
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9990]" />
                    
                    <Drawer.Content 
                        className={cn(
                            "bg-surface flex flex-col rounded-t-[20px] mt-24 fixed bottom-0 left-0 right-0 z-[9991] outline-none border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)]",
                            "h-[94vh]", // Altura fixa de 94% da tela no mobile
                            className
                        )}
                    >
                        {/* Pega-mão (Handle) */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border/60 mt-4 mb-2" />
                        
                        <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative min-h-0">
                            {title && (
                                <div className="px-6 pb-4 text-center border-b border-border/50 shrink-0">
                                    <Drawer.Title className="font-bold text-lg text-text-main tracking-tight">
                                        {title}
                                    </Drawer.Title>
                                </div>
                            )}
                            
                            {/* Conteúdo Scrollável Isolado */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
                                {children}
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    // --- MODO DESKTOP (PORTAL + MODAL FIXO) ---
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={cn(
                    "relative bg-surface rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg flex flex-col",
                    "max-h-[90vh]", 
                    "transform transition-all animate-in zoom-in-95 duration-200 ease-out",
                    className
                )}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-surface/95 backdrop-blur rounded-t-2xl z-10">
                    {title && (
                        <h3 className="text-lg font-bold text-text-main tracking-tight font-sans">
                            {title}
                        </h3>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors ml-auto"
                        aria-label="Fechar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative w-full rounded-b-2xl bg-surface min-h-0 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}