import { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import { parseDecimal } from '../utils';
// 1. Novos ícones padronizados
import { Edit, Trash2 } from 'lucide-react';

interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  operador: { nome: string };
  fotoInicioUrl: string | null;
}

interface JornadaItemProps {
  token?: string; // Opcional/Legado
  jornada: Jornada;
  onFinalizada: (jornadaId: string) => void;
  onExcluida?: (jornadaId: string) => void;
  // 2. Nova propriedade obrigatória para permitir a edição
  onEditar: (jornada: Jornada) => void;
}

export function JornadaGestaoItem({ jornada, onFinalizada, onExcluida, onEditar }: JornadaItemProps) {

  const [kmFim, setKmFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

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
      setError(`O KM deve ser maior que ${jornada.kmInicio}.`);
      setLoading(false);
      return;
    }

    const promise = api.put(`/jornadas/finalizar/${jornada.id}`, {
      kmFim: kmFimFloat,
      observacoes: `[Finalizado manualmente pelo Gestor]`
    });

    toast.promise(promise, {
      loading: 'Finalizando jornada...',
      success: () => {
        onFinalizada(jornada.id);
        return 'Jornada encerrada com sucesso.';
      },
      error: (err) => {
        console.error("Falha ao finalizar jornada:", err);
        setLoading(false);
        return err.response?.data?.error || 'Falha ao finalizar.';
      }
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta jornada em andamento?")) return;

    setDeleting(true);
    const promise = api.delete(`/jornadas/${jornada.id}`);

    toast.promise(promise, {
      loading: 'Excluindo jornada...',
      success: () => {
        if (onExcluida) onExcluida(jornada.id);
        else onFinalizada(jornada.id);
        return 'Jornada excluída.';
      },
      error: (err) => {
        console.error("Falha na exclusão:", err);
        setDeleting(false);
        return 'Erro ao excluir. Verifique permissões.';
      }
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all duration-300 relative group animate-in fade-in slide-in-from-bottom-2">

      {/* 3. GRUPO DE AÇÕES (EDITAR + EXCLUIR) */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100">
        
        {/* Botão Editar (Correção) */}
        <Button
          type="button"
          variant="ghost"
          className="!p-1.5 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          onClick={() => onEditar(jornada)}
          disabled={loading || deleting}
          title="Corrigir dados (KM/Veículo)"
          icon={<Edit className="w-4 h-4" />}
        />

        {/* Botão Excluir */}
        <Button
          type="button"
          variant="ghost"
          className="!p-1.5 h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          onClick={handleDelete}
          disabled={loading || deleting}
          isLoading={deleting}
          title="Excluir Jornada"
          icon={<Trash2 className="w-4 h-4" />}
        />
      </div>

      {/* Info Principal */}
      <div className="flex flex-col md:flex-row gap-5 mb-5">

        {/* Lado Esquerdo: Motorista & Veículo */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shadow-sm border border-primary/20">
              {jornada.operador.nome.charAt(0)}
            </div>
            <div>
              <h5 className="font-bold text-gray-900 text-lg leading-tight">{jornada.operador.nome}</h5>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Em andamento
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="bg-background text-gray-700 px-2 py-1 rounded-md text-sm font-mono border border-border">
              {jornada.veiculo.placa}
            </span>
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">
              {jornada.veiculo.modelo}
            </span>
          </div>
        </div>

        {/* Lado Direito: Dados da Viagem */}
        <div className="flex flex-col items-end justify-center bg-background p-3 rounded-lg border border-border min-w-[140px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Início</span>
          <span className="text-sm font-bold text-gray-800">
            {new Date(jornada.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-xs text-gray-500 mt-0.5">
            {new Date(jornada.dataInicio).toLocaleDateString('pt-BR')}
          </span>

          <div className="w-full h-px bg-border my-2"></div>

          <div className="w-full flex justify-between items-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold">KM</span>
            <span className="text-sm font-bold text-primary">{jornada.kmInicio}</span>
          </div>
        </div>
      </div>

      {/* Ação: Finalizar */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-dashed border-border">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="w-full">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1" htmlFor={`kmFim-${jornada.id}`}>
              Encerrar Turno (KM Final)
            </label>
            <Input
              id={`kmFim-${jornada.id}`}
              type="number"
              placeholder={`> ${jornada.kmInicio}`}
              value={kmFim}
              onChange={(e) => {
                setKmFim(e.target.value);
                if (error) setError('');
              }}
              disabled={loading || deleting}
              error={error}
              className="h-10"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto h-10 shadow-lg shadow-primary/10 whitespace-nowrap"
            disabled={loading || !kmFim || deleting}
            isLoading={loading}
          >
            Finalizar
          </Button>
        </div>
      </form>
    </div>
  );
}