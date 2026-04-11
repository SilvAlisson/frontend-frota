import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Route, 
  Search, 
  RefreshCw, 
  Truck, 
  MapPin, 
  Clock, 
  AlertCircle,
  ChevronRight 
} from 'lucide-react';
import { api } from '../services/api';
import autoAnimate from '@formkit/auto-animate';

// --- DESIGN SYSTEM ---
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ConfirmModal } from './ui/ConfirmModal';
import { Skeleton } from './ui/Skeleton';
import { Modal } from './ui/Modal';
import { FormEditarJornada } from './forms/FormEditarJornada';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';
import { FinalizarJornada } from './FinalizarJornadas';

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
  
  // Alterado para guardar o objeto completo, permitindo acesso ao kmInicio no encerramento
  const [jornadaParaEncerrar, setJornadaParaEncerrar] = useState<any | null>(null);
  const [jornadaEditandoId, setJornadaEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [encerrando, setEncerrando] = useState(false);

  //  Referência para a grelha animada
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parentRef.current) {
      autoAnimate(parentRef.current);
    }
  }, [parentRef]);

  // Filtragem Otimizada
  const jornadasFiltradas = jornadasAbertas.filter(j => 
    j.operador?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    j.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    j.veiculo?.modelo?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSuccessEdit = () => {
    setJornadaEditandoId(null);
    toast.success("Jornada atualizada.");
    onJornadaFinalizadaManualmente(); // Recarrega a lista pai
  };

  const handleSuccessEncerrar = () => {
    setJornadaParaEncerrar(null);
    onJornadaFinalizadaManualmente(); // Recarrega a lista pai
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. HEADER & CONTROLES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-black text-text-main flex items-center gap-2 tracking-tight">
            <Route className="w-6 h-6 text-primary" />
            Frota em Circulação
          </h2>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Gerencie os <strong className="text-text-main font-black">{jornadasAbertas.length} veículos</strong> que estão rodando agora.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
             <Input 
                placeholder="Buscar motorista, placa..." 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                icon={<Search className="w-4 h-4 text-text-muted" />}
                className="bg-surface border-border/60 h-11"
                containerClassName="!mb-0"
             />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => onJornadaFinalizadaManualmente()} 
            className="h-11 w-11 p-0 text-text-muted hover:text-primary hover:bg-primary/10 border border-border/60 bg-surface shadow-sm rounded-xl transition-all"
            title="Atualizar Lista"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 2. GRID DE JORNADAS */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 w-full rounded-[2rem] border border-border/40" />)}
        </div>
      ) : (
        <div ref={parentRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-max">
          {jornadasFiltradas.length === 0 ? (
            //  NOSSO EMPTY STATE SUBSTITUINDO O CÓDIGO MANUAL
            <div className="col-span-full pt-10 pb-6">
              <EmptyState 
                icon={Truck}
                title="Tudo tranquilo!"
                description="Nenhuma jornada ativa encontrada com os filtros atuais."
              />
            </div>
          ) : (
            jornadasFiltradas.map((jornada) => (
              <div 
                key={jornada.id} 
                className="group relative bg-surface rounded-[2rem] p-5 sm:p-6 border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col h-full"
              >
                {/* Barra de Status Lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-success transition-all group-hover:w-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>

                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-5 pl-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center font-black text-primary text-xl shadow-inner border border-primary/20 shrink-0">
                      {jornada.operador?.nome?.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-text-main text-lg leading-tight truncate tracking-tight">
                        {jornada.operador?.nome}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="neutral" className="font-mono text-[10px] px-2 py-0.5 h-auto bg-surface-hover border-border/60 shadow-sm">
                          {jornada.veiculo?.placa}
                        </Badge>
                        <span className="text-xs font-bold text-text-secondary truncate max-w-[140px] uppercase tracking-wider" title={jornada.veiculo?.modelo}>
                          {jornada.veiculo?.modelo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownAcoes 
                    onEditar={() => setJornadaEditandoId(jornada.id)}
                    onExcluir={() => setJornadaParaEncerrar(jornada)}
                    align="end"
                  />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 pl-2 mb-5">
                  <div className="bg-surface-hover/50 p-3 rounded-xl border border-border/40 shadow-inner flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-black tracking-widest text-text-muted flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" /> Duração
                    </span>
                    <span className="text-sm font-black text-text-main font-mono tracking-tighter">
                      {formatDuration(jornada.dataInicio)}
                    </span>
                  </div>
                  <div className="bg-surface-hover/50 p-3 rounded-xl border border-border/40 shadow-inner flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-black tracking-widest text-text-muted flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5" /> Saída
                    </span>
                    <span className="text-sm font-black text-text-main font-mono tracking-tighter">
                      {new Date(jornada.dataInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                {/* Footer / Status */}
                <div className="pl-2 flex items-center justify-between pt-4 mt-auto border-t border-dashed border-border/60">
                   <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                      </span>
                      <span className="text-[10px] font-black text-success uppercase tracking-widest">Em Andamento</span>
                   </div>
                   
                   <button 
                      onClick={() => setJornadaParaEncerrar(jornada)}
                      className="text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-error transition-colors flex items-center gap-1 bg-surface-hover px-2 py-1 rounded-lg border border-border/50"
                   >
                      Encerrar <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="p-2">
            <FormEditarJornada
              jornadaId={jornadaEditandoId}
              onSuccess={handleSuccessEdit}
              onCancelar={() => setJornadaEditandoId(null)}
            />
          </div>
        )}
      </Modal>

      {/* Modal de Encerramento Forçado (Agora Pede KM e Foto) */}
      <Modal
        isOpen={!!jornadaParaEncerrar}
        onClose={() => setJornadaParaEncerrar(null)}
        title="Forçar Encerramento"
        className="max-w-md"
      >
        {jornadaParaEncerrar && (
          <div className="p-2">
            <Callout variant="warning" title="Atenção" icon={AlertCircle} className="mb-6">
              Você está forçando o encerramento da jornada do operador <strong className="font-bold">{jornadaParaEncerrar.operador?.nome}</strong>. Insira o KM real que consta agora no painel do veículo.
            </Callout>
            
            <FinalizarJornada
              jornadaParaFinalizar={jornadaParaEncerrar}
              onJornadaFinalizada={handleSuccessEncerrar}
            />
          </div>
        )}
      </Modal>

    </div>
  );
}


