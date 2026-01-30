import { useState } from 'react';
import { toast } from 'sonner';
import { Route, Search, RefreshCw, Truck } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button'; // Importando Button

// --- COMPONENTES & FORMS ---
import { JornadaGestaoItem } from './JornadaGestaoItem';
import { FormEditarJornada } from './forms/FormEditarJornada';

interface GestaoJornadasProps {
  jornadasAbertas: any[];
  onJornadaFinalizadaManualmente: (jornadaId: string) => void;
}

export function GestaoJornadas({
  jornadasAbertas,
  onJornadaFinalizadaManualmente
}: GestaoJornadasProps) {

  const [jornadaEditandoId, setJornadaEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Filtragem (busca por Placa, Motorista ou Modelo)
  const jornadasFiltradas = jornadasAbertas.filter(j => 
    j.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    j.motorista?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    j.veiculo?.modelo?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleFinalizar = (id: string) => {
    toast.success("Jornada processada.");
    onJornadaFinalizadaManualmente(id);
  };

  const handleSuccessEdit = () => {
    setJornadaEditandoId(null);
    window.location.reload(); 
  };

  return (
    <div className="space-y-4 animate-enter">

      {/* 1. PAINEL DE CONTROLE (STICKY) */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-float sticky top-[145px] z-10 transition-all">
        <div className="flex justify-between items-end mb-3">
            <div>
                <h3 className="text-text-main font-bold text-lg leading-none flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Monitoramento
                </h3>
                <p className="text-text-secondary text-xs mt-1">Frota em circulação</p>
            </div>
            <div className="text-right">
                <span className="block text-3xl font-black text-text-main leading-none tracking-tight">
                    {jornadasAbertas.length}
                </span>
                <span className="text-[10px] font-bold text-success uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                    Veículos Ativos
                </span>
            </div>
        </div>

        <div className="relative flex gap-2">
            <div className="flex-1">
              <Input 
                  placeholder="🔍 Buscar placa ou motorista..." 
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="bg-background border-border focus:bg-surface transition-all h-11 text-base shadow-inner"
              />
            </div>
            <Button 
                variant="secondary"
                onClick={() => window.location.reload()}
                className="h-11 w-11 p-0 flex items-center justify-center bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-primary"
                title="Atualizar dados"
            >
                <RefreshCw className="w-5 h-5" />
            </Button>
        </div>
      </div>

      {/* 2. LISTA DE VEÍCULOS (CARDS) */}
      {jornadasAbertas.length === 0 ? (
        // Empty State
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 bg-surface/50 shadow-none mx-1">
          <div className="p-4 bg-surface rounded-full mb-3 ring-1 ring-border shadow-sm">
            <Route className="w-8 h-8 text-text-muted" />
          </div>
          <h4 className="text-base font-bold text-text-main">Pátio Cheio</h4>
          <p className="text-text-secondary text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">
            Nenhum veículo iniciou jornada ainda. Tudo tranquilo por aqui.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 px-1 pb-20">
          {jornadasFiltradas.length > 0 ? (
            jornadasFiltradas.map(jornada => (
              <JornadaGestaoItem
                key={jornada.id}
                jornada={jornada}
                token="" 
                onFinalizada={handleFinalizar}
                onExcluida={handleFinalizar}
                onEditar={(j) => setJornadaEditandoId(j.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-text-muted bg-surface rounded-xl border border-dashed border-border shadow-sm mx-1">
              <Search className="w-8 h-8 mx-auto mb-3 text-text-muted/50" />
              <p className="text-sm">Sem resultados para "<span className="font-bold text-text-main">{busca}</span>"</p>
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL DE EDIÇÃO */}
      <Modal 
        isOpen={!!jornadaEditandoId} 
        onClose={() => setJornadaEditandoId(null)}
        title="Corrigir Jornada"
        className="max-w-md w-full mx-4"
      >
        {jornadaEditandoId && (
          <FormEditarJornada
            jornadaId={jornadaEditandoId}
            onSuccess={handleSuccessEdit}
            onCancelar={() => setJornadaEditandoId(null)}
          />
        )}
      </Modal>

    </div>
  );
}