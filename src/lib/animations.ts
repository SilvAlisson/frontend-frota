import type { Variants } from 'framer-motion';

// Animação de entrada fluida para páginas/telas inteiras
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};

// Container para listas com animação em cascata (stagger)
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Item individual da lista (usado em tabelas ou grids)
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// Efeito de hover "tátil" e responsivo para cards interativos
export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -2, transition: { duration: 0.2, ease: "easeOut" } },
  tap: { scale: 0.98, y: 0, transition: { duration: 0.1 } }
};

// Aparição de números estilo "counter" em KPIs
export const numberVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } }
};
