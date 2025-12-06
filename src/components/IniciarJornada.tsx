import { useState } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
import type { User, Veiculo, Jornada } from '../types';

interface IniciarJornadaProps {
  usuarios: User[];
  veiculos: Veiculo[];
  operadorLogadoId: string;
  onJornadaIniciada: (novaJornada: any) => void;
  jornadasAtivas: Jornada[]; // Ajustar para tipo correto se possível
}

const selectStyle = "w-full px-4 py-3 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 appearance-none transition-all cursor-pointer shadow-sm hover:border-gray-400";
const labelStyle = "block mb-1.5 text-sm font-bold text-text-secondary";

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
  const [avisoVeiculo, setAvisoVeiculo] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  // Verifica se o motorista JÁ tem uma jornada em outro veículo (regra de negócio comum)
  // Se o backend permitir múltiplas, pode remover esta checagem específica
  const isEsteVeiculoJaAberto = jornadasAtivas.some(j => j.veiculo?.id === veiculoId);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmInicio(formatKmVisual(e.target.value));
  };

  const handleVeiculoChange = (veiculoIdSelecionado: string) => {
    setVeiculoId(veiculoIdSelecionado);
    setAvisoVeiculo('');

    if (!veiculoIdSelecionado) return;

    // Verifica se ESTE veículo já está em uso por OUTRA pessoa (se a lista incluir jornadas de todos)
    // Ajuste a lógica conforme o que vem em 'jornadasAtivas'
    const jornadaDesteVeiculo = jornadasAtivas.find(j => j.veiculo?.id === veiculoIdSelecionado);

    if (jornadaDesteVeiculo) {
      setAvisoVeiculo(`Veículo em uso por ${jornadaDesteVeiculo.operador?.nome} desde ${new Date(jornadaDesteVeiculo.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (isEsteVeiculoJaAberto) {
      toast.error('Este veículo já está em uma jornada ativa.');
      setLoading(false);
      return;
    }
    if (!veiculoId || !encarregadoId || !kmInicio) {
      toast.warning('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    const kmInicioFloat = parseDecimal(kmInicio);
    if (isNaN(kmInicioFloat) || kmInicioFloat <= 0) {
      toast.error('O KM Inicial deve ser válido.');
      setLoading(false);
      return;
    }

    // Preparar para Modal de Foto
    const dadosForm = {
      veiculoId,
      operadorId: operadorLogadoId,
      encarregadoId,
      kmInicio: kmInicioFloat,
    };

    setFormDataParaModal(dadosForm);
    setModalAberto(true);
    setLoading(false);
  };

  const handleModalSuccess = (novaJornada: any) => {
    toast.success('Jornada iniciada com sucesso! Boa viagem.');
    onJornadaIniciada(novaJornada);

    // Reset
    setModalAberto(false);
    setFormDataParaModal(null);
    setVeiculoId('');
    setEncarregadoId('');
    setKmInicio('');
    setAvisoVeiculo('');
  };

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3 ring-4 ring-primary/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Iniciar Jornada
          </h3>
          <p className="text-sm text-text-secondary mt-1 px-4 leading-relaxed">
            Identifique o veículo e o responsável para liberar a saída.
          </p>
        </div>

        {/* Veículo */}
        <div>
          <label className={labelStyle}>Veículo</label>
          <div className="relative group">
            <select
              className={selectStyle}
              value={veiculoId}
              onChange={(e) => handleVeiculoChange(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione o veículo...</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} - {v.modelo}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Aviso de Indisponibilidade */}
          {(avisoVeiculo || isEsteVeiculoJaAberto) && (
            <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-medium animate-in slide-in-from-top-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <span>{avisoVeiculo || "Veículo já possui jornada ativa."}</span>
            </div>
          )}
        </div>

        {/* Encarregado */}
        <div>
          <label className={labelStyle}>Encarregado (Autorização)</label>
          <div className="relative group">
            <select
              className={selectStyle}
              value={encarregadoId}
              onChange={(e) => setEncarregadoId(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione quem autorizou...</option>
              {usuarios
                .filter(u => u.role === 'ENCARREGADO' || u.role === 'ADMIN')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* KM Inicial */}
        <div>
          <Input
            label="KM Inicial (Painel)"
            type="text"
            inputMode="numeric"
            placeholder="Ex: 50.420"
            value={kmInicio}
            onChange={handleKmChange}
            disabled={loading}
            className="text-lg tracking-wide font-medium"
          />
        </div>

        <Button
          type="submit"
          className="w-full py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          isLoading={loading}
          disabled={loading || !veiculoId || !encarregadoId || !kmInicio || isEsteVeiculoJaAberto || !!avisoVeiculo}
        >
          {loading ? 'Validando...' : 'Confirmar Saída'}
        </Button>

      </form>

      {/* Modal de Foto */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo="Foto do Painel (Saída)"
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