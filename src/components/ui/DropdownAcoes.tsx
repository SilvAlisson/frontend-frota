import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

interface DropdownAcoesProps {
  onEditar?: () => void;
  onExcluir?: () => void;
  onVerDetalhes?: () => void;
  align?: 'start' | 'center' | 'end';
  children?: React.ReactNode; // 🔥 Permite injetar opções extras em telas específicas!
}

export function DropdownAcoes({ 
  onEditar, 
  onExcluir, 
  onVerDetalhes,
  align = 'end',
  children
}: DropdownAcoesProps) {
  
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button 
          // 🛡️ Impede que o clique nos 3 pontinhos ative o clique da linha da tabela
          onClick={(e) => e.stopPropagation()} 
          className="p-2 h-9 w-9 rounded-xl transition-all duration-200 text-text-muted hover:text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 flex items-center justify-center"
          aria-label="Mais opções"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          align={align}
          sideOffset={8}
          // 🎬 Adicionado animate-out para o menu sumir suavemente ao fechar
          className="z-[9999] min-w-[180px] bg-surface rounded-xl p-1.5 shadow-float border border-border/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 duration-200"
        >
          
          {onVerDetalhes && (
            <DropdownMenu.Item 
              onSelect={(e) => { e.preventDefault(); onVerDetalhes(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-text-main rounded-lg cursor-pointer outline-none hover:bg-surface-hover focus:bg-surface-hover transition-colors group"
            >
              <Eye className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              Detalhes
            </DropdownMenu.Item>
          )}

          {onEditar && (
            <DropdownMenu.Item 
              onSelect={(e) => { e.preventDefault(); onEditar(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-text-main rounded-lg cursor-pointer outline-none hover:bg-surface-hover focus:bg-surface-hover transition-colors group"
            >
              <Edit2 className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              Editar
            </DropdownMenu.Item>
          )}

          {/* Renderiza opções customizadas extras, se passadas via children */}
          {children && (
            <>
              {(onEditar || onVerDetalhes) && <DropdownMenu.Separator className="h-px bg-border/50 my-1.5 mx-1" />}
              {children}
            </>
          )}

          {/* Separador flexível */}
          {(onEditar || onVerDetalhes || children) && onExcluir && (
            <DropdownMenu.Separator className="h-px bg-border/50 my-1.5 mx-1" />
          )}

          {onExcluir && (
            <DropdownMenu.Item 
              onSelect={(e) => { e.preventDefault(); onExcluir(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-error rounded-lg cursor-pointer outline-none hover:bg-error/10 focus:bg-error/10 transition-colors group"
            >
              <Trash2 className="w-4 h-4 text-error/70 group-hover:text-error transition-colors" />
              Excluir
            </DropdownMenu.Item>
          )}

        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}