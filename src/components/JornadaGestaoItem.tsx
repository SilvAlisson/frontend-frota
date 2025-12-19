import { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import { parseDecimal } from '../utils';

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
}

function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

export function JornadaGestaoItem({ jornada, onFinalizada, onExcluida }: JornadaItemProps) {

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
      error: (err) => { // CORREÇÃO APLICADA: 'err' é logado
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
      error: (err) => { // CORREÇÃO APLICADA: 'err' é logado
        console.error("Falha na exclusão:", err);
        setDeleting(false);
        return 'Erro ao excluir. Verifique permissões.';
      }
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-300 relative group animate-in fade-in slide-in-from-bottom-2">

      {/* Botão Excluir */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          className="!p-1.5 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
          onClick={handleDelete}
          disabled={loading || deleting}
          isLoading={deleting}
          title="Excluir Jornada (Correção)"
          icon={<IconeLixo />}
        />
      </div>

      {/* Info Principal */}
      <div className="flex flex-col md:flex-row gap-5 mb-5">

        {/* Lado Esquerdo: Motorista & Veículo */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm border border-white">
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
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono border border-gray-200">
              {jornada.veiculo.placa}
            </span>
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">
              {jornada.veiculo.modelo}
            </span>
          </div>
        </div>

        {/* Lado Direito: Dados da Viagem */}
        <div className="flex flex-col items-end justify-center bg-gray-50/50 p-3 rounded-lg border border-gray-100 min-w-[140px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Início</span>
          <span className="text-sm font-bold text-gray-800">
            {new Date(jornada.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-xs text-gray-500 mt-0.5">
            {new Date(jornada.dataInicio).toLocaleDateString('pt-BR')}
          </span>

          <div className="w-full h-px bg-gray-200 my-2"></div>

          <div className="w-full flex justify-between items-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold">KM</span>
            <span className="text-sm font-bold text-primary">{jornada.kmInicio}</span>
          </div>
        </div>
      </div>

      {/* Ação: Finalizar */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-dashed border-gray-200">
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