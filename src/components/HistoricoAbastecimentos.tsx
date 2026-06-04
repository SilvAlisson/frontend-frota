import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { DateHelper } from '../lib/dateHelper';

// --- HOOKS E ABSTRAÇÕES ---
import { useVeiculos } from '../hooks/useVeiculos';
import { useHistoricoAbastecimentos } from '../hooks/useHistoricoAbastecimentos';

// --- UI COMPONENTS ---
import { PageHeader } from './ui/PageHeader';
import { PullToRefresh } from './ui/PullToRefresh';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { Lightbox } from './ui/Lightbox';

// --- FORMS ---
import { FormEditarAbastecimento } from './forms/FormEditarAbastecimento';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';

// --- SUB-COMPONENTES ABSTRAÍDOS ---
import { FiltrosAbastecimento } from './HistoricoAbastecimentos/FiltrosAbastecimento';
import { KpisAbastecimento } from './HistoricoAbastecimentos/KpisAbastecimento';
import { TabelaAbastecimentos } from './HistoricoAbastecimentos/TabelaAbastecimentos';

interface HistoricoAbastecimentosProps {
  userRole: string;
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

const ITENS_POR_PAGINA = 20;

export function HistoricoAbastecimentos({ userRole, filtroInicial }: HistoricoAbastecimentosProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS DE FILTROS ---
  const [filtros, setFiltros] = useState({
    dataInicio: filtroInicial?.dataInicio || '',
    dataFim: '',
    veiculoId: filtroInicial?.veiculoId || '',
    fornecedorId: '',
    tipoProduto: searchParams.get('tipoProduto') || ''
  });

  const hasFiltrosAtivos = Boolean(
    filtros.dataInicio || filtros.dataFim || 
    filtros.veiculoId || filtros.fornecedorId || 
    filtros.tipoProduto
  );

  useEffect(() => {
    if (filtros.tipoProduto) {
      searchParams.set('tipoProduto', filtros.tipoProduto);
    } else {
      searchParams.delete('tipoProduto');
    }
    setSearchParams(searchParams);
  }, [filtros.tipoProduto, searchParams, setSearchParams]);

  useEffect(() => {
    if (filtroInicial?.veiculoId) setFiltros(prev => ({ ...prev, veiculoId: filtroInicial.veiculoId! }));
  }, [filtroInicial]);

  // --- DADOS (Hook customizado substitui 150 linhas) ---
  const { 
    historicoFiltrado, 
    fornecedores, 
    estatisticas, 
    loading, 
    refetch, 
    handleDelete 
  } = useHistoricoAbastecimentos(filtros);

  // --- ESTADOS DA UI ---
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docParaVisualizar, setDocParaVisualizar] = useState<{ url: string, titulo: string } | null>(null);
  const [isNovoAbastecimentoOpen, setIsNovoAbastecimentoOpen] = useState(false);

  const historicoVisivel = useMemo(() => {
    return historicoFiltrado.slice(0, visibleCount);
  }, [historicoFiltrado, visibleCount]);

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os Veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  const fornecedoresOptions = useMemo(() => [
    { value: "", label: "Todos os Postos / Oficinas" },
    ...fornecedores.map(f => ({ value: f.id, label: f.nome }))
  ], [fornecedores]);

  // --- HANDLERS ---
  const handleCarregarMais = () => setVisibleCount(prev => prev + ITENS_POR_PAGINA);

  const handleLimparFiltros = () => {
    setFiltros({ dataInicio: '', dataFim: '', veiculoId: '', fornecedorId: '', tipoProduto: '' });
  };

  const handleExportar = () => {
    if (historicoFiltrado.length === 0) {
      toast.warning("Nenhum dado para exportar.");
      return;
    }

    const dadosFormatados = historicoFiltrado.map(ab => {
      const itensSafe = ab.itens || [];
      const itensFormatados = itensSafe.map(item =>
        `${item.quantidade}${item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'} ${item.produto.nome}`
      ).join(' | ');

      return {
        'Data do Abastecimento': DateHelper.getExcel(ab.dataHora),
        'Posto / Fornecedor': ab.fornecedor?.nome || 'Não Registrado',
        'Placa do Veículo': ab.veiculo?.placa || 'N/A',
        'Produtos / Combustível': itensFormatados,
        'KM Registrado': ab.kmOdometro,
        'Motorista / Operador': ab.operador?.nome || 'N/A',
        'Valor Total (R$)': Number(ab.custoTotal),
        'Nota Fiscal': ab.fotoNotaFiscalUrl ? `=HYPERLINK("${ab.fotoNotaFiscalUrl}", "Acessar Comprovante")` : 'Sem anexo'
      };
    });

    let nomeArquivo = "BM_Abastecimentos_Globais.xlsx";
    if (filtros.fornecedorId) {
      const nomeFornecedor = fornecedores.find(f => f.id === filtros.fornecedorId)?.nome?.replace(/[^a-zA-Z0-9]/g, '_');
      nomeArquivo = `BM_${nomeFornecedor}.xlsx`;
    }

    toast.promise(Promise.resolve(exportarParaExcel(dadosFormatados, nomeArquivo)), {
      loading: 'A preparar exportação...',
      success: 'Boletim de Medição exportado com sucesso!',
      error: 'Erro na exportação.'
    });
  };

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader 
          title="Boletim de Abastecimentos"
          subtitle="Filtre por Posto para gerar o Boletim de Medição (BM) com os comprovantes integrados."
          actionLabel={canEdit ? "Novo Abastecimento" : undefined}
          onAction={canEdit ? () => setIsNovoAbastecimentoOpen(true) : undefined}
        />

        <FiltrosAbastecimento
          filtros={filtros}
          setFiltros={setFiltros}
          veiculosOptions={veiculosOptions}
          fornecedoresOptions={fornecedoresOptions}
          hasFiltrosAtivos={hasFiltrosAtivos}
          onLimparFiltros={handleLimparFiltros}
          onExportar={handleExportar}
          podeExportar={historicoFiltrado.length > 0}
        />

        <KpisAbastecimento estatisticas={estatisticas} />

        <TabelaAbastecimentos
          historicoVisivel={historicoVisivel}
          totalFiltrado={historicoFiltrado.length}
          loading={loading}
          canEdit={canEdit}
          userRole={userRole}
          onEditar={setEditingId}
          onExcluir={setDeletingId}
          onVisualizarDoc={(url, titulo) => setDocParaVisualizar({ url, titulo })}
          onCarregarMais={handleCarregarMais}
          itensPorPagina={ITENS_POR_PAGINA}
        />

        {/* MODAIS */}
        <Modal 
          isOpen={isNovoAbastecimentoOpen} 
          onClose={() => setIsNovoAbastecimentoOpen(false)}
          title="Novo Abastecimento"
          className="max-w-2xl"
        >
          {isNovoAbastecimentoOpen && (
            <FormRegistrarAbastecimento
              usuarioLogado={user || undefined}
              onSuccess={() => {
                setIsNovoAbastecimentoOpen(false);
                refetch();
              }}
              onCancelar={() => setIsNovoAbastecimentoOpen(false)}
            />
          )}
        </Modal>

        <Modal 
          isOpen={!!editingId} 
          onClose={() => setEditingId(null)}
          title="Editar Abastecimento"
          className="max-w-2xl"
        >
          {editingId && (
            <FormEditarAbastecimento
              abastecimentoId={editingId}
              onSuccess={() => {
                setEditingId(null);
                refetch();
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </Modal>

        <ConfirmModal 
          isOpen={!!deletingId}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            if (deletingId) {
              await handleDelete(deletingId);
              setDeletingId(null);
            }
          }}
          title="Excluir Abastecimento"
          description="Tem certeza que deseja remover este Registro de forma permanente? O cálculo de média de consumo da frota será recalculado."
          confirmLabel="Sim, Excluir Registro"
          variant="danger"
        />

        <Lightbox
          src={docParaVisualizar?.url}
          alt={docParaVisualizar?.titulo || "Documento da KLIN"}
          onClose={() => setDocParaVisualizar(null)}
        />
      </div>
    </PullToRefresh>
  );
}