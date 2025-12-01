import { useState } from 'react';
import axios from 'axios';
import { api } from '../services/api'; // Usar api global
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  operador: { nome: string };
  fotoInicioUrl: string | null;
}

interface JornadaItemProps {
  // Token removido das props, pois usamos a instância global
  token: string; // Mantido apenas para compatibilidade se o pai ainda passar
  jornada: Jornada;
  onFinalizada: (jornadaId: string) => void;
  onExcluida?: (jornadaId: string) => void; // Nova prop para callback de exclusão
}

// Ícone de Lixeira para o botão de excluir
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

export function JornadaGestaoItem({ jornada, onFinalizada, onExcluida }: JornadaItemProps) {

  const [kmFim, setKmFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false); // Estado para loading da exclusão
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!kmFim) {
      setError('KM Final é obrigatório.');
      setLoading(false);
      return;
    }

    const kmFimFloat = parseFloat(kmFim);
    if (isNaN(kmFimFloat) || kmFimFloat < jornada.kmInicio) {
      setError(`KM Final deve ser maior que o Início (${jornada.kmInicio}).`);
      setLoading(false);
      return;
    }

    try {
      // O back-end permite que ENCARREGADO/ADMIN finalize a jornada de outro user
      // Usando a instância global 'api' que já tem interceptors
      await api.put(`/jornada/finalizar/${jornada.id}`, {
        kmFim: kmFimFloat,
        observacoes: `[Finalizado manualmente pelo Gestor/Admin]`
      });

      setLoading(false);
      onFinalizada(jornada.id);

    } catch (err: any) {
      console.error("Erro ao finalizar jornada (Encarregado):", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao finalizar jornada.');
      }
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmacao = window.confirm(
      `ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE esta jornada em aberto do operador ${jornada.operador.nome}?\n\nEsta ação não pode ser desfeita e é recomendada apenas para corrigir erros de lançamento.`
    );

    if (!confirmacao) return;

    setDeleting(true);
    try {
      await api.delete(`/jornada/${jornada.id}`);
      
      // Atualiza a lista no pai
      if (onExcluida) {
        onExcluida(jornada.id);
      } else {
        onFinalizada(jornada.id); // Fallback para atualizar a lista
      }
    } catch (err: any) {
      console.error("Erro ao excluir jornada:", err);
      alert("Erro ao excluir a jornada. Verifique se você tem permissão.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-primary/50 transition-all duration-200 relative group">

      {/* Botão de Excluir (Posicionado no canto superior direito) */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          type="button"
          variant="secondary" // Visual mais discreto (ghost/secondary)
          className="!p-1.5 h-8 w-8 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-none"
          onClick={handleDelete}
          disabled={loading || deleting}
          isLoading={deleting}
          title="Excluir Jornada (Correção de Erro)"
          icon={<IconeLixo />}
        />
      </div>

      {/* Cabeçalho do Item */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 pr-8"> {/* pr-8 para não sobrepor o botão de excluir */}

        {/* Lado Esquerdo: Operador e Veículo */}
        <div>
          <h5 className="text-lg font-bold text-primary flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            {jornada.operador.nome}
          </h5>
          <div className="text-sm text-gray-600 mt-2 flex items-center gap-2">
            <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded text-gray-800 border border-gray-200">
              {jornada.veiculo.placa}
            </span>
            <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">
              {jornada.veiculo.modelo}
            </span>
          </div>
        </div>

        {/* Lado Direito: Detalhes de Tempo e KM */}
        <div className="text-left md:text-right bg-gray-50 p-3 rounded-lg border border-gray-100 min-w-[160px]">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Início da Jornada</p>
          <p className="text-sm font-bold text-gray-900">
            {new Date(jornada.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between md:justify-end gap-2 items-center">
            <span className="text-xs text-gray-500">KM Inicial:</span>
            <span className="text-sm font-bold text-primary">{jornada.kmInicio}</span>
          </div>

          {jornada.fotoInicioUrl && (
            <div className="mt-2 text-right">
              <a
                href={jornada.fotoInicioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary-hover font-medium underline inline-flex items-center gap-1"
              >
                Ver Foto
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Área de Ação: Formulário de Finalização Manual */}
      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider" htmlFor={`kmFim-gestao-${jornada.id}`}>
            Ação de Encarregado: Finalizar Jornada
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:max-w-xs">
              <Input
                id={`kmFim-gestao-${jornada.id}`}
                type="number"
                placeholder={`KM Final (> ${jornada.kmInicio})`}
                value={kmFim}
                onChange={(e) => setKmFim(e.target.value)}
                disabled={loading || deleting}
              />
            </div>
            <Button
              type="submit"
              variant="primary" // Alterado de danger para primary para diferenciar da exclusão
              disabled={loading || !kmFim || deleting}
              isLoading={loading}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Encerrar Turno
            </Button>
          </div>

          {error && (
            <p className="text-error text-xs mt-2 flex items-center gap-1 animate-pulse font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}