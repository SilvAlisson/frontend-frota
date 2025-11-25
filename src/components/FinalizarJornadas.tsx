import { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { parseDecimal, formatKmVisual } from '../utils';

// Interfaces
interface JornadaAtiva {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  encarregado: { nome: string };
}

interface FinalizarJornadaProps {
  token: string;
  jornadaParaFinalizar: JornadaAtiva;
  onJornadaFinalizada: () => void;
}

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-200 transition-colors";
const buttonStyle = "bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";


export function FinalizarJornada({
  token,
  jornadaParaFinalizar,
  onJornadaFinalizada
}: FinalizarJornadaProps) {

  const [kmFim, setKmFim] = useState('');
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmFim(formatKmVisual(e.target.value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!kmFim) {
      setError('O KM Final é obrigatório.');
      return;
    }

    const kmFimFloat = parseDecimal(kmFim);

    if (isNaN(kmFimFloat) || kmFimFloat <= 0) {
      setError('KM Final deve ser um número positivo e válido.');
      return;
    }

    if (kmFimFloat < jornadaParaFinalizar.kmInicio) {
      setError(`KM Final (${kmFimFloat.toLocaleString('pt-BR')}) não pode ser menor que o KM Inicial (${jornadaParaFinalizar.kmInicio.toLocaleString('pt-BR')}).`);
      return;
    }

    setModalAberto(true);
  };

  const handleModalSuccess = () => {
    onJornadaFinalizada();
    setKmFim('');
    setModalAberto(false);
  }

  return (
    <>
      <form
        className="bg-transparent space-y-4"
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl font-semibold text-primary text-center">
          Finalizar Jornada Atual
        </h3>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 mb-1">Seu KM Inicial: <span className="font-bold">{jornadaParaFinalizar.kmInicio.toLocaleString('pt-BR')}</span></p>
          <p className="text-sm text-gray-700">Encarregado: <span className="font-bold">{jornadaParaFinalizar.encarregado.nome}</span></p>
        </div>

        <div>
          <label className={labelStyle} htmlFor={`kmFim-${jornadaParaFinalizar.id}`}>KM Final</label>
          <input
            id={`kmFim-${jornadaParaFinalizar.id}`}
            type="text"
            inputMode="numeric"
            placeholder={`Maior que ${jornadaParaFinalizar.kmInicio}`}
            className={inputStyle}
            value={kmFim}
            onChange={handleKmChange}
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          className={buttonStyle}
          disabled={!kmFim}
        >
          Finalizar Jornada
        </button>
      </form>

      {modalAberto && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Confirmar Fim de Jornada"
          kmParaConfirmar={parseDecimal(kmFim)}
          jornadaId={jornadaParaFinalizar.id}
          apiEndpoint={`/jornada/finalizar/:jornadaId`}
          apiMethod="PUT"
          dadosJornada={{
            kmFim: parseDecimal(kmFim),
          }}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}