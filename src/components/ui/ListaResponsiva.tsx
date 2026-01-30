import React from 'react';
import { Inbox } from 'lucide-react';

interface ListaResponsivaProps<T> {
    itens: T[];
    emptyMessage?: string;
    renderDesktop: (item: T, index: number) => React.ReactNode;
    renderMobile: (item: T, index: number) => React.ReactNode;
    desktopHeader: React.ReactNode;
    // Adicionamos suporte oficial à classe fantasma
    getRowClassName?: (item: T) => string;
}

export function ListaResponsiva<T>({
    itens,
    emptyMessage = "Nenhum registro encontrado.",
    renderDesktop,
    renderMobile,
    desktopHeader,
    getRowClassName
}: ListaResponsivaProps<T>) {

    if (!itens || itens.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface rounded-2xl border border-dashed border-border text-center animate-enter">
                <div className="bg-background p-4 rounded-full mb-3 shadow-sm">
                    <Inbox className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-secondary font-medium text-sm">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <>
            {/* 🖥️ DESKTOP */}
            <div className="hidden md:block bg-surface rounded-2xl shadow-card border border-border overflow-hidden animate-enter">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface-hover/80 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider backdrop-blur-sm">
                            <tr>{desktopHeader}</tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-surface">
                            {itens.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className={`transition-colors duration-150 group ${
                                        getRowClassName ? getRowClassName(item) : 'hover:bg-surface-hover'
                                    }`}
                                >
                                    {renderDesktop(item, idx)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 📱 MOBILE */}
            <div className="md:hidden space-y-4 pb-4 animate-enter">
                {itens.map((item, idx) => {
                    const customClass = getRowClassName ? getRowClassName(item) : '';
                    
                    return (
                        <div
                            key={idx}
                            className={`
                                p-5 rounded-xl shadow-card border border-border relative overflow-hidden 
                                active:scale-[0.99] transition-transform duration-200 bg-surface
                                ${customClass}
                            `}
                        >
                            {/* Faixa lateral padrão (Se não for fantasma, usa primary) */}
                            {!customClass.includes('ghost-row') && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            )}

                            <div className="pl-2">
                                {renderMobile(item, idx)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}