import { useState, useMemo } from 'react';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ConfirmModal } from './ui/ConfirmModal';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
import { Gauge, Play, AlertTriangle } from 'lucide-react';
import type { User, Veiculo, Jornada } from '../types';

interface IniciarJornadaProps {
  usuarios: User[];
  veiculos: Veiculo[];
  operadorLogadoId: string;
  onJornadaIniciada: (novaJornada: any) => void;
  jornadasAtivas: Jornada[];
}

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

  // ConfirmModal de conflito de veículo
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');
  const [pendingDados, setPendingDados] = useState<any>(null);

  // Calcula o último KM do veículo selecionado
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

    // Validação de coerência: Avisa se o KM inserido for MENOR que o anterior
    if (ultimoKmReferencia > 0 && kmInicioFloat < ultimoKmReferencia) {
      toast.warning(`Atenção: O KM informado (${kmInicioFloat}) é MENOR que o último registrado (${ultimoKmReferencia}). Verifique o painel.`);
    }

    const dadosForm = {
      veiculoId,
      operadorId: operadorLogadoId,
      encarregadoId,
      kmInicio: kmInicioFloat,
    };

    const jornadaConflitante = jornadasAtivas.find(j => j.veiculo?.id === veiculoId);

    if (jornadaConflitante) {
      setConflictMsg(`O veículo selecionado já consta como EM ROTA com o motorista: ${jornadaConflitante.operador?.nome}. Tem certeza que selecionou o veículo correto e deseja iniciar uma nova jornada?`);
      setPendingDados(dadosForm);
      setShowConflictConfirm(true);
      setLoading(false);
      return;
    }

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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3 ring-4 ring-primary/5 shadow-inner">
            <Play className="w-6 h-6 text-primary ml-1" />
          </div>
          <h3 className="text-xl font-bold text-text-main">Iniciar Jornada</h3>
          <p className="text-sm text-text-secondary mt-1 px-4 leading-relaxed">
            Identifique o veículo e o responsável para liberar a saída.
          </p>
        </div>

        {/* Veículo */}
        <div>
          <Select
            label="Veículo"
            value={veiculoId}
            onChange={(e) => handleVeiculoChange(e.target.value)}
            disabled={loading}
            options={[
              { value: '', label: 'Selecione o veículo...' },
              ...veiculos
                .filter(v => v.status !== 'INATIVO')
                .map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))
            ]}
          />

          {avisoVeiculo && (
            <div className="mt-3 flex items-start gap-3 p-3 rounded-lg bg-warning-500/10 border border-warning-500/20 text-warning-700 text-xs font-medium animate-in slide-in-from-top-1">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold mb-0.5">Veículo em uso</p>
                {avisoVeiculo.replace('ATENÇÃO: ', '')}
              </div>
            </div>
          )}
        </div>

        {/* Encarregado */}
        <div>
          <Select
            label="Encarregado"
            value={encarregadoId}
            onChange={(e) => setEncarregadoId(e.target.value)}
            disabled={loading}
            options={[
              { value: '', label: 'Selecione o Encarregado...' },
              ...usuarios
                .filter(u => (u.role === 'ENCARREGADO' || u.role === 'ADMIN') && !u.nome.startsWith('[INATIVO]'))
                .map(u => ({ value: u.id, label: u.nome }))
            ]}
          />
        </div>

        {/* KM Inicial */}
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
            <div className="pointer-events-none absolute bottom-3 right-0 flex items-center px-3 text-text-muted">
              <Gauge className="w-5 h-5" />
            </div>
          </div>

          {/* Feedback Visual do Último KM */}
          {ultimoKmReferencia > 0 && (
            <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1 bg-primary/5 p-1 rounded w-fit px-2 ml-1 animate-in fade-in slide-in-from-left-2 border border-primary/10">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Anterior: {ultimoKmReferencia.toLocaleString()} KM
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3.5 text-base shadow-button hover:shadow-float"
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

      {/* Confirm Modal de conflito de veículo */}
      <ConfirmModal
        isOpen={showConflictConfirm}
        title="Veículo em Uso"
        description={conflictMsg}
        variant="warning"
        confirmLabel="Confirmar Mesmo Assim"
        onConfirm={() => {
          setShowConflictConfirm(false);
          if (pendingDados) {
            setFormDataParaModal(pendingDados);
            setModalAberto(true);
            setPendingDados(null);
          }
        }}
        onCancel={() => {
          setShowConflictConfirm(false);
          setPendingDados(null);
        }}
      />
    </>
  );
}


