import { useState, useMemo } from 'react';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { DateHelper } from '../lib/dateHelper';
import type { OrdemServico } from '../types';

// --- HOOKS E ABSTRAÇÕES ---
import { useVeiculos } from '../hooks/useVeiculos';
import { useHistoricoManutencoes, type FiltrosManutencao as IFiltrosManutencao } from '../hooks/useHistoricoManutencoes';
import { useModalStore } from '../hooks/useModalStore';

// --- UI COMPONENTS ---
import { PageHeader } from './ui/PageHeader';
import { Modal } from './ui/Modal';
import { SmartFAB } from './ui/SmartFAB';
import { PullToRefresh } from './ui/PullToRefresh';
import { EmptyState } from './ui/EmptyState';
import { AlertTriangle } from 'lucide-react';

// --- FORMS ---
import { FormEditarManutencao } from './forms/FormEditarManutencao';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';

// --- SUB-COMPONENTES ABSTRAÍDOS ---
import { FiltrosManutencao } from './HistoricoManutencoes/FiltrosManutencao';
import { KpisManutencao } from './HistoricoManutencoes/KpisManutencao';
import { TabelaManutencoes, extrairPlaca } from './HistoricoManutencoes/TabelaManutencoes';

interface HistoricoManutencoesProps {
  userRole: string;
  filtroInicial?: { veiculoId?: string; dataInicio?: string; };
}

const ITENS_POR_PAGINA = 20;

export function HistoricoManutencoes({ userRole, filtroInicial }: HistoricoManutencoesProps) {
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS DE FILTROS ---
  const [filtros, setFiltros] = useState<IFiltrosManutencao>({
    veiculoId: filtroInicial?.veiculoId || '',
    dataInicio: filtroInicial?.dataInicio || '',
    dataFim: '',
    fornecedorId: ''
  });

  const hasFiltrosAtivos = Boolean(filtros.dataInicio || filtros.dataFim || filtros.veiculoId || filtros.fornecedorId);

  // --- DADOS ---
  const { 
    historicoFiltrado, 
    fornecedores, 
    estatisticas, 
    loading,
    error, 
    refetch, 
    handleDelete 
  } = useHistoricoManutencoes(filtros);

  const { openModal } = useModalStore();

  // --- ESTADOS DA UI ---
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [isNovaOSOpen, setIsNovaOSOpen] = useState(false);

  const canEdit = ['ADMIN', 'ENCARREGADO', 'COORDENADOR'].includes(userRole);
  const canDelete = ['ADMIN', 'COORDENADOR'].includes(userRole);

  const historicoVisivel = useMemo(() => {
    return historicoFiltrado.slice(0, visibleCount);
  }, [historicoFiltrado, visibleCount]);

  const handleCarregarMais = () => setVisibleCount(prev => prev + ITENS_POR_PAGINA);

  // --- EXPORTAÇÃO ---
  const handleExportar = () => {
    if (historicoFiltrado.length === 0) {
      toast.warning("Sem dados disponíveis para exportar com estes filtros.");
      return;
    }
    
    const dados = historicoFiltrado.map(os => ({
      'Data da OS': DateHelper.getExcel(os.data),
      'Oficina / Fornecedor': os.fornecedor?.nome || 'Não Registrada',
      'Placa do Veículo': extrairPlaca(os.veiculo?.placa || ''),
      'Categoria de Serviço': os.tipo,
      'Serviços Realizados': (os.itens || []).map(i => `${i.quantidade}x ${i.produto?.nome || 'Serviço'}`).join(' | '),
      'Valor Total (R$)': Number(os.custoTotal),
      'Comprovante': os.fotoComprovanteUrl ? `=HYPERLINK("${os.fotoComprovanteUrl}", "Visualizar Comprovante")` : 'Sem anexo'
    }));

    let nomeArquivo = "BM_Manutencoes_Globais.xlsx";
    if (filtros.fornecedorId) {
      const nomeFornecedor = fornecedores.find(f => f.id === filtros.fornecedorId)?.nome?.replace(/[^a-zA-Z0-9]/g, '_');
      nomeArquivo = `BM_${nomeFornecedor}.xlsx`;
    }

    toast.promise(Promise.resolve(exportarParaExcel(dados, nomeArquivo)), {
      loading: 'Gerando folha de cálculo...',
      success: 'Boletim de Medição exportado com sucesso!',
      error: 'Erro a exportar Arquivo.'
    });
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os Veículos" },
    ...veiculos.map(v => ({ value: v.id, label: `${extrairPlaca(v.placa)} - ${v.modelo}` }))
  ], [veiculos]);

  const fornecedoresOptions = useMemo(() => [
    { value: "", label: "Todas as Oficinas / Postos" },
    ...fornecedores.map(f => ({ value: f.id, label: f.nome }))
  ], [fornecedores]);

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Boletim de Manutenções"
          subtitle="Controle de manutenções KLIN. Filtre por oficina para gerar o Boletim de Medição (BM)."
          actionLabel={canEdit ? "Nova Manutenção" : undefined}
          onAction={canEdit ? () => setIsNovaOSOpen(true) : undefined}
        />

        <FiltrosManutencao
          filtros={filtros}
          setFiltros={setFiltros}
          veiculosOptions={veiculosOptions}
          fornecedoresOptions={fornecedoresOptions}
          hasFiltrosAtivos={hasFiltrosAtivos}
          onLimparFiltros={() => setFiltros({ veiculoId: '', dataInicio: '', dataFim: '', fornecedorId: '' })}
          onExportar={handleExportar}
          podeExportar={historicoFiltrado.length > 0}
        />

        <KpisManutencao estatisticas={estatisticas} />

        {error ? (
          <EmptyState 
            title="Erro de Conexão" 
            description={error.message || "Não foi possível carregar o histórico de manutenções."} 
            icon={AlertTriangle} 
          />
        ) : (
          <TabelaManutencoes
            historicoVisivel={historicoVisivel}
            totalFiltrado={historicoFiltrado.length}
            loading={loading}
            canEdit={canEdit}
            canDelete={canDelete}
            onEditar={setEditingOS}
            onExcluir={(id) => {
              openModal('CONFIRM', {
                title: "Eliminar Registro de Oficina",
                description: "Esta ação é permanente. Ao apagar, o relatório financeiro e o histórico de manutenções do veículo serão alterados.",
                variant: "danger",
                confirmLabel: "Sim, Apagar Registro",
                onConfirm: async () => await handleDelete(id)
              });
            }}
            onVisualizarDoc={(url, titulo) => {
              openModal('LIGHTBOX', {
                src: url,
                alt: titulo
              });
            }}
            onCarregarMais={handleCarregarMais}
            itensPorPagina={ITENS_POR_PAGINA}
          />
        )}

        {/* MODAIS */}
        <Modal
          isOpen={isNovaOSOpen}
          onClose={() => setIsNovaOSOpen(false)}
          title="Nova Manutenção"
          className="max-w-3xl"
        >
          {isNovaOSOpen && (
            <FormRegistrarManutencao
              onSuccess={() => { setIsNovaOSOpen(false); refetch(); }}
              onClose={() => setIsNovaOSOpen(false)}
            />
          )}
        </Modal>

        <Modal
          isOpen={!!editingOS}
          onClose={() => setEditingOS(null)}
          title="Gestão de Manutenção"
          className="max-w-3xl"
        >
          {editingOS && (
            <FormEditarManutencao
              osParaEditar={editingOS as unknown as React.ComponentProps<typeof FormEditarManutencao>['osParaEditar']}
              onSuccess={() => { setEditingOS(null); refetch(); }}
              onClose={() => setEditingOS(null)}
            />
          )}
        </Modal>

        {canEdit && (
          <SmartFAB 
            onClick={() => setIsNovaOSOpen(true)} 
            label="Nova Manutenção" 
          />
        )}
      </div>
    </PullToRefresh>
  );
}