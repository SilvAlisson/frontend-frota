import React, { useRef, useEffect } from 'react';
import { Inbox } from 'lucide-react';
import autoAnimate from '@formkit/auto-animate'; 
import { TableStyles } from '../../styles/table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ListaResponsivaProps<T> {
  itens: T[];
  emptyMessage?: string;
  renderDesktop: (item: T, index: number) => React.ReactNode;
  renderMobile: (item: T, index: number) => React.ReactNode;
  desktopHeader: React.ReactNode;
  desktopGridCols?: string;
  getRowClassName?: (item: T) => string;
  isInteractive?: boolean;
  virtualized?: boolean;
  virtualContainerHeight?: string;
}

export function ListaResponsiva<T extends { id?: string | number }>({
  itens,
  emptyMessage = "Nenhum registro encontrado.",
  renderDesktop,
  renderMobile,
  desktopHeader,
  desktopGridCols = "grid-flow-col auto-cols-fr", // Fallback de segurança
  getRowClassName,
  isInteractive = true,
  virtualized = false,
  virtualContainerHeight = "600px"
}: ListaResponsivaProps<T>) {

  // Refs para os contentores que vão receber os itens
  const desktopParentRef = useRef<HTMLTableSectionElement>(null);
  const mobileParentRef = useRef<HTMLDivElement>(null);
  const virtualDesktopContainerRef = useRef<HTMLDivElement>(null);
  const virtualMobileContainerRef = useRef<HTMLDivElement>(null);

  // 🛡️ BLINDAGEM ANTI-PURGE (MÁGICA DO CSS GRID)
  // O Tailwind ignora classes dinâmicas como grid-cols-[1fr_2fr] no build.
  // Nós capturamos essa classe e forçamos como estilo inline garantindo que a tela nunca empilhe!
  const customGridMatch = desktopGridCols.match(/grid-cols-\[([^\]]+)\]/);
  const gridTemplateColumns = customGridMatch ? customGridMatch[1].replace(/_/g, ' ') : undefined;
  
  // Remove a classe arbitrária da string para não sujar o DOM, mantendo o grid base
  const safeGridClass = customGridMatch 
    ? `grid w-full ${desktopGridCols.replace(customGridMatch[0], '')}`.trim()
    : `grid w-full ${desktopGridCols}`;

  // Ativamos o auto-animate APENAS se não for virtualizado
  useEffect(() => {
    if (!virtualized) {
      if (desktopParentRef.current) autoAnimate(desktopParentRef.current);
      if (mobileParentRef.current) autoAnimate(mobileParentRef.current);
    }
  }, [desktopParentRef, mobileParentRef, virtualized]);

  // --- VIRTUALIZATION SETUP ---
  const desktopVirtualizer = useVirtualizer({
    count: itens.length,
    getScrollElement: () => virtualDesktopContainerRef.current,
    estimateSize: () => 65,
    overscan: 5,
  });

  const mobileVirtualizer = useVirtualizer({
    count: itens.length,
    getScrollElement: () => virtualMobileContainerRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

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
      {/* 💻 DESKTOP (Tabela Premium) */}
      <div 
        ref={virtualized ? virtualDesktopContainerRef : null}
        className={`hidden xl:block animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-full min-w-0 ${TableStyles.wrapper} ${virtualized ? 'overflow-y-auto custom-scrollbar' : ''}`}
        style={virtualized ? { height: virtualContainerHeight } : {}}
      >
        <div className="overflow-x-auto min-h-full w-full custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse block min-w-[800px]">
            <thead className={`w-full block ${virtualized ? "sticky top-0 z-10 bg-surface shadow-sm" : ""}`}>
              {/* Aplicando o Inline Style da Blindagem */}
              <tr 
                className={safeGridClass}
                style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
              >
                {desktopHeader}
              </tr>
            </thead>
            
            <tbody 
              ref={virtualized ? undefined : desktopParentRef} 
              className="bg-surface w-full block"
              style={virtualized ? { height: `${desktopVirtualizer.getTotalSize()}px`, position: 'relative' } : undefined}
            >
              {virtualized ? (
                desktopVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = itens[virtualRow.index];
                  const idx = virtualRow.index;
                  const customClass = getRowClassName ? getRowClassName(item) : '';
                  const rowClass = `${TableStyles.rowHover} ${cursorClass} ${customClass}`;
                  const rowKey = item.id ? String(item.id) : `row-${idx}`;

                  return (
                    <tr 
                      key={rowKey} 
                      className={`${safeGridClass} ${rowClass}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        ...(gridTemplateColumns ? { gridTemplateColumns } : {}) // 🔥 Injetando colunas à força
                      }}
                      data-index={virtualRow.index}
                      ref={desktopVirtualizer.measureElement}
                    >
                      {renderDesktop(item, idx)}
                    </tr>
                  );
                })
              ) : (
                itens.map((item, idx) => {
                  const customClass = getRowClassName ? getRowClassName(item) : '';
                  const rowClass = `${TableStyles.rowHover} ${cursorClass} ${customClass}`;
                  const rowKey = item.id ? String(item.id) : `row-${idx}`;

                  return (
                    <tr 
                      key={rowKey} 
                      className={`${safeGridClass} ${rowClass}`}
                      style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
                    >
                      {renderDesktop(item, idx)}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 MOBILE (Cards Flutuantes) */}
      <div 
        ref={virtualized ? virtualMobileContainerRef : mobileParentRef}
        className={`xl:hidden space-y-4 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full min-w-0 ${virtualized ? 'overflow-y-auto custom-scrollbar relative' : ''}`}
        style={virtualized ? { height: virtualContainerHeight } : {}}
      >
        {virtualized ? (
          <div style={{ height: `${mobileVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = itens[virtualRow.index];
              const idx = virtualRow.index;
              const customClass = getRowClassName ? getRowClassName(item) : '';
              const cardKey = item.id ? String(item.id) : `card-${idx}`;

              return (
                <div
                  key={cardKey}
                  data-index={virtualRow.index}
                  ref={mobileVirtualizer.measureElement}
                  className={`
                    p-5 rounded-[1.25rem] shadow-sm border border-border/60 relative overflow-hidden 
                    active:scale-[0.98] transition-all duration-300 bg-surface hover:shadow-md w-full max-w-full min-w-0
                    ${customClass} ${cursorClass}
                  `}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {!customClass.includes('ghost-row') && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/80 to-primary/40 rounded-l-[1.25rem] opacity-70" />
                  )}
                  <div className="pl-2 w-full min-w-0">
                    {renderMobile(item, idx)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          itens.map((item, idx) => {
            const customClass = getRowClassName ? getRowClassName(item) : '';
            const cardKey = item.id ? String(item.id) : `card-${idx}`;
            
            return (
              <div
                key={cardKey}
                className={`
                  p-5 rounded-[1.25rem] shadow-sm border border-border/60 relative overflow-hidden 
                  active:scale-[0.98] transition-all duration-300 bg-surface hover:shadow-md w-full max-w-full min-w-0
                  ${customClass} ${cursorClass}
                `}
              >
                {!customClass.includes('ghost-row') && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/80 to-primary/40 rounded-l-[1.25rem] opacity-70" />
                )}

                <div className="pl-2 w-full min-w-0">
                  {renderMobile(item, idx)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}