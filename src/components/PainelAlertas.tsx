import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  AlertTriangle, CheckCircle2, Loader2, 
  Timer, UserX, Bug, ShieldAlert 
} from 'lucide-react';
import type { Alerta } from '../types';
import { AnimatePresence } from 'framer-motion';
import { haptics } from '../utils/haptics';

// Hooks Globais
import { useAlertas } from '../hooks/useAlertas';
import { useModalStore } from '../hooks/useModalStore';

// Componentes Elite
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';
import { Button } from './ui/Button';
import { CardAlerta } from './alertas/CardAlerta';

interface PainelAlertasProps { 
  onAlertaClick?: (alerta: Alerta) => void;
}

export function PainelAlertas({ onAlertaClick }: PainelAlertasProps) {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModalStore();

  const {
    alertas,
    isLoading,
    isError,
    refetch,
    resolverOciosidade,
    isResolvendoOciosidade,
    resolverLog,
    isResolvendoLog,
    dismissLocal
  } = useAlertas();

  // --- COMPORTAMENTO DO CLIQUE NOS ALERTAS ---
  const handleAlertaClick = (alerta: Alerta) => {
    // 1. Modais internos de triagem SEMPRE abrem primeiro, ignorando navegação externa
    if (alerta.tipo === 'VEICULO_OCIOSO' || alerta.tipo === 'OPERADOR_OCIOSO') {
      abrirModalOciosidade(alerta);
      return;
    }

    if (alerta.tipo === 'TENTATIVA_FRAUDE' || alerta.tipo === 'ERRO_SISTEMA') {
      abrirModalAuditoria(alerta);
      return;
    }

    // 2. Se houver prop onAlertaClick (DashboardEncarregado), delega a navegação a ele
    if (onAlertaClick) {
      onAlertaClick(alerta);
      return;
    }

    // 3. Comportamento padrão (Dashboard Admin)
    if (alerta.tipo === 'SST') {
      navigate('/admin/sst?tab=treinamentos');
      return;
    }

    if (!alerta.veiculoId) return;

    if (alerta.tipo === 'DOCUMENTO') {
      navigate(`/admin/veiculos/${alerta.veiculoId}?tab=documentos`);
    } else if (alerta.tipo === 'MANUTENCAO') {
      const isPrevisao = alerta.mensagem.toUpperCase().includes('PREVISÃO');
      
      // Correção do redirecionamento de PREVISÃO e VENCIDO
      if (isPrevisao || alerta.nivel === 'VENCIDO') {
        navigate('/admin/planos');
      } else {
        navigate(`/admin/manutencoes/nova?veiculoId=${alerta.veiculoId}`);
      }
    }
  };

  // --- ORQUESTRAÇÃO DOS MODAIS GLOBAIS ---
  const abrirModalOciosidade = (alerta: Alerta) => {
    const modalId = openModal('CUSTOM', {
      title: "Triagem de Inatividade",
      content: (
        <div className="flex flex-col items-center pt-2">
          <div className="w-14 h-14 bg-stone-500/10 rounded-full flex items-center justify-center mb-4 border border-stone-500/20">
            {alerta.tipo === 'VEICULO_OCIOSO' ? <Timer className="w-7 h-7 text-stone-600" /> : <UserX className="w-7 h-7 text-stone-600" />}
          </div>
          
          <p className="text-text-secondary text-sm font-medium mb-6 leading-relaxed text-center">
            {alerta.mensagem}
          </p>

          <div className="space-y-3 w-full">
            <Button
              disabled={isResolvendoOciosidade} isLoading={isResolvendoOciosidade}
              onClick={async () => {
                const isVeiculo = alerta.tipo === 'VEICULO_OCIOSO';
                const id = isVeiculo ? alerta.veiculoId! : alerta.usuarioId!;
                const status = isVeiculo ? 'EM_MANUTENCAO' : 'ATESTADO';
                
                await resolverOciosidade({ isVeiculo, id, status });
                closeModal(modalId);
              }}
              variant="primary"
              className="w-full py-6 text-sm font-black shadow-lg"
            >
              {alerta.tipo === 'VEICULO_OCIOSO' ? 'Sim, está na Oficina (Em Manutenção)' : 'Sim, está de Atestado/Férias'}
            </Button>
            <Button
              disabled={isResolvendoOciosidade}
              onClick={() => {
                toast.success('Cobrança Registrada. Oriente o responsável a abrir a jornada no celular.');
                closeModal(modalId);
              }}
              variant="secondary"
              className="w-full py-6 font-bold"
            >
              Não! Deveria estar rodando. Vou cobrar!
            </Button>
          </div>
        </div>
      )
    });
  };

  const abrirModalAuditoria = (alerta: Alerta) => {
    const modalId = openModal('CUSTOM', {
      title: "Auditoria de Sistema",
      content: (
        <div className="flex flex-col items-center pt-2">
          <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mb-4 border border-error/20">
            {alerta.tipo === 'TENTATIVA_FRAUDE' ? <ShieldAlert className="w-7 h-7 text-error" /> : <Bug className="w-7 h-7 text-error" />}
          </div>
          
          <p className="text-text-secondary text-sm font-medium mb-6 leading-relaxed text-center">
            {alerta.mensagem}
          </p>

          <div className="space-y-3 w-full">
            <Button
              disabled={isResolvendoLog} isLoading={isResolvendoLog}
              onClick={async () => {
                if (alerta.logId) {
                  await resolverLog(alerta.logId);
                }
                closeModal(modalId);
              }}
              variant="danger"
              className="w-full py-6 font-black shadow-lg"
            >
              Ciente, Marcar como Corrigido
            </Button>
            <Button
              disabled={isResolvendoLog}
              onClick={() => closeModal(modalId)}
              variant="secondary"
              className="w-full py-6 font-bold"
            >
              Fechar para Análise
            </Button>
          </div>
        </div>
      )
    });
  };

  // --- LOADING (Premium Skeleton) ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60 gap-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-text-secondary font-black uppercase tracking-widest animate-pulse">Analisando métricas da frota...</p>
      </div>
    );
  }

  // --- ERRO (Com Callout) ---
  if (isError) {
    return (
      <div className="pt-4 animate-in fade-in duration-300">
        <Callout variant="danger" title="Falha de Sincronização" icon={AlertTriangle}>
          <p className="mb-2">Não foi possível verificar o estado da frota.</p>
          <Button
            onClick={() => refetch()}
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
        <AnimatePresence>
          {alertas.map((alerta, index) => (
            <CardAlerta 
              key={`${alerta.tipo}-${index}`} 
              alerta={alerta} 
              onClick={() => handleAlertaClick(alerta)} 
              onDismiss={() => {
                haptics.heavy();
                dismissLocal(alerta);
              }}
            />
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}