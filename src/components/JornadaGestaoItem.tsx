import { useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { parseDecimal } from '../utils';
import { Truck, Clock, CheckCircle2 } from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { ConfirmModal } from './ui/ConfirmModal';
import { DropdownAcoes } from './ui/DropdownAcoes';

interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  operador: { nome: string };
  fotoInicioUrl: string | null;
}

interface JornadaGestaoItemProps {
  token?: string;
  jornada: Jornada;
  onFinalizada: (jornadaId: string) => void;
  onExcluida?: (jornadaId: string) => void;
  onEditar: (jornada: Jornada) => void;
}

export function JornadaGestaoItem({
  jornada,
  onFinalizada,
  onExcluida,
  onEditar
}: JornadaGestaoItemProps) {

  const [kmFim, setKmFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // --- ACTIONS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const kmFimFloat = parseDecimal(kmFim);

    if (!kmFim || kmFimFloat <= 0) {
      setError('Informe um KM válido.');
      setLoading(false);
      return;
    }

    if (kmFimFloat < jornada.kmInicio) {
      setError(`KM deve ser > ${jornada.kmInicio}.`);
      setLoading(false);
      return;
    }

    try {
      await api.put(`/jornadas/finalizar/${jornada.id}`, {
        kmFim: kmFimFloat,
        observacoes: `[Finalizado manualmente pelo Gestor]`
      });
      toast.success('Jornada encerrada com sucesso.');
      onFinalizada(jornada.id);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Falha ao finalizar.');
      toast.error('Erro ao finalizar jornada.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/jornadas/${deletingId}`);
      toast.success('Jornada excluída.');
      if (onExcluida) onExcluida(deletingId);
      else onFinalizada(deletingId);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir jornada.');
    } finally {
      setDeletingId(null);
    }
  };

  // Formatadores
  const dataInicio = new Date(jornada.dataInicio);

  return (
    <>
      <Card noPadding className="overflow-visible group transition-all hover:border-primary/30 hover:shadow-md">
        <div className="p-5">

          {/* HEADER: Motorista e Status */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/10">
                {jornada.operador.nome.charAt(0)}
              </div>
              <div>
                <h5 className="font-bold text-gray-900 leading-tight">{jornada.operador.nome}</h5>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="success" className="animate-pulse h-5 px-1.5 text-[10px]">
                    Em Andamento
                  </Badge>
                </div>
              </div>
            </div>

            {/* Ações (Editar/Excluir) */}
            <DropdownAcoes
              onEditar={() => onEditar(jornada)}
              onExcluir={() => setDeletingId(jornada.id)}
            />
          </div>

          {/* INFO GRID: Veículo e Horário */}
          <div className="grid grid-cols-2 gap-3 mb-5">

            {/* Veículo */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Truck className="w-3 h-3" /> Veículo
              </span>
              <span className="font-mono font-bold text-gray-800 text-sm">{jornada.veiculo.placa}</span>
              <span className="text-[10px] text-gray-500 truncate">{jornada.veiculo.modelo}</span>
            </div>

            {/* Início */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Início
              </span>
              <span className="font-bold text-gray-800 text-sm">
                {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] text-gray-500">
                {dataInicio.toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* FORM: Finalizar */}
          <form onSubmit={handleSubmit} className="pt-4 border-t border-dashed border-gray-200">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={`KM Final (> ${jornada.kmInicio})`}
                  type="number"
                  placeholder="000000"
                  value={kmFim}
                  onChange={(e) => {
                    setKmFim(e.target.value);
                    if (error) setError('');
                  }}
                  error={error}
                  disabled={loading}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                isLoading={loading}
                disabled={loading || !kmFim}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Encerrar
              </Button>
            </div>
          </form>

        </div>
      </Card>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmModal
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Excluir Jornada Ativa"
        description="Tem certeza? Isso apagará o registro de início e não poderá ser recuperado."
        variant="danger"
        confirmLabel="Sim, excluir agora"
      />
    </>
  );
}