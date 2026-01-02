import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import {
  AlertTriangle, CheckCircle2, RefreshCw,
  Wrench, FileText, Clock, ChevronRight
} from 'lucide-react'; // Ícones Lucide
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
        <p className="text-gray-500 text-sm font-medium animate-pulse">Analisando frota...</p>
      </div>
    );
  }

  // --- ERRO ---
  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-center">
        <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-3 text-red-500">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-red-800 font-medium text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-red-600 hover:underline font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- TUDO OK (EMPTY STATE) ---
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-green-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="p-4 bg-green-50 rounded-full shadow-inner mb-4 ring-8 ring-green-50/50">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-900">Tudo em dia!</h3>
        <p className="text-sm text-green-700 mt-1 text-center max-w-[250px]">
          Nenhuma manutenção ou documento pendente na frota no momento.
        </p>
      </div>
    );
  }

  // --- LISTA DE ALERTAS ---
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Painel de Atenção
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </h3>
        <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-100 shadow-sm">
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
  // Lógica inteligente: Se a mensagem contiver "Previsão", tratamos como alerta preditivo (Azul)
  const isPrevisao = alerta.mensagem.toUpperCase().includes('PREVISÃO');

  // Configuração Visual Base (Padrão: Atenção/Amarelo)
  let config = {
    border: 'border-l-amber-500',
    textTitle: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-50 text-amber-600 ring-amber-100',
    icon: AlertTriangle,
    category: 'Atenção',
    badgeLabel: alerta.nivel
  };

  // Sobrescrita para VENCIDO (Crítico/Vermelho)
  if (isVencido) {
    config = {
      border: 'border-l-red-500',
      textTitle: 'text-red-600',
      badgeBg: 'bg-red-100 text-red-700',
      iconBg: 'bg-red-50 text-red-600 ring-red-100',
      icon: AlertTriangle,
      category: 'Crítico',
      badgeLabel: 'VENCIDO'
    };
  }

  // Sobrescrita para PREVISÃO (Informativo/Azul)
  if (isPrevisao) {
    config = {
      border: 'border-l-blue-500',
      textTitle: 'text-blue-600',
      badgeBg: 'bg-blue-100 text-blue-700',
      iconBg: 'bg-blue-50 text-blue-600 ring-blue-100',
      icon: Clock,
      category: 'Previsão de Rodagem',
      badgeLabel: 'PROJETADO'
    };
  }

  // Seleção de Ícone por Tipo (se não for Previsão)
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
      group relative overflow-hidden bg-white p-4 rounded-xl shadow-sm border border-border 
      hover:shadow-md transition-all duration-200 flex items-start gap-4 border-l-4 cursor-default
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
        <p className="text-gray-800 text-sm font-medium leading-snug line-clamp-2">
          {alerta.mensagem}
        </p>
      </div>

      {/* Seta Hover */}
      <div className="self-center text-gray-300 group-hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}