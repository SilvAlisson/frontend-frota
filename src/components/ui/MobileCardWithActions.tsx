import React, { useState } from 'react';
import { useLongPress } from '../../hooks/useLongPress';
import { DropdownAcoes } from './DropdownAcoes';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface MobileCardWithActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  onEditar?: () => void;
  onExcluir?: () => void;
  onVerDetalhes?: () => void;
  excluirLabel?: string;
  children: React.ReactNode;
}

export function MobileCardWithActions({
  onEditar,
  onExcluir,
  onVerDetalhes,
  excluirLabel = 'Excluir',
  children,
  className,
  ...rest
}: MobileCardWithActionsProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const longPressProps = useLongPress({
    delay: 400,
    onLongPress: () => {
      // Abre o bottom sheet se houver alguma ação disponível
      if (onEditar || onExcluir || onVerDetalhes) {
        setOpen(true);
      }
    },
  });

  return (
    <div
      {...(isMobile ? longPressProps : {})}
      className={cn(
        "relative transition-colors select-none", 
        // Feedback visual sutil no mobile ao ser pressionado
        isMobile && "active:bg-surface-hover/70",
        className
      )}
      {...rest}
    >
      {children}
      
      {/* Oculto no desktop (pois as colunas renderizam seus próprios Dropdowns),
          mas no mobile ele captura o state de open e renderiza o Drawer */}
      {isMobile && (onEditar || onExcluir || onVerDetalhes) && (
        <DropdownAcoes
          open={open}
          onOpenChange={setOpen}
          onEditar={onEditar}
          onExcluir={onExcluir}
          onVerDetalhes={onVerDetalhes}
          excluirLabel={excluirLabel}
          hideTriggerOnMobile={true}
        />
      )}
    </div>
  );
}