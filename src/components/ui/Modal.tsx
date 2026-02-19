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
    nested?: boolean; // 🔑 Permite abrir um modal sobre o outro perfeitamente
}

export function Modal({ isOpen, onClose, title, children, className, nested = false }: ModalProps) {
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
                nested={nested} // 🔑 Ativa a animação de empilhar gavetas
            >
                <Drawer.Portal>
                    {/* 🔑 Z-index unificado no 9999 para que o fundo sempre cubra a gaveta de trás */}
                    <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]" />
                    
                    <Drawer.Content 
                        className={cn(
                            "bg-surface flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 z-[9999] outline-none border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)]",
                            "max-h-[92dvh]", // 🔑 Evita que o modal estique até o topo desnecessariamente e usa dvh para a barra do navegador
                            "pb-[max(1.5rem,env(safe-area-inset-bottom))]", // 🔑 Salva os botões de serem esmagados pela barra do iPhone
                            className
                        )}
                    >
                        {/* Pega-mão (Handle) */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border/80 mt-4 mb-2" />
                        
                        {title && (
                            <div className="px-6 pb-4 text-center border-b border-border/50 shrink-0">
                                <Drawer.Title className="font-black text-xl text-text-main tracking-tight">
                                    {title}
                                </Drawer.Title>
                            </div>
                        )}
                        
                        {/* 🔑 Flex-1 e min-h-0 forçam o conteúdo a gerar barra de rolagem interna se for muito grande */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 custom-scrollbar min-h-0">
                            {children}
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={cn(
                    "relative bg-surface rounded-[2rem] shadow-float border border-white/10 w-full max-w-lg flex flex-col",
                    "max-h-[90vh]", 
                    "transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out",
                    className
                )}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0 bg-surface/95 backdrop-blur rounded-t-[2rem] z-10">
                    {title ? (
                        <h3 className="text-xl font-black text-text-main tracking-tight">
                            {title}
                        </h3>
                    ) : (
                        <div /> 
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-hover transition-all active:scale-95 ml-auto"
                        aria-label="Fechar modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full rounded-b-[2rem] bg-surface custom-scrollbar min-h-0">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}