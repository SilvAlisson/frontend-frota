import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '../ui/Skeleton';

// Define proper typings for Recharts payload
interface CpkPayload {
  name: string;
  fuel: number;
  maintenance: number;
  custoCombustivelAbsoluto: number;
  custoManutencaoAbsoluto: number;
  kmRodado: number;
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

// Fix the 'any' type using proper Recharts types
interface TooltipPayload {
  color?: string;
  name?: string;
  value?: number | string;
  payload?: CpkPayload;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CpkTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CpkPayload;
    return (
      <div style={TOOLTIP_STYLE}>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="font-bold" style={{ color: p.color }}>{p.name}:</span>
            <span className="font-black">{formatBRL(Number(p.value))}/km</span>
          </div>
        ))}
        {data.kmRodado > 0 && (
          <p className="text-xs text-text-muted mt-2 pt-2 border-t border-border/40">
            {formatNum(data.kmRodado)} km rodados
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function GraficoCpk({ dados, loading }: { dados: CpkPayload[]; loading: boolean }) {
  if (loading) return <Skeleton variant="card" className="h-[280px] w-full" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={dados} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="gradFuel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradMaint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
        <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} width={55} />
        <Tooltip content={<CpkTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} iconType="circle" iconSize={8} />
        <Area type="monotone" dataKey="fuel" name="CPK Combustível" stroke="#38bdf8" strokeWidth={2.5} fill="url(#gradFuel)" dot={{ fill: '#38bdf8', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#38bdf8', strokeWidth: 0 }} animationDuration={800} />
        <Area type="monotone" dataKey="maintenance" name="CPK Manutenção" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradMaint)" dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
