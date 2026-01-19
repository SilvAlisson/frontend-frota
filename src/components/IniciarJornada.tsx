import { useState, useMemo } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
import { Gauge } from 'lucide-react'; // Ícone para o KM
import type { User, Veiculo, Jornada } from '../types';

interface IniciarJornadaProps {
  usuarios: User[];
  veiculos: Veiculo[];
  operadorLogadoId: string;
  onJornadaIniciada: (novaJornada: any) => void;
  jornadasAtivas: Jornada[];
}

const selectStyle = "w-full h-11 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer font-medium disabled:bg-gray-50 placeholder:text-gray-400 shadow-sm";
const labelStyle = "block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider ml-1";

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

  // ✅ [UX] Calcula o último KM do veículo selecionado para referência visual
  const ultimoKmReferencia = useMemo(() => {
    if (!veiculoId) return 0;
    const v = veiculos.find(veic => veic.id === veiculoId);
    return v?.ultimoKm || 0;
  }, [veiculoId, veiculos]);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmInicio(formatKmVisual(e.target.value));
  };

  const handleVeiculoChange = (veiculoIdSelecionado: string) => {
    setVeiculoId(veiculoIdSelecionado);
    setAvisoVeiculo('');

    if (!veiculoIdSelecionado) return;

    // Busca se existe jornada ativa para este veículo
    const jornadaExistente = jornadasAtivas.find(j => j.veiculo?.id === veiculoIdSelecionado);

    if (jornadaExistente) {
      const nomeMotorista = jornadaExistente.operador?.nome || "Outro motorista";
      const horaInicio = new Date(jornadaExistente.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setAvisoVeiculo(`ATENÇÃO: Este veículo está em uso por ${nomeMotorista} desde às ${horaInicio}.`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

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

    // ✅ [UX] Validação de coerência: Avisa se o KM inserido for MENOR que o anterior
    if (ultimoKmReferencia > 0 && kmInicioFloat < ultimoKmReferencia) {
      // Não bloqueamos (pois o painel pode ter sido trocado), mas avisamos forte.
      toast.warning(`Atenção: O KM informado (${kmInicioFloat}) é MENOR que o último registrado (${ultimoKmReferencia}). Verifique o painel.`);
    }

    const jornadaConflitante = jornadasAtivas.find(j => j.veiculo?.id === veiculoId);

    if (jornadaConflitante) {
      const confirmar = window.confirm(
        `AVISO CRÍTICO:\n\n` +
        `O veículo selecionado já consta como EM ROTA com o motorista: ${jornadaConflitante.operador?.nome}.\n\n` +
        `Tem certeza que selecionou o veículo correto e deseja iniciar uma nova jornada mesmo assim?`
      );

      if (!confirmar) {
        setLoading(false);
        return;
      }
    }

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
          <h3 className="text-xl font-bold text-gray-900">Iniciar Jornada</h3>
          <p className="text-sm text-gray-500 mt-1 px-4 leading-relaxed">
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

          {avisoVeiculo && (
            <div className="mt-3 flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-in slide-in-from-top-1">
              <div className="flex-1">
                <p className="font-bold mb-0.5">Veículo em uso</p>
                {avisoVeiculo.replace('ATENÇÃO: ', '')}
              </div>
            </div>
          )}
        </div>

        {/* Encarregado */}
        <div>
          <label className={labelStyle}>Encarregado</label>
          <div className="relative group">
            <select
              className={selectStyle}
              value={encarregadoId}
              onChange={(e) => setEncarregadoId(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione o Encarregado...</option>
              {usuarios
                .filter(u => u.role === 'ENCARREGADO' || u.role === 'ADMIN')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* KM Inicial (Com Feedback Visual do Último KM) */}
        <div>
          <div className="relative">
            <Input
              label="KM Inicial (Painel)"
              type="text"
              inputMode="numeric"
              placeholder={ultimoKmReferencia > 0 ? `Ref: ${ultimoKmReferencia}` : "Ex: 50.420"}
              value={kmInicio}
              onChange={handleKmChange}
              disabled={loading}
              className="text-lg tracking-wide font-medium pr-10"
            />
            <div className="pointer-events-none absolute bottom-3 right-0 flex items-center px-3 text-gray-400">
              <Gauge className="w-5 h-5" />
            </div>
          </div>

          {/* ✅ FEEDBACK VISUAL DO ÚLTIMO KM (AQUI ESTÁ A MÁGICA) */}
          {ultimoKmReferencia > 0 && (
            <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1 bg-primary/5 p-1 rounded w-fit px-2 ml-1 animate-in fade-in slide-in-from-left-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Anterior: {ultimoKmReferencia.toLocaleString()} KM
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          isLoading={loading}
          disabled={loading || !veiculoId || !encarregadoId || !kmInicio}
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
          apiEndpoint="/jornadas/iniciar"
          apiMethod="POST"
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}