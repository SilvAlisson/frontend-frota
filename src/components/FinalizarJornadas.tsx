import React, { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
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
  jornadaParaFinalizar: JornadaAtiva;
  onJornadaFinalizada: () => void;
}

export function FinalizarJornada({
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
  };

  return (
    <>
      <form
        className="space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold text-primary">
            Finalizar Jornada Atual
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Confirme os dados para encerrar o turno.
          </p>
        </div>

        {/* Resumo da Jornada */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">KM Inicial:</span>
            <span className="font-bold text-text">{jornadaParaFinalizar.kmInicio.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Encarregado:</span>
            <span className="font-bold text-text">{jornadaParaFinalizar.encarregado.nome}</span>
          </div>
        </div>

        {/* Campo KM Final */}
        <div>
          <Input
            label="KM Final"
            id={`kmFim-${jornadaParaFinalizar.id}`}
            type="text"
            inputMode="numeric"
            placeholder={`Maior que ${jornadaParaFinalizar.kmInicio}`}
            value={kmFim}
            onChange={handleKmChange}
            error={error} // Passa o erro diretamente para o Input
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          disabled={!kmFim}
        >
          Finalizar Jornada
        </Button>
      </form>

      {modalAberto && (
        <ModalConfirmacaoFoto
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