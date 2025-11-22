import { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { parseDecimal, formatKmVisual } from '../utils'; // Importar utilitários

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
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";


export function FinalizarJornada({
  token,
  jornadaParaFinalizar,
  onJornadaFinalizada
}: FinalizarJornadaProps) {

  const [kmFim, setKmFim] = useState('');
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  // --- Handler para formatar KM visualmente ---
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmFim(formatKmVisual(e.target.value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    // --- Validações ---
    if (!kmFim) {
      setError('O KM Final é obrigatório.');
      return;
    }

    // Converter a string formatada ("50.420") para número (50420)
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
        <h3 className="text-xl font-semibold text-klin-azul text-center">
          Finalizar Jornada Atual
        </h3>

        <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
          <p className="text-sm text-gray-700">Seu KM Inicial: <strong>{jornadaParaFinalizar.kmInicio.toLocaleString('pt-BR')}</strong></p>
          <p className="text-sm text-gray-700">Encarregado: <strong>{jornadaParaFinalizar.encarregado.nome}</strong></p>
        </div>

        {/* Campo KM Final - Formatado */}
        <div>
          <label className={labelStyle} htmlFor={`kmFim-${jornadaParaFinalizar.id}`}>KM Final</label>
          <input
            id={`kmFim-${jornadaParaFinalizar.id}`}
            type="text" // Texto para permitir pontuação visual
            inputMode="numeric"
            placeholder={`Maior que ${jornadaParaFinalizar.kmInicio}`}
            className={inputStyle}
            value={kmFim}
            onChange={handleKmChange} // Usar o novo handler
          />
        </div>

        {error && (<p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>)}

        {/* Botão */}
        <button
          type="submit"
          className={buttonStyle}
          disabled={!kmFim}
        >
          Finalizar Jornada
        </button>
      </form>

      {/* Modal de Confirmação */}
      {modalAberto && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Confirmar Fim de Jornada"

          // Passar o número limpo para o modal exibir/enviar
          kmParaConfirmar={parseDecimal(kmFim)}

          jornadaId={jornadaParaFinalizar.id}
          apiEndpoint={`/jornada/finalizar/:jornadaId`}
          apiMethod="PUT"

          // Dados prontos para a API
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