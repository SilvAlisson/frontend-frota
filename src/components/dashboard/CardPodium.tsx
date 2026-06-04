import { Trophy, Medal, Award, Truck } from 'lucide-react';
import type { VeiculoRanking } from '../../hooks/useRankingVeiculos';

interface CardPodiumProps {
  pos: number;
  veiculo: VeiculoRanking;
  isWinner?: boolean;
}

export function CardPodium({ pos, veiculo, isWinner }: CardPodiumProps) {
  const config = {
    1: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-500',
      icon: Trophy,
      label: 'Mais Econômico',
      labelBg: 'bg-yellow-500 text-white'
    },
    2: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-600 dark:text-slate-400',
      icon: Medal,
      label: '2ª Lugar',
      labelBg: 'bg-slate-500 text-white'
    },
    3: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-600 dark:text-orange-500',
      icon: Award,
      label: '3ª Lugar',
      labelBg: 'bg-orange-500 text-white'
    }
  }[pos as 1 | 2 | 3];

  const Icon = config.icon;

  return (
    <div className={`
        relative rounded-[2rem] border p-6 flex flex-col items-center text-center transition-all duration-500 overflow-hidden group
        ${config.bg} ${config.border} backdrop-blur-sm
        ${isWinner ? 'h-72 justify-end ring-2 ring-yellow-500/30 z-10 transform sm:scale-105 shadow-xl bg-yellow-500/15' : 'h-64 justify-end opacity-95 hover:opacity-100 sm:hover:scale-105 shadow-md'}
      `}>

      {/* Reflexo / Brilho Sutil */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Posição Gigante de Fundo (Mais discreto no dark mode) */}
      <div className={`absolute -top-4 -right-2 font-black text-9xl opacity-[0.07] dark:opacity-[0.04] select-none ${config.text} drop-shadow-md`}>
        {pos}
      </div>

      <div className={`absolute top-5 left-5 p-2 bg-surface/80 rounded-xl backdrop-blur-md shadow-sm border border-border/50 ${config.text}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Avatar do Veículo */}
      <div className="relative mb-5">
        <div className={`w-20 h-20 rounded-2xl border-2 border-surface shadow-lg flex items-center justify-center bg-surface/80 backdrop-blur-xl overflow-hidden transform group-hover:scale-110 transition-transform ${config.text}`}>
          <Truck className="w-10 h-10 drop-shadow-sm" />
        </div>
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg shadow-md whitespace-nowrap border border-white/10 ${config.labelBg}`}>
          {config.label}
        </div>
      </div>

      <h3 className={`font-black truncate w-full px-2 text-2xl tracking-tight leading-none mb-1 ${config.text}`}>{veiculo.placa}</h3>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 opacity-80 ${config.text}`}>{veiculo.modelo}</p>

      {/* Stats Box */}
      <div className="w-full bg-surface/80 rounded-2xl p-3 backdrop-blur-xl border border-border/50 shadow-sm relative z-10">
        <div className="flex flex-col">
          <span className={`text-[9px] uppercase tracking-[0.2em] font-black mb-0.5 opacity-80 ${config.text}`}>Média de Consumo</span>
          <span className={`font-mono font-black text-3xl tracking-tighter ${config.text}`}>
            {veiculo.kml.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[10px] uppercase tracking-widest font-bold ml-1 opacity-70">km/l</span>
          </span>
        </div>
      </div>
    </div>
  );
}
