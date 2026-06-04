import { cn } from '../../../lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}

export function KpiCard({ label, value, icon: Icon, colorClass }: KpiCardProps) {
  return (
    <div className="bg-surface border border-border/60 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center border shrink-0', colorClass)}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-text-main leading-tight">{value}</p>
      </div>
    </div>
  );
}
