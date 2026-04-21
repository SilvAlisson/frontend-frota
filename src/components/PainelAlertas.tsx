import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { 
  AlertTriangle, CheckCircle2, Loader2, 
  Wrench, FileText, Clock, ChevronRight,
  Timer, UserX, X, Bug, ShieldAlert, HeartPulse
} from 'lucide-react';
import type { Alerta } from '../types';

// ✨ Componentes Elite
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';
import { Button } from './ui/Button';

interface PainelAlertasProps { 
  onAlertaClick?: (alerta: Alerta) => void;
}

export function PainelAlertas({ onAlertaClick }: PainelAlertasProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados para o Modal de Ociosidade Exclusivo
  const [alertaOciosoSelecionado, setAlertaOciosoSelecionado] = useState<Alerta | null>(null);
  
  // Estados para o Modal de Auditoria (Logs/Erros)
  const [logAuditSelecionado, setLogAuditSelecionado] = useState<Alerta | null>(null);

  const [isResolvendo, setIsResolvendo] = useState(false);

  const handleAlertaClick = (alerta: Alerta) => {
    if (onAlertaClick) {
      onAlertaClick(alerta);
      return;
    }
    
    if (alerta.tipo === 'VEICULO_OCIOSO' || alerta.tipo === 'OPERADOR_OCIOSO') {
      setAlertaOciosoSelecionado(alerta);
      return;
    }

    if (alerta.tipo === 'TENTATIVA_FRAUDE' || alerta.tipo === 'ERRO_SISTEMA') {
      setLogAuditSelecionado(alerta);
      return;
    }

    if (alerta.tipo === 'SST') {
      navigate('/admin/sst?tab=treinamentos');
      return;
    }

    if (!alerta.veiculoId) return;

    if (alerta.tipo === 'DOCUMENTO') {
      navigate(`/admin/veiculos/${alerta.veiculoId}?tab=documentos`);
    } else if (alerta.tipo === 'MANUTENCAO') {
      // Se for vencido, pode ir para a aba de oficina para ver o histórico ou para a tela de lançamento
      if (alerta.nivel === 'VENCIDO') {
        navigate(`/admin/veiculos/${alerta.veiculoId}?tab=manutencoes`);
      } else {
        navigate(`/admin/manutencoes/nova?veiculoId=${alerta.veiculoId}`);
      }
    }
  };

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

  // --- FUNÇÕES DE RESOLUÇÃO INTERATIVA (OCIOSIDADE) ---
  const resolverAlertaOcioso = async (isMotivoJustificado: boolean) => {
    if (!alertaOciosoSelecionado) return;
    
    if (!isMotivoJustificado) {
      toast.success('Cobrança Registrada. Oriente o responsável a abrir a jornada no celular.');
      setAlertaOciosoSelecionado(null);
      return;
    }

    setIsResolvendo(true);
    try {
      if (alertaOciosoSelecionado.tipo === 'VEICULO_OCIOSO') {
        await api.put(`/veiculos/${alertaOciosoSelecionado.veiculoId}/status`, { status: 'EM_MANUTENCAO' });
      } else {
        await api.put(`/usuarios/${alertaOciosoSelecionado.usuarioId}/status`, { status: 'ATESTADO' });
      }
      toast.success('Status atualizado! O alerta não aparecerá mais até que voltem à ativa.');
      // Remove do array visualmente para não precisar dar reload na página
      setAlertas(prev => prev.filter(a => a !== alertaOciosoSelecionado));
      setAlertaOciosoSelecionado(null);
    } catch (e) {
      toast.error('Ocorreu um erro ao atualizar o status.');
    } finally {
      setIsResolvendo(false);
    }
  };

  // --- FUNÇÕES DE RESOLUÇÃO DE AUDITORIA/LOGS ---
  const resolverLogAudit = async () => {
    if (!logAuditSelecionado?.logId) return;
    setIsResolvendo(true);
    try {
      await api.put(`/logs/${logAuditSelecionado.logId}/resolver`);
      toast.success('Log Arquivado. Solução registrada na auditoria.');
      setAlertas(prev => prev.filter(a => a !== logAuditSelecionado));
      setLogAuditSelecionado(null);
    } catch (e) {
      toast.error('Erro ao arquivar log de sistema.');
    } finally {
      setIsResolvendo(false);
    }
  };

  // --- LOADING (Premium Skeleton) ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60 gap-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-text-secondary font-black uppercase tracking-widest animate-pulse">Analisando métricas da frota...</p>
      </div>
    );
  }

  // --- ERRO (Com Callout) ---
  if (error) {
    return (
      <div className="pt-4 animate-in fade-in duration-300">
        <Callout variant="danger" title="Falha de Sincronização" icon={AlertTriangle}>
          <p className="mb-2">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="ghost" size="sm"
            className="text-xs font-black uppercase tracking-widest text-error hover:text-error hover:bg-error/10 mt-2"
          >
            Tentar novamente
          </Button>
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
          <CardAlerta key={index} alerta={alerta} onClick={() => handleAlertaClick(alerta)} />
        ))}
      </div>

      {/* --- MODAL DE TRIAGEM DE OCIOSIDADE --- */}
      {alertaOciosoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-border/60 animate-in zoom-in-95 duration-300">
            <div className="p-6 relative">
              <Button 
                onClick={() => setAlertaOciosoSelecionado(null)}
                variant="ghost" size="icon"
                className="absolute top-4 right-4 rounded-full text-text-muted"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="w-14 h-14 bg-stone-500/10 rounded-full flex items-center justify-center mb-4 border border-stone-500/20">
                {alertaOciosoSelecionado.tipo === 'VEICULO_OCIOSO' ? <Timer className="w-7 h-7 text-stone-600" /> : <UserX className="w-7 h-7 text-stone-600" />}
              </div>
              
              <h2 className="text-xl font-black text-text-main tracking-tight mb-2">Triagem de Inatividade</h2>
              <p className="text-text-secondary text-sm font-medium mb-6 leading-relaxed">
                {alertaOciosoSelecionado.mensagem}
              </p>

              <div className="space-y-3">
                <Button
                  disabled={isResolvendo} isLoading={isResolvendo}
                  onClick={() => resolverAlertaOcioso(true)}
                  variant="primary"
                  className="w-full py-6 text-sm font-black shadow-lg"
                >
                  {alertaOciosoSelecionado.tipo === 'VEICULO_OCIOSO' ? 'Sim, está na Oficina (Em Manutenção)' : 'Sim, está de Atestado/Férias'}
                </Button>
                <Button
                  disabled={isResolvendo}
                  onClick={() => resolverAlertaOcioso(false)}
                  variant="secondary"
                  className="w-full py-6 font-bold"
                >
                  {alertaOciosoSelecionado.tipo === 'VEICULO_OCIOSO' ? 'Não, vou enviar o aviso via Base' : 'Não, devia estar rodando. Vou cobrar!'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE AUDITORIA DE SISTEMA E FRAUDES --- */}
      {logAuditSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-border/60 animate-in zoom-in-95 duration-300">
            <div className="p-6 relative">
              <Button 
                onClick={() => setLogAuditSelecionado(null)}
                variant="ghost" size="icon"
                className="absolute top-4 right-4 rounded-full text-text-muted"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mb-4 border border-error/20">
                {logAuditSelecionado.tipo === 'TENTATIVA_FRAUDE' ? <ShieldAlert className="w-7 h-7 text-error" /> : <Bug className="w-7 h-7 text-error" />}
              </div>
              
              <h2 className="text-xl font-black text-text-main tracking-tight mb-2">Auditoria de Sistema</h2>
              <p className="text-text-secondary text-sm font-medium mb-6 leading-relaxed">
                {logAuditSelecionado.mensagem}
              </p>

              <div className="space-y-3">
                <Button
                  disabled={isResolvendo} isLoading={isResolvendo}
                  onClick={resolverLogAudit}
                  variant="danger"
                  className="w-full py-6 font-black shadow-lg"
                >
                  Ciente, Marcar como Corrigido
                </Button>
                <Button
                  disabled={isResolvendo}
                  onClick={() => setLogAuditSelecionado(null)}
                  variant="secondary"
                  className="w-full py-6 font-bold"
                >
                  Fechar para Análise
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUBCOMPONENTE DE CARD DE ALERTA ---
function CardAlerta({ alerta, onClick }: { alerta: Alerta, onClick: () => void }) {
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
      border: 'border-l-sky-500',
      textTitle: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
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
    <div 
      onClick={onClick}
      className={`
      group relative overflow-hidden bg-surface p-5 rounded-2xl shadow-sm border border-border/60 
      hover:shadow-md transition-all duration-300 flex items-start gap-4 border-l-[4px] hover:border-l-[8px] cursor-pointer
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
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border shadow-sm ${config.badgeBg}`}>
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


