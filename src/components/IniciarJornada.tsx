import { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';

interface IniciarJornadaProps {
  usuarios: any[];
  veiculos: any[];
  operadorLogadoId: string;
  onJornadaIniciada: (novaJornada: any) => void;
  jornadasAtivas: any[];
}

const inputStyle = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";
const labelStyle = "block mb-1.5 text-sm font-medium text-text-secondary";

export function IniciarJornada({
  usuarios,
  veiculos,
  operadorLogadoId,
  onJornadaIniciada,
  jornadasAtivas
}: IniciarJornadaProps) {

  const [veiculoId, setVeiculoId] = useState('');
  const [encarregadoId, setEncarregadoId] = useState('');
  const [kmInicio, setKmInicio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avisoVeiculo, setAvisoVeiculo] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  const isEsteVeiculoJaAberto = jornadasAtivas.some(j => j.veiculoId === veiculoId);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmInicio(formatKmVisual(e.target.value));
  };

  const handleVeiculoChange = (veiculoIdSelecionado: string) => {
    setVeiculoId(veiculoIdSelecionado);
    setAvisoVeiculo('');
    if (!veiculoIdSelecionado) return;

    const jornadaNossaEsteVeiculo = jornadasAtivas.find(j => j.veiculoId === veiculoIdSelecionado);
    if (jornadaNossaEsteVeiculo) {
      setAvisoVeiculo(`Você já está com esta jornada aberta (Início: ${jornadaNossaEsteVeiculo.kmInicio} KM).`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isEsteVeiculoJaAberto) {
      setError(`Você já iniciou uma jornada com este veículo. Finalize-a na coluna ao lado.`);
      setLoading(false);
      return;
    }
    if (!veiculoId || !encarregadoId || !kmInicio) {
      setError('Veículo, Encarregado e KM Inicial são obrigatórios.');
      setLoading(false);
      return;
    }

    const kmInicioFloat = parseDecimal(kmInicio);

    if (isNaN(kmInicioFloat) || kmInicioFloat <= 0) {
      setError('O KM Inicial deve ser um número válido e positivo.');
      setLoading(false);
      return;
    }

    try {
      const dadosCompletosDoFormulario = {
        veiculoId: veiculoId,
        operadorId: operadorLogadoId,
        encarregadoId: encarregadoId,
        kmInicio: kmInicioFloat,
      };

      setFormDataParaModal(dadosCompletosDoFormulario);
      setModalAberto(true);

    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      setError('Falha ao preparar dados para envio.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = (novaJornada: any) => {
    setSuccess('Jornada iniciada com sucesso!');
    onJornadaIniciada(novaJornada);

    setModalAberto(false);
    setFormDataParaModal(null);
    setVeiculoId('');
    setEncarregadoId('');
    setKmInicio('');
    setAvisoVeiculo('');
  };

  return (
    <>
      <form className="space-y-6 relative" onSubmit={handleSubmit}>

        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary">
            Iniciar Nova Jornada
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Selecione o veículo e o encarregado responsável.
          </p>
        </div>

        <div>
          <label className={labelStyle}>Veículo</label>
          <div className="relative">
            <select
              className={inputStyle}
              value={veiculoId}
              onChange={(e) => handleVeiculoChange(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione um veículo...</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} ({v.modelo})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div>
          <label className={labelStyle}>Encarregado</label>
          <div className="relative">
            <select
              className={inputStyle}
              value={encarregadoId}
              onChange={(e) => setEncarregadoId(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione um encarregado...</option>
              {usuarios
                .filter(u => u.role === 'ENCARREGADO')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <Input
          label="KM Inicial (Odómetro)"
          type="text"
          inputMode="numeric"
          placeholder="Ex: 19.000"
          value={kmInicio}
          onChange={handleKmChange}
          disabled={loading}
        />

        {avisoVeiculo && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
            {avisoVeiculo}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
            {success}
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-3"
          isLoading={loading}
          disabled={loading || !veiculoId || !encarregadoId || !kmInicio || isEsteVeiculoJaAberto}
        >
          {loading ? 'Validando...' : 'Iniciar Jornada'}
        </Button>

        {isEsteVeiculoJaAberto && (
          <p className="text-center text-xs text-error font-medium mt-2">
            * Veículo indisponível.
          </p>
        )}
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo="Confirmar Início de Jornada"
          kmParaConfirmar={parseDecimal(kmInicio)}
          dadosJornada={formDataParaModal}
          apiEndpoint="/jornada/iniciar"
          apiMethod="POST"
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}