export const TableStyles = {
  // Container principal: Bordas arredondadas e sombra de card
  wrapper: "w-full overflow-x-auto rounded-2xl border border-border/30 shadow-sm glass-premium custom-scrollbar",

  // Cabeçalho: Fonte mais legível, responsiva e com contraste aprimorado
  th: "px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-surface-hover/10 border-b border-border/30 flex items-center min-w-0 first:pl-6 last:pr-6",

  // Células: Texto base com contraste alto
  td: "px-4 py-4 text-sm font-medium text-text-main border-b border-border/20 flex items-center min-w-0 first:pl-6 last:pr-6",

  // O Toque de Elite: Classe para dados estruturados (Placas, Valores, Datas)
  dataText: "font-mono font-bold tracking-tight text-text-main glass-premium px-2 py-1 rounded-md border border-border/20 inline-block",

  // Linhas: Efeito hover super suave sem piscar
  rowHover: "hover:bg-surface-hover/30 transition-colors duration-300 group",

  // Empty State: Mais respiro (py-16) e uso correto de opacidade
  emptyState: "flex flex-col items-center justify-center py-16 glass-premium rounded-2xl border-2 border-dashed border-border/40 text-text-muted",

  // Botões de Ação na Tabela: Botões gordinhos, hit-area maior (h-9 w-9)
  actionButton: "p-2 h-9 w-9 rounded-xl transition-all duration-200 text-text-muted hover:text-primary hover:bg-primary/10 active:scale-95 flex items-center justify-center"
};