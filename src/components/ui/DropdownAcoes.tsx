import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Drawer } from 'vaul';
import { MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from './Button';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/utils';

interface DropdownAcoesProps {
  onEditar?: () => void;
  onExcluir?: () => void;
  onVerDetalhes?: () => void;
  excluirLabel?: string;
  align?: 'start' | 'center' | 'end';
  children?: React.ReactNode;
  
  /** Usado se quisermos controlar a abertura por fora (ex: via LongPress) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Se true, oculta os 3 pontinhos no mobile (pois usaremos apenas o long press) */
  hideTriggerOnMobile?: boolean;
}

export function DropdownAcoes({ 
  onEditar, 
  onExcluir, 
  onVerDetalhes,
  excluirLabel = 'Excluir',
  align = 'end',
  children,
  open,
  onOpenChange,
  hideTriggerOnMobile = true
}: DropdownAcoesProps) {
  
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const trigger = (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={(e) => e.stopPropagation()} 
      className={cn(
        "md:h-9 md:w-9 h-11 w-11 p-0 flex items-center justify-center rounded-xl text-text-muted hover:text-primary hover:bg-primary/10",
        isMobile && hideTriggerOnMobile ? "hidden" : "flex"
      )}
      aria-label="Mais opções"
    >
      <MoreVertical className="w-5 h-5" />
    </Button>
  );

  const MobileOptions = () => (
    <div className="flex flex-col gap-2 w-full">
      {onVerDetalhes && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onVerDetalhes(); }}
          className="flex items-center gap-4 px-4 py-4 w-full text-left text-base font-bold text-text-main rounded-xl hover:bg-surface-hover active:bg-surface-hover transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
            <Eye className="w-5 h-5 text-text-muted" />
          </div>
          Detalhes
        </button>
      )}

      {onEditar && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onEditar(); }}
          className="flex items-center gap-4 px-4 py-4 w-full text-left text-base font-bold text-text-main rounded-xl hover:bg-surface-hover active:bg-surface-hover transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Edit2 className="w-5 h-5 text-primary" />
          </div>
          Editar
        </button>
      )}

      {children}

      {onExcluir && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onExcluir(); }}
          className="flex items-center gap-4 px-4 py-4 w-full text-left text-base font-bold text-error rounded-xl hover:bg-error/10 active:bg-error/10 transition-colors"
        >
           <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-error" />
          </div>
          {excluirLabel}
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Trigger asChild>
          {trigger}
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" />
          <Drawer.Content className="bg-surface flex flex-col rounded-t-[2rem] h-auto max-h-[96vh] mt-24 fixed bottom-0 left-0 right-0 z-[10000] focus:outline-none">
            <div className="p-4 bg-surface rounded-t-[2rem] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mb-6" />
              <div className="max-w-md mx-auto">
                <Drawer.Title className="text-lg font-black text-text-main mb-4 px-2">Opções</Drawer.Title>
                <MobileOptions />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          align={align}
          sideOffset={8}
          avoidCollisions={true}
          collisionPadding={8}
          className="z-[9999] min-w-[180px] bg-surface/90 backdrop-blur-md rounded-xl p-1.5 shadow-2xl shadow-black/40 border border-white/10 transition-all duration-200 starting:opacity-0 starting:scale-95"
        >
          {onVerDetalhes && (
            <DropdownMenu.Item 
              onSelect={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onVerDetalhes(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-text-main rounded-lg cursor-pointer outline-none hover:bg-surface-hover focus:bg-surface-hover transition-colors group"
            >
              <Eye className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              Detalhes
            </DropdownMenu.Item>
          )}

          {onEditar && (
            <DropdownMenu.Item 
              onSelect={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onEditar(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-text-main rounded-lg cursor-pointer outline-none hover:bg-surface-hover focus:bg-surface-hover transition-colors group"
            >
              <Edit2 className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              Editar
            </DropdownMenu.Item>
          )}

          {children && (
            <>
              {(onEditar || onVerDetalhes) && <DropdownMenu.Separator className="h-px bg-border/50 my-1.5 mx-1" />}
              {children}
            </>
          )}

          {(onEditar || onVerDetalhes || children) && onExcluir && (
            <DropdownMenu.Separator className="h-px bg-border/50 my-1.5 mx-1" />
          )}

          {onExcluir && (
            <DropdownMenu.Item 
              onSelect={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onExcluir(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-error rounded-lg cursor-pointer outline-none hover:bg-error/10 focus:bg-error/10 transition-colors group"
            >
              <Trash2 className="w-4 h-4 text-error/70 group-hover:text-error transition-colors" />
              {excluirLabel}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}


