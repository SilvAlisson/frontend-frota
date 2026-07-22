import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { DrilldownDataPoint, MetricType } from '../../types/analytics';
import { formatBRL, formatKml } from '../../lib/formatters';

const CHART_COLORS = [
  '#2F80ED', '#EB5757', '#7CB518', '#8E44AD', '#F2994A', '#06b6d4', 
  '#eab308', '#84cc16', '#22c55e', '#f43f5e', '#6366f1', '#a855f7'
];

interface PieChartDrilldownProps {
  data: DrilldownDataPoint[];
  metric: MetricType;
  onClickSlice: (entry: DrilldownDataPoint) => void;
}

export function PieChartDrilldown({ data, metric, onClickSlice }: PieChartDrilldownProps) {
  const formatValue = (value: number) => {
    if (metric === 'KM_TOTAL') return `${value.toLocaleString('pt-BR')} km`;
    if (metric === 'EFICIENCIA') return formatKml(value);
    if (metric === 'CUSTO_KM') return `${formatBRL(value)} / km`;
    return formatBRL(value);
  };

  const total = data.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DrilldownDataPoint;
      const percentage = total > 0 ? ((dataPoint.value / total) * 100).toFixed(1) : '0.0';
      return (
        <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-sm text-text-main">
          <p className="font-bold mb-1">{dataPoint.name}</p>
          <p>Total: <span className="font-bold">{formatValue(dataPoint.value)}</span></p>
          <p>Percentual: <span className="font-bold">{percentage.replace('.', ',')}%</span></p>
        </div>
      );
    }
    return null;
  };

  interface LegendPayloadEntry { value: string; color: string; }
  const CustomLegend = ({ payload }: { payload?: LegendPayloadEntry[] }) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
        {(payload ?? []).map((entry, index: number) => {
          const dataPoint = data.find(d => d.name === entry.value);
          const percentage = dataPoint && total > 0 ? ((dataPoint.value / total) * 100).toFixed(1) : '0.0';
          
          return (
            <li key={`item-${index}`} className="flex items-center text-xs text-text-main font-semibold">
              <span 
                className="w-3 h-3 rounded-full mr-2 inline-block" 
                style={{ backgroundColor: entry.color }}
              />
              {entry.value}
              <span className="opacity-60 ml-1 font-normal">({percentage.replace('.', ',')}%)</span>
            </li>
          );
        })}
      </ul>
    );
  };

  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-text-muted text-sm font-semibold">Sem dados suficientes</div>;
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} verticalAlign="bottom" />
          <Pie
            data={data as any[]}
            cx="50%"
            cy="45%"
            innerRadius={0}
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            onClick={(e) => {
              if (e && e.payload) onClickSlice(e.payload as DrilldownDataPoint);
            }}
            style={{ cursor: 'pointer' }}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                stroke="var(--color-surface)"
                strokeWidth={2}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
