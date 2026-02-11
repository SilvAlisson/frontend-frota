import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Route, 
  Search, 
  RefreshCw, 
  Truck, 
  MapPin, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

// --- DESIGN SYSTEM ---
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ConfirmModal } from './ui/ConfirmModal';
import { Skeleton } from './ui/Skeleton';
import { Modal } from './ui/Modal';
import { FormEditarJornada } from './forms/FormEditarJornada';
import { DropdownAcoes } from './ui/DropdownAcoes';

// Função auxiliar para calcular duração
function formatDuration(dateString: string) {
  const start = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHrs}h ${diffMins}m`;
}

interface GestaoJornadasProps {
  jornadasAbertas: any[];
  onJornadaFinalizadaManualmente: (id?: string) => void;
  isLoading?: boolean;
}

export function GestaoJornadas({ 
  jornadasAbertas, 
  onJornadaFinalizadaManualmente,
  isLoading = false
}: GestaoJornadasProps) {
  
  const [jornadaParaEncerrar, setJornadaParaEncerrar] = useState<string | null>(null);
  const [jornadaEditandoId, setJornadaEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [encerrando, setEncerrando] = useState(false);

  // Filtragem Otimizada
  const jornadasFiltradas = jornadasAbertas.filter(j => 
    j.motorista?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    j.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    j.veiculo?.modelo?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleEncerrar = async () => {
    if (!jornadaParaEncerrar) return;
    setEncerrando(true);
    try {
      await api.put(`/jornadas/${jornadaParaEncerrar}/finalizar`, {
        kmFinal: 0, // Backend assume o último KM ou trata como forçado
        observacao: "Encerrado manualmente via Painel Administrativo"
      });
      toast.success("Jornada finalizada com sucesso.");
      onJornadaFinalizadaManualmente(jornadaParaEncerrar);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao finalizar jornada.");
    } finally {
      setEncerrando(false);
      setJornadaParaEncerrar(null);
    }
  };

  const handleSuccessEdit = () => {
    setJornadaEditandoId(null);
    toast.success("Jornada atualizada.");
    onJornadaFinalizadaManualmente(); // Recarrega a lista
  };

  return (
    <div className="space-y-6 animate-enter">
      
      {/* 1. HEADER & CONTROLES (Estático e Limpo) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Frota em Circulação
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie os <strong className="text-text-main">{jornadasAbertas.length} veículos</strong> que estão rodando agora.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Input 
                placeholder="Buscar motorista, placa..." 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                icon={<Search className="w-4 h-4 text-text-muted" />}
                className="bg-surface h-10"
             />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => onJornadaFinalizadaManualmente()} 
            className="h-10 w-10 p-0 text-text-secondary hover:text-primary hover:bg-surface-hover border border-border bg-surface"
            title="Atualizar Lista"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. GRID DE JORNADAS (Design Card Big Tech) */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jornadasFiltradas.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-2xl bg-surface/30">
              <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-text-muted/50" />
              </div>
              <h3 className="text-lg font-bold text-text-main">Tudo tranquilo!</h3>
              <p className="text-sm text-text-secondary max-w-xs">
                Nenhuma jornada ativa encontrada com os filtros atuais.
              </p>
            </div>
          ) : (
            jornadasFiltradas.map((jornada) => (
              <div 
                key={jornada.id} 
                className="group relative bg-surface rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Barra de Status Lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-success transition-all group-hover:w-2"></div>

                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4 pl-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar do Motorista */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center font-bold text-text-main text-lg shadow-inner border border-white/10">
                      {jornada.motorista?.nome?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main text-base leading-tight">
                        {jornada.motorista?.nome}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="neutral" className="font-mono text-[10px] py-0.5 h-auto bg-surface-hover border-border">
                          {jornada.veiculo?.placa}
                        </Badge>
                        <span className="text-xs text-text-secondary truncate max-w-[140px]" title={jornada.veiculo?.modelo}>
                          {jornada.veiculo?.modelo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown de Ações */}
                  <DropdownAcoes 
                    onEditar={() => setJornadaEditandoId(jornada.id)}
                    onExcluir={() => setJornadaParaEncerrar(jornada.id)}
                    align="end"
                  />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 pl-3 mb-4">
                  <div className="bg-surface-hover/40 p-2.5 rounded-lg border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3" /> Duração
                    </span>
                    <span className="text-sm font-bold text-text-main font-mono">
                      {formatDuration(jornada.dataInicio)}
                    </span>
                  </div>
                  <div className="bg-surface-hover/40 p-2.5 rounded-lg border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3" /> Saída
                    </span>
                    <span className="text-sm font-bold text-text-main font-mono">
                      {new Date(jornada.dataInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                {/* Footer / Status */}
                <div className="pl-3 flex items-center justify-between pt-3 border-t border-dashed border-border">
                   <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/75 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                      </span>
                      <span className="text-xs font-bold text-success uppercase tracking-wide">Em Andamento</span>
                   </div>
                   
                   {/* Botão Rápido de Encerrar (Opcional, pois já tem no dropdown) */}
                   <button 
                      onClick={() => setJornadaParaEncerrar(jornada.id)}
                      className="text-xs font-medium text-text-muted hover:text-error transition-colors flex items-center gap-1"
                   >
                     Encerrar <ChevronRight className="w-3 h-3" />
                   </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* --- MODAIS --- */}

      {/* Modal de Edição */}
      <Modal 
        isOpen={!!jornadaEditandoId} 
        onClose={() => setJornadaEditandoId(null)}
        title="Editar Jornada em Andamento"
        className="max-w-md"
      >
        {jornadaEditandoId && (
          <FormEditarJornada
            jornadaId={jornadaEditandoId}
            onSuccess={handleSuccessEdit}
            onCancelar={() => setJornadaEditandoId(null)}
          />
        )}
      </Modal>

      {/* Modal de Confirmação (Danger) */}
      <ConfirmModal
        isOpen={!!jornadaParaEncerrar}
        onCancel={() => setJornadaParaEncerrar(null)}
        onConfirm={handleEncerrar}
        title="Finalizar Jornada Manualmente?"
        description={
          <div className="space-y-3">
            <p>Você está encerrando a jornada sem o input do motorista.</p>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                O KM Final será registrado igual ao inicial ou baseado no último rastreio. Use essa função apenas para correções.
              </p>
            </div>
          </div>
        }
        confirmLabel={encerrando ? "Processando..." : "Confirmar Encerramento"}
        variant="danger"
      />

    </div>
  );
}

// Pequeno helper para o ícone de seta
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}