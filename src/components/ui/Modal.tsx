import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Drawer } from 'vaul';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Hook para detectar mudança de tamanho de tela (Responsividade)
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
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
    
    // Evita erros de hidratação (renderiza apenas no cliente)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    // --- VERSÃO MOBILE (DRAWER / GAVETA) ---
    if (!isDesktop) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} shouldScaleBackground>
                <Drawer.Portal>
                    {/* Overlay Escuro com Blur (Glassmorphism Mobile) */}
                    <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[80]" />
                    
                    <Drawer.Content 
                        className={cn(
                            "bg-surface flex flex-col rounded-t-[20px] mt-24 fixed bottom-0 left-0 right-0 z-[90] outline-none border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)]",
                            "max-h-[96vh]", // Quase tela cheia, mas deixa um respiro no topo
                            className
                        )}
                    >
                        {/* Puxador (Handle) visual */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border/60 mt-4 mb-4" />
                        
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header da Gaveta */}
                            {title && (
                                <div className="px-6 pb-4 text-center border-b border-border/50 shrink-0">
                                    <Drawer.Title className="font-bold text-lg text-text-main tracking-tight">
                                        {title}
                                    </Drawer.Title>
                                </div>
                            )}
                            
                            {/* Conteúdo com Scroll Interno Independente */}
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar pb-10">
                                {children}
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    // --- VERSÃO DESKTOP (MODAL CLÁSSICO COM UPGRADE VISUAL) ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">

            {/* Backdrop Desktop com Blur (Glassmorphism Enterprise) */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Container do Modal */}
            <div
                className={cn(
                    "relative bg-surface rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]",
                    "transform transition-all animate-in zoom-in-95 duration-200 ease-out", // Animação "Pop" suave
                    className
                )}
            >
                {/* Header Desktop */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-surface/50 backdrop-blur-xl">
                    {title && (
                        <h3 className="text-lg font-bold text-text-main tracking-tight font-sans">
                            {title}
                        </h3>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors ml-auto group"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Body Desktop */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}