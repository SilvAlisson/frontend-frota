import { motion } from 'framer-motion';
import { 
  AlertTriangle, Clock, Wrench, FileText, 
  Timer, UserX, Bug, ShieldAlert, HeartPulse, Trash2, ChevronRight 
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { Alerta } from '../../types';

interface CardAlertaProps {
  alerta: Alerta;
  onClick: () => void;
  onDismiss: () => void;
}

export function CardAlerta({ alerta, onClick, onDismiss }: CardAlertaProps) {
  const isVencido = alerta.nivel === 'VENCIDO';
  const isPrevisao = alerta.mensagem.toUpperCase().includes('PREVISÃO');

  // Configuração Visual Base (Atenção - Usando as variáveis dinâmicas do Tailwind CSS v4)
  let config = {
    border: 'border-l-warning',
    textTitle: 'text-warning',
    badgeBg: 'bg-warning/10 text-warning border-warning/20',
    iconBg: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertTriangle,
    category: 'Atenção',
    badgeLabel: alerta.nivel as string
  };

  // Sobrescrita para VENCIDO (Crítico - Error)
  if (isVencido) {
    config = {
      border: 'border-l-error',
      textTitle: 'text-error',
      badgeBg: 'bg-error/10 text-error border-error/20',
      iconBg: 'bg-error/10 text-error border-error/20',
      icon: AlertTriangle,
      category: 'Crítico',
      badgeLabel: 'VENCIDO'
    };
  }

  // Sobrescrita para PREVISÃO (Informativo - Cores fixas precisam do 'dark:' explícito)
  if (isPrevisao) {
    config = {
      border: 'border-l-info',
      textTitle: 'text-info ',
      badgeBg: 'bg-info/10 text-info border-info/20',
      iconBg: 'bg-info/10 text-info border-info/20',
      icon: Clock,
      category: 'Previsão de Rodagem',
      badgeLabel: 'PROJETADO'
    };
  }

  // Seleção de Ícone por Tipo
  if (!isPrevisao) {
    if (alerta.tipo === 'MANUTENCAO') {
      config.icon = Wrench;
      config.category = 'Manutenção';
    } else if (alerta.tipo === 'DOCUMENTO') {
      config.icon = FileText;
      config.category = 'Documentação';
    } else if (alerta.tipo === 'VEICULO_OCIOSO') {
      config.icon = Timer;
      config.category = 'Máquina Parada';
      config.badgeBg = 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20';
      config.iconBg = 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20';
      config.border = 'border-l-stone-500';
      config.textTitle = 'text-stone-600 dark:text-stone-400';
      config.badgeLabel = 'OCIOSO';
    } else if (alerta.tipo === 'OPERADOR_OCIOSO') {
      config.icon = UserX;
      config.category = 'Falta de Rodagem';
      config.badgeBg = 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20';
      config.iconBg = 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20';
      config.border = 'border-l-stone-500';
      config.textTitle = 'text-stone-600 dark:text-stone-400';
      config.badgeLabel = 'AUSENTE';
    } else if (alerta.tipo === 'TENTATIVA_FRAUDE') {
      config.icon = ShieldAlert;
      config.category = 'Auditoria';
      config.badgeBg = 'bg-error/10 text-error border-error/20';
      config.iconBg = 'bg-error/10 text-error border-error/20';
      config.border = 'border-l-error';
      config.textTitle = 'text-error';
      config.badgeLabel = 'FRAUDE';
    } else if (alerta.tipo === 'ERRO_SISTEMA') {
      config.icon = Bug;
      config.category = 'App Crash';
      config.badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      config.iconBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      config.border = 'border-l-amber-500';
      config.textTitle = 'text-amber-600 dark:text-amber-400';
      config.badgeLabel = 'FALHA';
    } else if (alerta.tipo === 'SST') {
      config.icon = HeartPulse;
      config.category = 'SST & Saúde';
      config.badgeBg = 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      config.iconBg = 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      config.border = 'border-l-violet-500';
      config.textTitle = 'text-violet-600 dark:text-violet-400';
      config.badgeLabel = alerta.nivel === 'VENCIDO' ? 'VENCIDO' : 'ATENÇÃO';
    }
  }

  const IconComponent = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="relative w-full"
    >
      {/* Fundo que aparece ao arrastar (Swipe-to-Dismiss indicator) */}
      <div className="absolute inset-0 bg-error/10 border border-error/20 rounded-2xl flex items-center px-6 justify-between">
        <Trash2 className="w-5 h-5 text-error opacity-70" />
        <Trash2 className="w-5 h-5 text-error opacity-70" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 120) {
            onDismiss();
          }
        }}
        whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
        className="w-full relative z-10"
      >
        <Button 
          variant="ghost"
          onClick={onClick}
          className={`
            text-left w-full !p-0 h-auto
            group relative overflow-hidden bg-surface rounded-2xl shadow-sm border border-border/60 
            hover:shadow-md transition-all duration-300 flex items-start gap-0 cursor-pointer
            ${config.border}
          `}
        >
          <div className={`p-5 flex items-start gap-4 w-full h-full border-l-[4px] group-hover:border-l-[8px] transition-all ${config.border}`}>
            {/* Ícone (Glassmorphism) */}
            <div className={`p-3 rounded-xl flex-shrink-0 shadow-inner border ${config.iconBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${config.textTitle}`}>
                  {config.category}
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border shadow-sm ${config.badgeBg}`}>
                  {config.badgeLabel}
                </span>
              </div>
              <p className="text-text-main text-sm sm:text-base font-bold leading-snug line-clamp-2 tracking-tight pointer-events-none">
                {alerta.mensagem}
              </p>
            </div>

            {/* Seta Hover, indica que a atenção está focada no item */}
            <div className="self-center text-border group-hover:text-text-muted transition-colors opacity-0 lg:group-hover:opacity-100">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </Button>
      </motion.div>
    </motion.div>
  );
}
