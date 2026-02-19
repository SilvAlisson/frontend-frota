import React from 'react';
import { Inbox } from 'lucide-react';
import { TableStyles } from '../../styles/table';

interface ListaResponsivaProps<T> {
  itens: T[];
  emptyMessage?: string;
  renderDesktop: (item: T, index: number) => React.ReactNode;
  renderMobile: (item: T, index: number) => React.ReactNode;
  desktopHeader: React.ReactNode;
  getRowClassName?: (item: T) => string;
  isInteractive?: boolean;
}

export function ListaResponsiva<T>({
  itens,
  emptyMessage = "Nenhum registro encontrado.",
  renderDesktop,
  renderMobile,
  desktopHeader,
  getRowClassName,
  isInteractive = true
}: ListaResponsivaProps<T>) {

  if (!itens || itens.length === 0) {
    return (
      <div className={`${TableStyles.emptyState} animate-in fade-in duration-500`}>
        <div className="w-16 h-16 bg-background rounded-full mb-4 flex items-center justify-center shadow-inner border border-border/50">
          <Inbox className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-main font-bold text-lg tracking-tight mb-1">Nada por aqui</p>
        <p className="text-text-secondary font-medium text-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const cursorClass = isInteractive ? 'cursor-pointer' : '';

  return (
    <>
      {/* 🖥️ DESKTOP (Tabela Premium) */}
      <div className={`hidden md:block animate-in fade-in slide-in-from-bottom-2 duration-500 ${TableStyles.wrapper}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr>{desktopHeader}</tr>
            </thead>
            <tbody className="bg-surface">
              {itens.map((item, idx) => {
                // Junta a classe customizada com o hover padrão do TableStyles
                const customClass = getRowClassName ? getRowClassName(item) : '';
                const rowClass = `${TableStyles.rowHover} ${cursorClass} ${customClass}`;

                return (
                  <tr key={idx} className={rowClass}>
                    {renderDesktop(item, idx)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 MOBILE (Cards Flutuantes) */}
      <div className="md:hidden space-y-4 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {itens.map((item, idx) => {
          const customClass = getRowClassName ? getRowClassName(item) : '';
          
          return (
            <div
              key={idx}
              className={`
                p-5 rounded-[1.25rem] shadow-sm border border-border/60 relative overflow-hidden 
                active:scale-[0.98] transition-all duration-300 bg-surface hover:shadow-md
                ${customClass} ${cursorClass}
              `}
            >
              {/* Efeito de destaque lateral muito mais sutil e elegante */}
              {!customClass.includes('ghost-row') && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/80 to-primary/40 rounded-l-[1.25rem] opacity-70" />
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