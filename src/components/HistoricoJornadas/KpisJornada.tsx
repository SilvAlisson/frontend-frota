import { Activity, MapPin } from 'lucide-react';
import { Card } from '../ui/Card';

interface KpisJornadaProps {
  kmTotalGeral: number;
  totalViagens: number;
}

export function KpisJornada({ kmTotalGeral, totalViagens }: KpisJornadaProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
        <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Distância Total Percorrida
        </span>
        <span className="text-3xl font-sans font-black tracking-tight text-text-main truncate group-hover:text-primary transition-colors">
          {kmTotalGeral.toLocaleString('pt-BR')} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">km</small>
        </span>
      </Card>
      
      <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
        <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-info " /> Total de Viagens
        </span>
        <span className="text-3xl font-sans font-black tracking-tight text-text-main group-hover:text-info dark:group-hover:text-sky-400 transition-colors">
          {totalViagens} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">Registros</small>
        </span>
      </Card>
    </div>
  );
}
