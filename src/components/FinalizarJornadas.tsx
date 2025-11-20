import { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto'; 
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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

export function FinalizarJornada({ 
  token, 
  jornadaParaFinalizar, 
  onJornadaFinalizada 
}: FinalizarJornadaProps) {
  
  const [kmFim, setKmFim] = useState('');
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
      className="bg-transparent space-y-6" 
      onSubmit={handleSubmit}
    >
      {/* Cabeçalho */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
          {/* Ícone de Stop/Finalizar  */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-primary">
          Finalizar Jornada
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Registe o odómetro final e feche o turno.
        </p>
      </div>

      {/* Card de Informações */}
      <div className="bg-blue-50 p-4 rounded-card border border-blue-100 space-y-2">
         <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">KM Inicial:</span>
            <span className="font-bold text-primary text-lg">{jornadaParaFinalizar.kmInicio} KM</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Encarregado:</span>
            <span className="font-medium text-gray-900">{jornadaParaFinalizar.encarregado.nome}</span>
         </div>
      </div>

      {/* Campo KM Final */}
      <Input
        label="KM Final"
        type="number"
        placeholder={`Maior que ${jornadaParaFinalizar.kmInicio}`}
        value={kmFim}
        onChange={(e) => setKmFim(e.target.value)}
      />

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
             <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
           </svg>
           <span>{error}</span>
        </div>
      )}

      {/* Botão */}
      <Button 
        type="submit" 
        variant="primary"
        className="w-full py-3"
        disabled={!kmFim}
      >
        Confirmar Finalização
      </Button>

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