import { useState } from 'react';
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

// Componentes Elite
import { Modal } from './ui/Modal';
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';
import { Button } from './ui/Button';
import { CardAlerta } from './alertas/CardAlerta';

interface PainelAlertasProps { 
  onAlertaClick?: (alerta: Alerta) => void;
}

export function PainelAlertas({ onAlertaClick }: PainelAlertasProps) {
  const navigate = useNavigate();

  // ESTADOS LOCAIS PARA OS MODAIS DE RESOLUÇÃO
  const [alertaOcioso, setAlertaOcioso] = useState<Alerta | null>(null);
  const [alertaAuditoria, setAlertaAuditoria] = useState<Alerta | null>(null);

  const {
    alertas,
    isLoading,
    isError,
    refetch,
    resolverOciosidade,
    isResolvendoOciosidade,
    resolverLog,
    isResolvendoLog,
    resolverTodosLogs,
    isResolvendoTodosLogs,
    dismissLocal
  } = useAlertas();

  // --- COMPORTAMENTO DO CLIQUE NOS ALERTAS ---
  const handleAlertaClick = (alerta: Alerta) => {
    // 1. Modais internos de triagem SEMPRE abrem primeiro, acionando o ESTADO LOCAL
    if (alerta.tipo === 'VEICULO_OCIOSO' || alerta.tipo === 'OPERADOR_OCIOSO') {
      setAlertaOcioso(alerta);
      return;
    }

    if (alerta.tipo === 'TENTATIVA_FRAUDE' || alerta.tipo === 'ERRO_SISTEMA') {
      setAlertaAuditoria(alerta);
      return;
    }

    // 2. Se houver prop onAlertaClick (ex: DashboardEncarregado), delega a navegação a ele
    if (onAlertaClick) {
      onAlertaClick(alerta);
      return;
    }

    // 3. Comportamento padrão de navegação (Dashboard Admin)
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

  // --- LISTA DE ALERTAS E RENDERIZAÇÃO DOS MODAIS LOCAIS ---
  return (
    <>
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

        {/* Ação em Massa para Logs */}
        {alertas.filter(a => a.tipo === 'ERRO_SISTEMA' || a.tipo === 'TENTATIVA_FRAUDE').length > 1 && (
          <div className="flex justify-end mt-2 mb-4">
            <Button 
              variant="danger" 
              size="sm" 
              onClick={async () => {
                haptics.heavy();
                await resolverTodosLogs();
              }}
              isLoading={isResolvendoTodosLogs}
              disabled={isResolvendoTodosLogs}
              className="text-[10px] uppercase tracking-widest"
            >
              Marcar Todos os Logs como Resolvidos
            </Button>
          </div>
        )}

        {/* Grid de Cartões */}
        <div className="grid gap-4 auto-rows-max">
          <AnimatePresence>
            {alertas.map((alerta, index) => (
              <CardAlerta 
                key={`${alerta.tipo}-${alerta.veiculoId || alerta.usuarioId || alerta.logId || ''}-${index}`}
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

      {/*  MODAL DE OCIOSIDADE (Renderizado por cima de tudo) */}
      <Modal 
        isOpen={!!alertaOcioso} 
        onClose={() => setAlertaOcioso(null)} 
        title="Triagem de Inatividade"
      >
        {alertaOcioso && (
          <div className="text-center">
            <div className="w-14 h-14 bg-stone-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-500/20">
              {alertaOcioso.tipo === 'VEICULO_OCIOSO' ? <Timer className="w-7 h-7 text-stone-600" /> : <UserX className="w-7 h-7 text-stone-600" />}
            </div>
            
            <p className="text-text-secondary text-sm font-medium mb-8 leading-relaxed">
              {alertaOcioso.mensagem}
            </p>

            <div className="space-y-3 w-full">
              <Button
                disabled={isResolvendoOciosidade} 
                isLoading={isResolvendoOciosidade}
                onClick={async () => {
                  const isVeiculo = alertaOcioso.tipo === 'VEICULO_OCIOSO';
                  const id = isVeiculo ? alertaOcioso.veiculoId! : alertaOcioso.usuarioId!;
                  const status = isVeiculo ? 'EM_MANUTENCAO' : 'ATESTADO';
                  
                  try {
                    await resolverOciosidade({ isVeiculo, id, status });
                    setAlertaOcioso(null);
                  } catch (e) {}
                }}
                variant="primary"
                className="w-full py-6 text-sm font-black shadow-lg"
              >
                {alertaOcioso.tipo === 'VEICULO_OCIOSO' ? 'Sim, está na Oficina (Manutenção)' : 'Sim, está de Atestado/Férias'}
              </Button>
              
              <Button
                disabled={isResolvendoOciosidade}
                onClick={() => {
                  toast.success('Cobrança Registrada. Oriente o responsável a abrir a jornada no celular.');
                  setAlertaOcioso(null);
                }}
                variant="secondary"
                className="w-full py-6 font-bold"
              >
                Não! Deveria estar rodando. Vou cobrar!
              </Button>

              <Button
                disabled={isResolvendoOciosidade}
                onClick={() => setAlertaOcioso(null)}
                variant="ghost"
                className="w-full mt-2 uppercase tracking-widest text-xs font-black text-text-muted hover:text-text-main"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/*  MODAL DE AUDITORIA (Renderizado por cima de tudo) */}
      <Modal 
        isOpen={!!alertaAuditoria} 
        onClose={() => setAlertaAuditoria(null)}
        title="Auditoria de Sistema"
      >
        {alertaAuditoria && (
          <div className="text-center">
            <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-error/20">
              {alertaAuditoria.tipo === 'TENTATIVA_FRAUDE' ? <ShieldAlert className="w-7 h-7 text-error" /> : <Bug className="w-7 h-7 text-error" />}
            </div>

            <p className="text-text-secondary text-sm font-medium mb-8 leading-relaxed">
              {alertaAuditoria.mensagem}
            </p>

            <div className="space-y-3 w-full">
              <Button
                disabled={isResolvendoLog} 
                isLoading={isResolvendoLog}
                onClick={async () => {
                  if (alertaAuditoria.logId) {
                    try {
                      await resolverLog(alertaAuditoria.logId);
                      setAlertaAuditoria(null);
                    } catch (e) {}
                  }
                }}
                variant="danger"
                className="w-full py-6 font-black shadow-lg uppercase tracking-widest text-xs"
              >
                Ciente, Marcar como Corrigido
              </Button>
              
              <Button
                disabled={isResolvendoLog}
                onClick={() => setAlertaAuditoria(null)}
                variant="secondary"
                className="w-full py-6 font-bold uppercase tracking-widest text-xs"
              >
                Fechar para Análise
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}