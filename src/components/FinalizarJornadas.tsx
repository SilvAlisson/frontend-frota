// frontend/src/components/FinalizarJornada.tsx
// CORRIGIDO: Removido o 'setLoading' não utilizado.

import { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto'; 

// ... (Interfaces e Constantes de Estilo) ...
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
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";


export function FinalizarJornada({ 
  token, 
  jornadaParaFinalizar, 
  onJornadaFinalizada 
}: FinalizarJornadaProps) {
  
  const [kmFim, setKmFim] = useState('');
  // --- CORREÇÃO: Removido o estado de loading desnecessário ---
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    // --- Validações ---
    if (!kmFim) {
      setError('O KM Final é obrigatório.');
      return;
    }
    const kmFimFloat = parseFloat(kmFim);
    if (isNaN(kmFimFloat) || kmFimFloat <= 0) {
      setError('KM Final deve ser um número positivo e válido.');
      return;
    }
    if (kmFimFloat < jornadaParaFinalizar.kmInicio) {
      setError(`KM Final (${kmFimFloat}) não pode ser menor que o KM Inicial (${jornadaParaFinalizar.kmInicio}).`);
      return;
    }
    
    setModalAberto(true);
  };
  
  const handleModalSuccess = () => {
    onJornadaFinalizada();
    setKmFim('');
  }

  return (
    <form 
      className="bg-transparent space-y-4" 
      onSubmit={handleSubmit}
    >
      <h3 className="text-xl font-semibold text-klin-azul text-center">
        Finalizar Jornada Atual
      </h3>

      <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
         <p className="text-sm text-gray-700">Seu KM Inicial: <strong>{jornadaParaFinalizar.kmInicio}</strong></p>
         <p className="text-sm text-gray-700">Encarregado: <strong>{jornadaParaFinalizar.encarregado.nome}</strong></p>
      </div>

      {/* Campo KM Final */}
      <div>
        <label className={labelStyle} htmlFor={`kmFim-${jornadaParaFinalizar.id}`}>KM Final</label>
        <input
          id={`kmFim-${jornadaParaFinalizar.id}`}
          type="number"
          placeholder={`Deve ser maior que ${jornadaParaFinalizar.kmInicio}`}
          className={inputStyle}
          value={kmFim}
          onChange={(e) => setKmFim(e.target.value)}
          // disabled={loading} // <-- CORREÇÃO: Removido
        />
      </div>

      {/* Campo Foto Removido daqui */}

      {error && ( <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p> )}

      {/* Botão */}
      <button 
        type="submit" 
        className={buttonStyle}
        disabled={!kmFim} // <-- CORREÇÃO: Removido 'loading'
      >
        Finalizar Jornada
      </button>

      {modalAberto && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Confirmar Fim de Jornada"
          kmParaConfirmar={parseFloat(kmFim)}
          jornadaId={jornadaParaFinalizar.id} 
          apiEndpoint={`/jornada/finalizar/:jornadaId`} 
          apiMethod="PUT"
          dadosJornada={{
            kmFim: parseFloat(kmFim),
          }}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </form>
  );
}