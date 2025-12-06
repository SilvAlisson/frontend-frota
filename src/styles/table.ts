export const TableStyles = {
    // Cabeçalho: Fundo muito sutil, texto em caixa alta discreto
    th: "px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100 first:pl-6 last:pr-6",

    // Células: Texto base legível, bordas internas quase invisíveis
    td: "px-4 py-3.5 text-sm text-gray-700 border-b border-gray-50 align-middle first:pl-6 last:pr-6",

    // Linhas: Efeito hover suave e classe 'group' para permitir ações condicionais no hover
    rowHover: "hover:bg-gray-50/80 transition-colors duration-200 group",

    // Empty State: Centralizado, com borda tracejada e cantos arredondados
    emptyState: "flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400",

    // Botões de Ação na Tabela (Edição/Exclusão): Tamanho fixo e hover padronizado
    actionButton: "!p-1.5 h-8 w-8 rounded-lg transition-colors shadow-none"
};