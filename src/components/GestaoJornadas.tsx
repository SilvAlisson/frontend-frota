import { useState } from 'react';
import { toast } from 'sonner';
import { Route, Search } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { PageHeader } from './ui/PageHeader';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';

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

  // Filtragem (busca simples no cliente)
  const jornadasFiltradas = jornadasAbertas.filter(j =>
    j.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    j.motorista?.nome?.toLowerCase().includes(busca.toLowerCase())
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
    <div className="space-y-6 pb-10">

      {/* 1. HEADER */}
      <PageHeader
        title="Monitoramento em Tempo Real"
        subtitle="Acompanhe e gerencie os veículos que estão em circulação agora."
        extraAction={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {jornadasAbertas.length > 0 && (
              <Badge variant="success" className="h-9 px-3 text-xs">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {jornadasAbertas.length} Ativas
              </Badge>
            )}
            <div className="w-full sm:w-64">
              <Input
                placeholder="Buscar placa ou motorista..."
                icon={<Search className="w-4 h-4 text-gray-400" />}
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>
        }
      />

      {/* 2. CONTEÚDO (LISTA DE CARDS) */}
      {jornadasAbertas.length === 0 ? (
        // Empty State Padronizado
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 bg-gray-50/50 shadow-none">
          <div className="p-4 bg-white rounded-full mb-4 ring-1 ring-gray-200 shadow-sm">
            <Route className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">Nenhum veículo em rota</h4>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            Todas as jornadas foram finalizadas ou ainda não foram iniciadas hoje.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jornadasFiltradas.length > 0 ? (
            jornadasFiltradas.map(jornada => (
              // Usamos o componente existente, mas vamos garantir que ele seja responsivo
              <JornadaGestaoItem
                key={jornada.id}
                jornada={jornada}
                token="" // Se não for usado, pode remover do componente filho depois
                onFinalizada={handleFinalizar}
                onExcluida={handleFinalizar}
                onEditar={(j) => setJornadaEditandoId(j.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Nenhuma jornada encontrada para "{busca}"
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL DE EDIÇÃO */}
      <Modal
        isOpen={!!jornadaEditandoId}
        onClose={() => setJornadaEditandoId(null)}
        title="Editar Jornada"
        className="max-w-2xl"
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