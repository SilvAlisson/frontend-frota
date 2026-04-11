/**
 * GraficosFlota.tsx
 * Biblioteca central de gráficos premium da Frota KLIN.
 * Todos os gráficos seguem o design system (cores CSS var, dark mode, animações suaves).
 */
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── TEMA COMPARTILHADO ───────────────────────────────────────────────────────
const CHART_COLORS = {
  primary:  'var(--color-primary)',
  success:  'var(--color-success)',
  warning:  'var(--color-warning)',
  error:    'var(--color-error)',
  muted:    'var(--color-text-muted)',
  surface:  'var(--color-surface)',
  sky:      '#38bdf8',
  purple:   '#a78bfa',
  emerald:  '#34d399',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '1rem',
  color: 'var(--color-text-main)',
  fontSize: '12px',
  fontWeight: 700,
  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  padding: '10px 16px',
};

// ─── 1. GRÁFICO DE ÁREA (Curva de Consumo de Combustível) ────────────────────
interface DadoAbastecimento {
  mes: string;
  litros: number;
  custo: number;
}

interface GraficoCurvaAbastecimentoProps {
  dados: DadoAbastecimento[];
  modo?: 'litros' | 'custo';
}

export function GraficoCurvaAbastecimento({ dados, modo = 'litros' }: GraficoCurvaAbastecimentoProps) {
  const isLitros = modo === 'litros';
  const cor = isLitros ? CHART_COLORS.sky : CHART_COLORS.emerald;
  const dataKey = isLitros ? 'litros' : 'custo';
  const label = isLitros ? 'Litros' : 'R$';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={cor} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => isLitros ? `${v}L` : `R$${v}`}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: any) => [
          isLitros
            ? `${Number(value).toLocaleString('pt-BR')} L`
            : `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          label
        ]}
          labelStyle={{ color: 'var(--color-text-muted)', fontSize: 10, marginBottom: 4 }}
          cursor={{ stroke: cor, strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={cor}
          strokeWidth={2.5}
          fill={`url(#grad-${dataKey})`}
          dot={{ fill: cor, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: cor, strokeWidth: 0 }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── 2. DONUT CHART (Distribuição de Defeitos por Categoria) ─────────────────
interface DadoDonut {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface GraficoDonutDefeitosProps {
  dados: DadoDonut[];
  total: number;
}

// Tooltip customizado para o Donut
const DonutTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={TOOLTIP_STYLE}>
        <span style={{ color: payload[0].payload.color, fontWeight: 900 }}>
          ● {payload[0].name}
        </span>
        <div style={{ color: 'var(--color-text-main)', fontSize: 14, fontWeight: 900 }}>
          {payload[0].value} ocorrência{payload[0].value !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }
  return null;
};

export function GraficoDonutDefeitos({ dados, total }: GraficoDonutDefeitosProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            dataKey="value"
            animationBegin={100}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {dados.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centro do Donut — Número Total */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black font-mono text-text-main leading-none">{total}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">Abertos</span>
      </div>
    </div>
  );
}

// ─── 3. BARRA COMPARATIVA (Saúde da Frota por Planos) ────────────────────────
interface DadoBarra {
  nome: string;
  desgaste: number;
  status: 'VERDE' | 'AMARELO' | 'VERMELHO';
}

interface GraficoBarraPlanoProps {
  dados: DadoBarra[];
}

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={TOOLTIP_STYLE}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 10, marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--color-text-main)', fontWeight: 900 }}>{payload[0].value.toFixed(0)}% desgaste</div>
      </div>
    );
  }
  return null;
};

const getBarColor = (status: string) => {
  if (status === 'VERMELHO') return CHART_COLORS.error;
  if (status === 'AMARELO') return CHART_COLORS.warning;
  return CHART_COLORS.success;
};

export function GraficoBarraPlanos({ dados }: GraficoBarraPlanoProps) {
  // Trunca nome para 8 chars para não poluir o eixo
  const dadosFormatados = dados.slice(0, 8).map(d => ({
    ...d,
    nomeAbrev: d.nome.length > 8 ? d.nome.substring(0, 7) + '…' : d.nome,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dadosFormatados} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
        <XAxis
          dataKey="nomeAbrev"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--color-surface-hover)', radius: 8 }} />
        <Bar
          dataKey="desgaste"
          radius={[6, 6, 0, 0]}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {dadosFormatados.map((entry, index) => (
            <Cell key={`bar-${index}`} fill={getBarColor(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
