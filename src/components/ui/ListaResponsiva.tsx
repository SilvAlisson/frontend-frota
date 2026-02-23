import React, { useRef, useEffect } from 'react';
import { Inbox } from 'lucide-react';
import autoAnimate from '@formkit/auto-animate'; // ✨ A MAGIA ENTRA AQUI
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

export function ListaResponsiva<T extends { id?: string | number }>({
  itens,
  emptyMessage = "Nenhum registro encontrado.",
  renderDesktop,
  renderMobile,
  desktopHeader,
  getRowClassName,
  isInteractive = true
}: ListaResponsivaProps<T>) {

  // ✨ Refs para os contentores que vão receber os itens
  const desktopParentRef = useRef<HTMLTableSectionElement>(null);
  const mobileParentRef = useRef<HTMLDivElement>(null);

  // ✨ Ativamos o auto-animate nestes refs
  useEffect(() => {
    if (desktopParentRef.current) autoAnimate(desktopParentRef.current);
    if (mobileParentRef.current) autoAnimate(mobileParentRef.current);
  }, [desktopParentRef, mobileParentRef]);

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
            {/* ✨ Ref adicionado ao tbody */}
            <tbody ref={desktopParentRef} className="bg-surface">
              {itens.map((item, idx) => {
                const customClass = getRowClassName ? getRowClassName(item) : '';
                const rowClass = `${TableStyles.rowHover} ${cursorClass} ${customClass}`;
                
                // Usamos o ID real se existir (melhor para animações), senão o índice
                const rowKey = item.id ? String(item.id) : `row-${idx}`;

                return (
                  <tr key={rowKey} className={rowClass}>
                    {renderDesktop(item, idx)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 MOBILE (Cards Flutuantes) */}
      <div 
        ref={mobileParentRef} /* ✨ Ref adicionado ao contentor mobile */
        className="md:hidden space-y-4 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        {itens.map((item, idx) => {
          const customClass = getRowClassName ? getRowClassName(item) : '';
          const cardKey = item.id ? String(item.id) : `card-${idx}`;
          
          return (
            <div
              key={cardKey}
              className={`
                p-5 rounded-[1.25rem] shadow-sm border border-border/60 relative overflow-hidden 
                active:scale-[0.98] transition-all duration-300 bg-surface hover:shadow-md
                ${customClass} ${cursorClass}
              `}
            >
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