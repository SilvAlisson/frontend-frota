import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

// Define typings properly
export interface DadoPerformance {
  id: string;
  name: string;
  cost: number;
  kmRodado: number;
  color: string;
}

const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNum = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

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

const extrairPlaca = (placaBruta?: string) => {
  if (!placaBruta) return '---';
  const match = placaBruta.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return placaBruta.trim();
};

interface TooltipPayload {
  payload?: DadoPerformance;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const PerformanceTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as DadoPerformance;
    return (
      <div style={TOOLTIP_STYLE}>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{extrairPlaca(label)}</p>
        <p className="text-lg font-black" style={{ color: d.color }}>{formatBRL(d.cost || 0)}</p>
        {d.kmRodado > 0 && (
          <p className="text-xs text-text-muted mt-1">{formatNum(d.kmRodado)} km rodados</p>
        )}
      </div>
    );
  }
  return null;
};

export function GraficoPerformance({ dados, loading }: { dados: DadoPerformance[]; loading: boolean }) {
  if (loading) return <Skeleton variant="card" className="h-[280px] w-full" />;
  if (dados.length === 0) return (
    <div className="h-[280px] flex flex-col items-center justify-center text-text-muted gap-2">
      <BarChart2 className="w-10 h-10 opacity-30" />
      <p className="text-xs font-bold uppercase tracking-widest">Sem dados de custo neste período</p>
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dados} margin={{ top: 10, right: 40, left: 10, bottom: 60 }} barSize={20}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}
          axisLine={false} tickLine={false} angle={-20} textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} width={55} />
        <Tooltip content={<PerformanceTooltip />} cursor={{ fill: 'var(--color-surface-hover)', radius: 8 }} />
        <Bar dataKey="cost" name="Custo Total" radius={[6, 6, 0, 0]} animationDuration={900} animationEasing="ease-out">
          {dados.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
