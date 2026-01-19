import React from 'react';
import { Inbox } from 'lucide-react';

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

    // --- Empty State Refinado ---
    if (!itens || itens.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200 text-center animate-in fade-in duration-500">
                <div className="bg-gray-50 p-4 rounded-full mb-3 shadow-sm">
                    <Inbox className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <>
            {/* 🖥️ VERSÃO DESKTOP (Tabela Elegante) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        {/* Cabeçalho */}
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>{desktopHeader}</tr>
                        </thead>

                        {/* Corpo */}
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {itens.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className="hover:bg-gray-50/60 transition-colors duration-150 group"
                                >
                                    {renderDesktop(item, idx)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 📱 VERSÃO MOBILE (Cards Klin) */}
            <div className="md:hidden space-y-4 pb-4 animate-in slide-in-from-bottom-4 duration-500">
                {itens.map((item, idx) => (
                    <div
                        key={idx}
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden active:scale-[0.99] transition-transform duration-200"
                    >
                        {/* Faixa decorativa lateral na cor da marca (Azul Klin) */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

                        {/* Conteúdo com padding leve à esquerda para separar da faixa */}
                        <div className="pl-2">
                            {renderMobile(item, idx)}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}