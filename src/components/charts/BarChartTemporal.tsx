import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import type { DrilldownDataPoint, MetricType } from '../../types/analytics';

const HIGHCHARTS_COLORS = [
  '#2F80ED', '#EB5757', '#7CB518', '#8E44AD', '#F2994A', '#06b6d4', 
  '#eab308', '#84cc16', '#22c55e', '#f43f5e', '#6366f1', '#a855f7'
];

interface BarChartTemporalProps {
  data: DrilldownDataPoint[];
  metric: MetricType;
  onClickBar: (entry: DrilldownDataPoint) => void;
}

export function BarChartTemporal({ data, metric, onClickBar }: BarChartTemporalProps) {
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 mt-4" style={{ width: '100%', height: '450px' }}>
        <ResponsiveContainer width="99%" height={450}>
          <BarChart data={data.slice(0, new Date().getMonth() + 1)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--color-text-muted)" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => metric === 'KM_TOTAL' ? `${v} km` : metric === 'EFICIENCIA' ? `${v.toFixed(1)} km/l` : metric === 'CUSTO_KM' ? `${formatBRL(v)} / km` : formatBRL(v)} width={90} />
            <RechartsTooltip 
              cursor={{fill: 'var(--color-surface-hover)', opacity: 0.5}} 
              formatter={(value: number | string | undefined) => {
                const v = Number(value ?? 0);
                return metric === 'KM_TOTAL' 
                    ? `${v.toLocaleString('pt-BR')} km` 
                    : metric === 'EFICIENCIA' 
                    ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/l` 
                    : metric === 'CUSTO_KM' 
                    ? `${formatBRL(v)} / km` 
                    : formatBRL(v);
              }} 
              contentStyle={{ borderRadius: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}
            />
            <Bar 
              dataKey="value" 
              fill="var(--color-primary)" 
              radius={[6, 6, 0, 0]} 
              className="cursor-pointer hover:brightness-110 transition-all"
              animationDuration={800}
              animationEasing="ease-out"
              onClick={(entry) => {
                  onClickBar(entry as DrilldownDataPoint);
              }}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={HIGHCHARTS_COLORS[index % HIGHCHARTS_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
