import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { ShieldAlert } from 'lucide-react';

interface GraficoSSTProps {
  dados: { name: string; value: number }[];
}

const getSstColor = (status: string) => {
  if (status === 'REALIZADO' || status === 'Válidos') return '#16a34a';
  if (status === 'PENDENTE' || status === 'Vencendo') return '#eab308';
  if (status === 'ATRASADO' || status === 'Vencidos') return '#dc2626';
  return '#94a3b8';
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
    fill?: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-surface border border-border/60 shadow-lg rounded-xl p-3 text-sm">
        <div className="flex items-center gap-2">
           <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill || getSstColor(data.name) }} />
           <span className="font-bold text-text-main">{data.name}</span>
        </div>
        <div className="mt-1 text-text-secondary font-medium pl-5">
           <span className="font-black text-text-main">{data.value}</span> {data.value === 1 ? 'integrante' : 'integrantes'}
        </div>
      </div>
    );
  }
  return null;
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
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
