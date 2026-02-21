import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { 
  AlertTriangle, CheckCircle2, Loader2, 
  Wrench, FileText, Clock, ChevronRight 
} from 'lucide-react';
import type { Alerta } from '../types';

// ✨ Componentes Elite
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';

interface PainelAlertasProps { }

export function PainelAlertas({ }: PainelAlertasProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAlertas = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/relatorios/alertas');
        setAlertas(response.data);
      } catch (err) {
        console.error("Erro ao buscar alertas:", err);
        setError('Não foi possível verificar o estado da frota.');
        toast.error('Falha ao carregar alertas.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlertas();
  }, []);

  // --- LOADING (Premium Skeleton) ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60 gap-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-text-secondary font-black uppercase tracking-widest animate-pulse">A analisar métricas da frota...</p>
      </div>
    );
  }

  // --- ERRO (Com Callout) ---
  if (error) {
    return (
      <div className="pt-4 animate-in fade-in duration-300">
        <Callout variant="danger" title="Falha de Sincronização" icon={AlertTriangle}>
          <p className="mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-black uppercase tracking-widest hover:underline text-error"
          >
            Tentar novamente
          </button>
        </Callout>
      </div>
    );
  }

  // --- TUDO OK (O NOSSO EMPTY STATE EM AÇÃO) ---
  if (alertas.length === 0) {
    return (
      <div className="pt-8 animate-in zoom-in-95 duration-500">
         <EmptyState 
           icon={CheckCircle2} 
           title="Tudo em Ordem!" 
           description="Nenhuma manutenção, certificação ou documento pendente na frota neste momento."
         />
      </div>
    );
  }

  // --- LISTA DE ALERTAS ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho do Painel */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <h3 className="text-xl sm:text-2xl font-black text-text-main flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-error/10 rounded-xl text-error border border-error/20 shadow-inner">
             <AlertTriangle className="w-5 h-5" />
          </div>
          Painel de Atenção
        </h3>
        
        <span className="bg-error/10 text-error text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-error/20 shadow-sm flex items-center gap-2">
          <span className="relative flex h-2 w-2 hidden sm:flex">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
          </span>
          {alertas.length} Pendências
        </span>
      </div>

      {/* Grid de Cartões */}
      <div className="grid gap-4 auto-rows-max">
        {alertas.map((alerta, index) => (
          <CardAlerta key={index} alerta={alerta} />
        ))}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTE DE CARD DE ALERTA ---
function CardAlerta({ alerta }: { alerta: Alerta }) {
  const isVencido = alerta.nivel === 'VENCIDO';
  const isPrevisao = alerta.mensagem.toUpperCase().includes('PREVISÃO');

  // Configuração Visual Base (Atenção - Warning)
  let config = {
    border: 'border-l-warning-500',
    textTitle: 'text-warning-600',
    badgeBg: 'bg-warning-500/10 text-warning-700 border-warning-500/20',
    iconBg: 'bg-warning-500/10 text-warning-600 border-warning-500/20',
    icon: AlertTriangle,
    category: 'Atenção',
    badgeLabel: alerta.nivel
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

  // Sobrescrita para PREVISÃO (Informativo - Sky/Primary)
  if (isPrevisao) {
    config = {
      border: 'border-l-sky-500',
      textTitle: 'text-sky-600',
      badgeBg: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
      iconBg: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
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
    }
  }

  const IconComponent = config.icon;

  return (
    <div className={`
      group relative overflow-hidden bg-surface p-5 rounded-2xl shadow-sm border border-border/60 
      hover:shadow-md transition-all duration-300 flex items-start gap-4 border-l-[4px] hover:border-l-[8px] cursor-default
      ${config.border}
    `}>
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
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${config.badgeBg}`}>
            {config.badgeLabel}
          </span>
        </div>
        <p className="text-text-main text-sm sm:text-base font-bold leading-snug line-clamp-2 tracking-tight">
          {alerta.mensagem}
        </p>
      </div>

      {/* Seta Hover, indica que a atenção está focada no item */}
      <div className="self-center text-border group-hover:text-text-muted transition-colors opacity-0 lg:group-hover:opacity-100">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}