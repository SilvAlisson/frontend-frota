import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { Briefcase } from 'lucide-react';

interface GraficoCargosProps {
  dados: { name: string; value: number }[];
}

const COLORS = [
  'var(--color-primary)', 
  'var(--color-success)', 
  'var(--color-warning)', 
  'var(--color-info)', 
  'var(--color-error)', 
  'var(--color-klin-500)'
];

export function GraficoCargos({ dados }: GraficoCargosProps) {
  if (!dados || dados.length === 0) {
    return <EmptyState icon={Briefcase} title="Sem dados de cargos" description="Nenhum integrante ativo cadastrado." className="py-12 border-none bg-transparent shadow-none" />;
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {dados.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number | undefined) => [value ?? 0, 'Integrantes']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
