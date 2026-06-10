import { useState, useMemo } from 'react';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { DateHelper } from '../lib/dateHelper';

// --- HOOKS E ABSTRAÇÕES ---
import { useVeiculos } from '../hooks/useVeiculos';
import { useHistoricoJornadas, type FiltrosJornada as IFiltrosJornada } from '../hooks/useHistoricoJornadas';
import { getFotoUrl } from './HistoricoJornadas/TabelaJornadas';

// --- UI COMPONENTS ---
import { PageHeader } from './ui/PageHeader';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal'; 
import { Lightbox } from './ui/Lightbox';
import { EmptyState } from './ui/EmptyState';
import { AlertTriangle } from 'lucide-react';

// --- FORMS ---
import { FormEditarJornada } from './forms/FormEditarJornada';

// --- SUB-COMPONENTES ABSTRAÍDOS ---
import { FiltrosJornada } from './HistoricoJornadas/FiltrosJornada';
import { KpisJornada } from './HistoricoJornadas/KpisJornada';
import { TabelaJornadas } from './HistoricoJornadas/TabelaJornadas';

interface HistoricoJornadasProps {
  userRole?: string;
  isReadOnly?: boolean;
}

const ITENS_POR_PAGINA = 20;

export function HistoricoJornadas({ userRole = 'OPERADOR', isReadOnly = false }: HistoricoJornadasProps) {
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS DE FILTROS ---
  const [filtros, setFiltros] = useState<IFiltrosJornada>({
    dataInicio: '',
    dataFim: '',
    veiculoId: '',
    buscaMotorista: '',
    buscaPlaca: ''
  });

  // --- DADOS ---
  const {
    historico,
    loading,
    error,
    refetch,
    executeDelete,
    kmTotalGeral
  } = useHistoricoJornadas(filtros);

  // --- ESTADOS DA UI ---
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  const historicoVisivel = useMemo(() => {
    return historico.slice(0, visibleCount);
  }, [historico, visibleCount]);

  const handleCarregarMais = () => setVisibleCount(prev => prev + ITENS_POR_PAGINA);

  // --- EXPORTAÇÃO ---
  const handleExportar = () => {
    if (historico.length === 0) {
      toast.warning("Sem dados disponíveis para exportar.");
      return;
    }

    const dados = historico.map(j => {
      const kmAndados = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
      const imgInicio = getFotoUrl(j, 'inicio');
      const imgFim = getFotoUrl(j, 'fim');

      return {
        'Data/Hora Saída': DateHelper.getExcelDataHora(j.dataInicio),
        'Data/Hora Chegada': j.dataFim ? DateHelper.getExcelDataHora(j.dataFim) : 'Em andamento',
        'Placa': j.veiculo?.placa || 'Veículo Excluído',
        'Modelo': j.veiculo?.modelo || 'N/A',
        'Motorista': j.operador?.nome || 'Motorista Excluído',
        'KM Inicial': j.kmInicio,
        'KM Final': j.kmFim || 'Em Rota',
        'Distância (KM)': kmAndados > 0 ? kmAndados : 0,
        'Observações': j.observacoes || '-',
        'Foto KM Inicial': imgInicio ? `=HYPERLINK("${imgInicio}", "Acessar Foto")` : 'Sem foto',
        'Foto KM Final': imgFim ? `=HYPERLINK("${imgFim}", "Acessar Foto")` : 'Sem foto'
      };
    });

    toast.promise(Promise.resolve(exportarParaExcel(dados, "Relatorio_Viagens.xlsx")), {
      loading: 'Gerando folha de cálculo...',
      success: 'Relatório de Viagens exportado com sucesso!',
      error: 'Erro ao exportar Arquivo.'
    });
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!isReadOnly && (
        <PageHeader 
          title="Histórico de Viagens"
          subtitle="Consulte a quilometragem dos veículos, com provas fotográficas dos hodômetros dia a dia."
        />
      )}

      {!isReadOnly && (
        <FiltrosJornada
          filtros={filtros}
          setFiltros={setFiltros}
          veiculosOptions={veiculosOptions}
          onExportar={handleExportar}
          podeExportar={historico.length > 0}
        />
      )}

      {!isReadOnly && (
        <KpisJornada 
          kmTotalGeral={kmTotalGeral} 
          totalViagens={historico.length} 
        />
      )}

      {error ? (
        <EmptyState 
          title="Erro de Conexão" 
          description={error.message || "Não foi possível carregar o histórico de viagens."} 
          icon={AlertTriangle} 
        />
      ) : (
        <TabelaJornadas
          historicoVisivel={historicoVisivel}
          totalFiltrado={historico.length}
          loading={loading}
          canEdit={canEdit}
          canDelete={canDelete}
          onEditar={setEditingId}
          onExcluir={setDeletingId}
          onVisualizarFoto={setViewingPhoto}
          onCarregarMais={handleCarregarMais}
          itensPorPagina={ITENS_POR_PAGINA}
        />
      )}

      {/* MODAIS */}
      <Modal 
        isOpen={!!editingId} 
        onClose={() => setEditingId(null)} 
        title="Editar Registro de Viagem"
        className="max-w-2xl"
      >
        {editingId && (
          <FormEditarJornada
            jornadaId={editingId}
            onSuccess={() => {
              setEditingId(null);
              refetch();
            }}
            onCancelar={() => setEditingId(null)}
          />
        )}
      </Modal>

      <ConfirmModal 
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await executeDelete(deletingId);
            setDeletingId(null);
          }
        }}
        title="Excluir Histórico"
        description="Atenção: Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta viagem dos Registros globais da empresa?"
        variant="danger"
        confirmLabel="Sim, Excluir Viagem"
      />

      <Lightbox
        src={viewingPhoto}
        alt="Registro Fotográfico de Viagem"
        caption="Hodômetro - Use a pinça ou clique duplo para zoom"
        onClose={() => setViewingPhoto(null)}
      />
    </div>
  );
}
