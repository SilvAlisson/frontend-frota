import React from 'react';

interface ListaResponsivaProps<T> {
    itens: T[];
    emptyMessage?: string;
    // Renderizadores
    renderDesktop: (item: T, index: number) => React.ReactNode;
    renderMobile: (item: T, index: number) => React.ReactNode;
    // Cabeçalho da Tabela Desktop
    desktopHeader: React.ReactNode;
}

export function ListaResponsiva<T>({
    itens,
    emptyMessage = "Nenhum registro encontrado.",
    renderDesktop,
    renderMobile,
    desktopHeader
}: ListaResponsivaProps<T>) {

    if (!itens || itens.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
                <p className="text-text-light">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <>
            {/* 🖥️ VERSÃO DESKTOP (Tabela Elegante) */}
            <div className="hidden md:block bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background text-text font-semibold uppercase text-xs tracking-wider border-b border-border">
                            <tr>{desktopHeader}</tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {itens.map((item, idx) => (
                                <tr key={idx} className="hover:bg-background/50 transition-colors">
                                    {renderDesktop(item, idx)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 📱 VERSÃO MOBILE (Cards Klin) */}
            <div className="md:hidden space-y-4">
                {itens.map((item, idx) => (
                    <div key={idx} className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3 relative overflow-hidden">
                        {/* Faixa decorativa lateral na cor da marca */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

                        {renderMobile(item, idx)}
                    </div>
                ))}
            </div>
        </>
    );
}