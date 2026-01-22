import { useState } from 'react';
import { toast } from 'sonner';
import { Route, Search, RefreshCw } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';

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

  // Estados
  const [jornadaEditandoId, setJornadaEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Filtragem (busca por Placa, Motorista ou Modelo)
  const jornadasFiltradas = jornadasAbertas.filter(j => 
    j.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    j.motorista?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    j.veiculo?.modelo?.toLowerCase().includes(busca.toLowerCase())
  );

  // Handlers
  const handleFinalizar = (id: string) => {
    toast.success("Jornada processada.");
    onJornadaFinalizadaManualmente(id);
  };

  const handleSuccessEdit = () => {
    setJornadaEditandoId(null);
    window.location.reload(); // Refresh simples para atualizar dados
  };

  return (
    <div className="space-y-4">

      {/* 1. PAINEL DE CONTROLE (STICKY SEARCH) */}
      {/* O top-[145px] é ajustado para colar logo abaixo das abas do DashboardEncarregado */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm sticky top-[145px] z-10 transition-all">
        <div className="flex justify-between items-end mb-3">
            <div>
                <h3 className="text-gray-900 font-bold text-lg leading-none">Monitoramento</h3>
                <p className="text-gray-500 text-xs mt-1">Frota em circulação</p>
            </div>
            <div className="text-right">
                <span className="block text-3xl font-black text-gray-900 leading-none tracking-tight">
                    {jornadasAbertas.length}
                </span>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    Veículos Ativos
                </span>
            </div>
        </div>

        <div className="relative">
            <Input 
                placeholder="🔍 Buscar placa ou motorista..." 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all h-11 text-base shadow-sm"
            />
            {/* Botão de Refresh manual para garantir dados frescos no campo */}
            <button 
                onClick={() => window.location.reload()}
                className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-primary active:scale-95 transition-transform bg-white/50 rounded-lg"
                title="Atualizar dados"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* 2. LISTA DE VEÍCULOS (CARDS) */}
      {jornadasAbertas.length === 0 ? (
        // Empty State Otimizado
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 bg-gray-50/50 shadow-none mx-1">
          <div className="p-4 bg-white rounded-full mb-3 ring-1 ring-gray-200 shadow-sm">
            <Route className="w-8 h-8 text-gray-300" />
          </div>
          <h4 className="text-base font-bold text-gray-900">Pátio Cheio</h4>
          <p className="text-gray-500 text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">
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
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200 shadow-sm mx-1">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Sem resultados para "<span className="font-bold text-gray-700">{busca}</span>"</p>
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL DE EDIÇÃO */}
      <Modal 
        isOpen={!!jornadaEditandoId} 
        onClose={() => setJornadaEditandoId(null)}
        title="Corrigir Jornada"
        className="max-w-md w-full mx-4" // Melhor ajuste mobile (margem lateral)
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