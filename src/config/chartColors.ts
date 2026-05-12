/**
 * Paleta de cores oficial para todos os gráficos do sistema Frota KLIN.
 * Fonte única da verdade — importar aqui em vez de hardcodar hex nos componentes.
 */

export const CHART_COLORS = {
  // Cores primárias (Tailwind-aligned)
  sky:     '#38bdf8', // sky-400
  purple:  '#a78bfa', // violet-400
  emerald: '#34d399', // emerald-400
  amber:   '#f59e0b', // amber-500
  orange:  '#f97316', // orange-500
  red:     '#ef4444', // red-500
  yellow:  '#eab308', // yellow-500
  slate:   '#94a3b8', // slate-400
  primary: '#10b981', // emerald-500 (cor primária do sistema)

  // Aliases semânticos
  success: '#34d399',
  warning: '#eab308',
  danger:  '#ef4444',
  neutral: '#94a3b8',
} as const;

/**
 * Paleta sequencial para gráficos com múltiplas séries.
 * Usar na ordem: CHART_SERIES[0], CHART_SERIES[1], etc.
 */
export const CHART_SERIES = [
  CHART_COLORS.sky,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.red,
] as const;

/**
 * Mapeamento de categorias de defeito para cores.
 */
export const CHART_COLORS_DEFEITOS: Record<string, string> = {
  FREIO:      CHART_COLORS.red,
  MOTOR:      CHART_COLORS.orange,
  PNEU:       CHART_COLORS.yellow,
  OLEO:       CHART_COLORS.sky,
  ILUMINACAO: CHART_COLORS.purple,
  CARROCERIA: CHART_COLORS.emerald,
  OUTRO:      CHART_COLORS.neutral,
};

/**
 * Mapeamento semântico para planos preventivos.
 */
export const CHART_COLORS_STATUS = {
  normal:  CHART_COLORS.emerald,
  atencao: CHART_COLORS.yellow,
  vencido: CHART_COLORS.red,
} as const;
