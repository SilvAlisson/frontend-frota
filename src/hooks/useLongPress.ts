import { useCallback, useRef, useState } from 'react';
import { haptics } from '../utils/haptics';

interface UseLongPressOptions {
  isPreventDefault?: boolean;
  delay?: number;
  onLongPress: (e?: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e?: React.TouchEvent | React.MouseEvent) => void;
}

export function useLongPress({
  isPreventDefault = true,
  delay = 500,
  onLongPress,
  onClick
}: UseLongPressOptions) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  //  Tipagem dinâmica baseada no retorno nativo do setTimeout do ambiente
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      const eventTarget = event.target;
      target.current = eventTarget;

      timeout.current = setTimeout(() => {
        setLongPressTriggered(true);
        // Alinhado com a chamada padrão de feedback tátil do seu sistema
        haptics.light();
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      if (shouldTriggerClick && !longPressTriggered) {
        if (onClick) {
          onClick(event);
        }
      }
      setLongPressTriggered(false);
    },
    [onClick, longPressTriggered]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onTouchMove: (e: React.TouchEvent) => clear(e, false),
    // Previne o menu de contexto nativo no mobile (ex: copiar imagem) se der long press
    onContextMenu: (e: React.MouseEvent) => {
      if (isPreventDefault) {
        e.preventDefault();
      }
    }
  };
}