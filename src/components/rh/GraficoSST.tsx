import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { ShieldAlert } from 'lucide-react';

interface GraficoSSTProps {
  dados: { name: string; value: number }[];
}

const getSstColor = (status: string) => {
  if (status === 'REALIZADO') return '#16a34a';
  if (status === 'PENDENTE') return '#eab308';
  if (status === 'ATRASADO') return '#dc2626';
  return '#94a3b8';
};

export function GraficoSST({ dados }: GraficoSSTProps) {
  if (!dados || dados.length === 0) {
    return <EmptyState icon={ShieldAlert} title="Sem dados de SST" description="Nenhuma ação de saúde e segurança registrada." className="py-12 border-none bg-transparent shadow-none" />;
  }

  return (
    <div className="w-full h-full min-h-[220px] flex flex-col justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
          >
            {dados.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getSstColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number | undefined) => [value ?? 0, 'Ações']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
