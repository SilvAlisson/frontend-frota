export const TableStyles = {
  // Container principal: Bordas arredondadas e sombra de card
  wrapper: "w-full overflow-x-auto rounded-2xl border border-border shadow-sm bg-surface custom-scrollbar",

  // Cabeçalho: Fonte menor, mais espaçada (tracking) e super negrito (black)
  // Transformado em Flex item com min-w-0 para respeitar o CSS Grid e px-4 para melhor encaixe
  th: "px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.15em] bg-surface-hover/40 border-b border-border/60 flex items-center min-w-0 first:pl-6 last:pr-6",

  // Células: Texto base com contraste alto
  //  Transformado em Flex item com min-w-0 para acompanhar o cabeçalho e px-4 para melhor encaixe
  td: "px-4 py-4 text-sm font-medium text-text-main border-b border-border/40 flex items-center min-w-0 first:pl-6 last:pr-6",

  // O Toque de Elite: Classe para dados estruturados (Placas, Valores, Datas)
  dataText: "font-mono font-bold tracking-tight text-text-main bg-surface-hover/50 px-2 py-1 rounded-md border border-border/50 inline-block",

  // Linhas: Efeito hover super suave sem piscar
  rowHover: "hover:bg-surface-hover/60 transition-colors duration-300 group",

  // Empty State: Mais respiro (py-16) e uso correto de opacidade
  emptyState: "flex flex-col items-center justify-center py-16 bg-surface/30 rounded-2xl border-2 border-dashed border-border/60 text-text-muted",

  // Botões de Ação na Tabela: Botões gordinhos, hit-area maior (h-9 w-9)
  actionButton: "p-2 h-9 w-9 rounded-xl transition-all duration-200 text-text-muted hover:text-primary hover:bg-primary/10 active:scale-95 flex items-center justify-center"
};