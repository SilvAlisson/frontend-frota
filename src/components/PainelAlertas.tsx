import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { 
  AlertTriangle, CheckCircle2, RefreshCw, 
  Wrench, FileText, Clock, ChevronRight 
} from 'lucide-react';
import type { Alerta } from '../types';

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

  // --- LOADING ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-60">
        <div className="animate-spin text-primary mb-3">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-text-muted text-sm font-medium animate-pulse">Analisando frota...</p>
      </div>
    );
  }

  // --- ERRO ---
  if (error) {
    return (
      <div className="p-6 rounded-xl bg-error/10 border border-error/20 text-center">
        <div className="mx-auto w-10 h-10 bg-error/20 rounded-full flex items-center justify-center mb-3 text-error">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-error font-medium text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-error hover:underline font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- TUDO OK (EMPTY STATE) ---
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-2xl border border-success/20 shadow-sm animate-enter">
        <div className="p-4 bg-success/10 rounded-full shadow-inner mb-4 ring-8 ring-success/5">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="text-xl font-bold text-success">Tudo em dia!</h3>
        <p className="text-sm text-text-secondary mt-1 text-center max-w-[250px]">
          Nenhuma manutenção ou documento pendente na frota no momento.
        </p>
      </div>
    );
  }

  // --- LISTA DE ALERTAS ---
  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          Painel de Atenção
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
          </span>
        </h3>
        <span className="bg-error/10 text-error text-xs font-bold px-3 py-1 rounded-full border border-error/20 shadow-sm">
          {alertas.length} Pendências
        </span>
      </div>

      <div className="grid gap-3">
        {alertas.map((alerta, index) => (
          <CardAlerta key={index} alerta={alerta} />
        ))}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTE DE CARD ---
function CardAlerta({ alerta }: { alerta: Alerta }) {
  const isVencido = alerta.nivel === 'VENCIDO';
  const isPrevisao = alerta.mensagem.toUpperCase().includes('PREVISÃO');

  // Configuração Visual Base (Atenção - Warning)
  let config = {
    border: 'border-l-warning',
    textTitle: 'text-warning-700',
    badgeBg: 'bg-warning/15 text-warning-800',
    iconBg: 'bg-warning/10 text-warning ring-warning/20',
    icon: AlertTriangle,
    category: 'Atenção',
    badgeLabel: alerta.nivel
  };

  // Sobrescrita para VENCIDO (Crítico - Error)
  if (isVencido) {
    config = {
      border: 'border-l-error',
      textTitle: 'text-error',
      badgeBg: 'bg-error/15 text-error',
      iconBg: 'bg-error/10 text-error ring-error/20',
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
      badgeBg: 'bg-sky-500/15 text-sky-700',
      iconBg: 'bg-sky-500/10 text-sky-600 ring-sky-500/20',
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
      group relative overflow-hidden bg-surface p-4 rounded-xl shadow-card border border-border 
      hover:shadow-float transition-all duration-200 flex items-start gap-4 border-l-4 cursor-default
      ${config.border}
    `}>
      {/* Ícone */}
      <div className={`p-2.5 rounded-xl ring-1 flex-shrink-0 shadow-sm ${config.iconBg}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textTitle}`}>
            {config.category}
          </span>
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${config.badgeBg}`}>
            {config.badgeLabel}
          </span>
        </div>
        <p className="text-text-main text-sm font-medium leading-snug line-clamp-2">
          {alerta.mensagem}
        </p>
      </div>

      {/* Seta Hover */}
      <div className="self-center text-border group-hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}