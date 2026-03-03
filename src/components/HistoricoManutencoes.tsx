import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { 
  Calendar, Filter, Download, ChevronDown,
  CheckCircle2, AlertCircle, PlayCircle, FileText, FileX, DollarSign, Wrench, Store 
} from 'lucide-react';
import type { OrdemServico } from '../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { DatePicker } from './ui/DatePicker';
import { TableStyles } from '../styles/table';

// --- FORMS ---
import { FormEditarManutencao } from './forms/FormEditarManutencao';

interface HistoricoManutencoesProps {
  userRole: string;
  filtroInicial?: { veiculoId?: string; dataInicio?: string; };
}

const ITENS_POR_PAGINA = 20; // Vacina anti-travamento Mobile

export function HistoricoManutencoes({
  userRole,
  filtroInicial
}: HistoricoManutencoesProps) {
  
  // 📡 BUSCA INDEPENDENTE COM CACHE
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS DE DADOS ---
  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [fornecedores, setFornecedores] = useState<{id: string, nome: string}[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE RENDERIZAÇÃO PROGRESSIVA ---
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  
  // --- ESTADOS DE INTERAÇÃO ---
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- ESTADOS DE FILTRO (API) ---
  const [filtros, setFiltros] = useState({
    veiculoId: filtroInicial?.veiculoId || '',
    dataInicio: filtroInicial?.dataInicio || '',
    dataFim: ''
  });

  // --- ESTADO DE FILTRO LOCAL (FRONTEND) ---
  const [fornecedorIdFiltro, setFornecedorIdFiltro] = useState('');

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  // --- BUSCA DE FORNECEDORES PARA O SELECT DO BM ---
  useEffect(() => {
    api.get('/fornecedores')
       .then(res => setFornecedores(res.data))
       .catch(err => console.error("Erro ao carregar fornecedores", err));
  }, []);

  // --- FETCHING OTIMIZADO (SÓ VAI NA API QUANDO MUDA DATA OU VEÍCULO) ---
  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;
      
      const response = await api.get<OrdemServico[]>('/manutencoes/recentes', { params });
      setHistorico(response.data);
      setVisibleCount(ITENS_POR_PAGINA); // Reset da paginação visual
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar o histórico financeiro da oficina.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { 
    fetchHistorico(); 
  }, [fetchHistorico]);

  // ✨ FILTRO LOCAL INTELIGENTE (INSTANTÂNEO E BLINDADO NO TYPESCRIPT)
  const historicoFiltrado = useMemo(() => {
    return historico.filter(os => {
      if (!fornecedorIdFiltro) return true;
      return os.fornecedor?.id === fornecedorIdFiltro || os.fornecedorId === fornecedorIdFiltro;
    });
  }, [historico, fornecedorIdFiltro]);

  // --- CÁLCULOS MEMOIZADOS (BASEADOS NO FILTRO LOCAL) ---
  const totalGasto = useMemo(() => {
    return historicoFiltrado.reduce((acc, os) => acc + (Number(os.custoTotal) || 0), 0);
  }, [historicoFiltrado]);

  // Aplica a limitação visual de itens renderizados no DOM
  const historicoVisivel = useMemo(() => {
    return historicoFiltrado.slice(0, visibleCount);
  }, [historicoFiltrado, visibleCount]);

  const handleCarregarMais = () => setVisibleCount(prev => prev + ITENS_POR_PAGINA);

  // --- ACTIONS ---
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/manutencoes/${deletingId}`);
      setHistorico(prev => prev.filter(os => os.id !== deletingId));
      toast.success('Registo financeiro removido.');
    } catch (error) {
      toast.error('Ocorreu um erro ao remover o registo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportar = () => {
    if (historicoFiltrado.length === 0) {
      toast.warning("Sem dados disponíveis para exportar com estes filtros.");
      return;
    }
    const exportPromise = new Promise((resolve, reject) => {
        try {
            // ✨ MAPA DE DADOS ORGANIZADO PARA O EXCEL DO BM
            const dados = historicoFiltrado.map(os => ({
              'Data da OS': new Date(os.data).toLocaleDateString('pt-BR'),
              'Oficina / Fornecedor': os.fornecedor?.nome || 'Não Registada',
              'Placa do Veículo': os.veiculo?.placa || 'N/A',
              'Modelo': os.veiculo?.modelo || 'N/A',
              'Categoria de Serviço': os.tipo,
              'Itens e Serviços Realizados': (os.itens || []).map(i => `${i.quantidade}x ${i.produto.nome}`).join(' | '),
              'Valor Total (R$)': Number(os.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
              'Status Atual': os.status || 'CONCLUÍDA',
              // A Fórmula Mágica que cria um botão no Excel
              'Comprovante / Nota': os.fotoComprovanteUrl ? `=HYPERLINK("${os.fotoComprovanteUrl}", "Visualizar Comprovante")` : 'Sem anexo'
            }));

            // Nomeia o ficheiro com o nome da oficina se estiver filtrado
            let nomeFicheiro = "BM_Manutencoes_Globais.xlsx";
            if (fornecedorIdFiltro) {
                const nomeFornecedor = fornecedores.find(f => f.id === fornecedorIdFiltro)?.nome?.replace(/[^a-zA-Z0-9]/g, '_');
                nomeFicheiro = `BM_${nomeFornecedor}.xlsx`;
            }

            exportarParaExcel(dados, nomeFicheiro);
            resolve(true);
        } catch(err) {
            reject(err);
        }
    });

    toast.promise(exportPromise, {
      loading: 'A gerar folha de cálculo...',
      success: 'Boletim de Medição exportado com sucesso!',
      error: 'Erro a exportar ficheiro.'
    });
  };

  // --- HELPERS VISUAIS (DESIGN SYSTEM) ---
  const getBadgeTipo = (tipo: string) => {
    const map: Record<string, "warning" | "info" | "success" | "neutral"> = {
      'CORRETIVA': 'warning',
      'PREVENTIVA': 'info',
      'LAVAGEM': 'success'
    };
    return <Badge variant={map[tipo] || 'neutral'}>{tipo}</Badge>;
  };

  const getBadgeStatus = (status?: string) => {
    const s = status?.toUpperCase() || 'CONCLUIDA';
    
    switch (s) {
      case 'AGENDADA': return <Badge variant="neutral" className="gap-1.5 py-1 px-2.5 shadow-sm"><Calendar className="w-3.5 h-3.5 opacity-70"/> Agendada</Badge>;
      case 'EM_ANDAMENTO': return <Badge variant="warning" className="gap-1.5 py-1 px-2.5 shadow-sm"><PlayCircle className="w-3.5 h-3.5 opacity-70"/> Na Oficina</Badge>;
      case 'CONCLUIDA':
      case 'CONCLUÍDA': return <Badge variant="success" className="gap-1.5 py-1 px-2.5 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 opacity-70"/> Concluída</Badge>;
      case 'CANCELADA': return <Badge variant="danger" className="gap-1.5 py-1 px-2.5 shadow-sm"><AlertCircle className="w-3.5 h-3.5 opacity-70"/> Cancelada</Badge>;
      default: return <Badge variant="neutral">{s}</Badge>;
    }
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os Veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  const fornecedoresOptions = useMemo(() => [
    { value: "", label: "Todas as Oficinas / Postos" },
    ...fornecedores.map(f => ({ value: f.id, label: f.nome }))
  ], [fornecedores]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HEADER & FILTROS */}
      <PageHeader 
        title="Boletim de Manutenções"
        subtitle="Controle de manutenções KLIN. Filtre por oficina para gerar o Boletim de Medição (BM)."
        extraAction={
          <div className="flex flex-col xl:flex-row gap-3 w-full xl:w-auto items-end bg-surface p-2 rounded-2xl border border-border/60 shadow-sm">
            <div className="flex gap-3 w-full">
              <div className="flex-1">
                <DatePicker
                  label="Data Inicial"
                  placeholder="Início"
                  date={filtros.dataInicio ? new Date(`${filtros.dataInicio}T12:00:00`) : undefined}
                  onChange={date => setFiltros(prev => ({ ...prev, dataInicio: date ? date.toISOString().split('T')[0] : '' }))}
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  label="Data Final"
                  placeholder="Fim"
                  date={filtros.dataFim ? new Date(`${filtros.dataFim}T12:00:00`) : undefined}
                  onChange={date => setFiltros(prev => ({ ...prev, dataFim: date ? date.toISOString().split('T')[0] : '' }))}
                />
              </div>
            </div>
            
            <div className="w-px h-10 bg-border/60 hidden xl:block mx-1"></div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="w-full sm:w-48">
                <Select 
                  label="Filtrar Veículo" 
                  options={veiculosOptions} 
                  value={filtros.veiculoId}
                  onChange={e => setFiltros(prev => ({ ...prev, veiculoId: e.target.value }))}
                  icon={<Filter className="w-4 h-4"/>}
                  containerClassName="!mb-0"
                />
              </div>

              {/* ✨ NOVO FILTRO DE OFICINA PARA O BM (FRONTEND) */}
              <div className="w-full sm:w-56">
                <Select 
                  label="Oficina / Fornecedor" 
                  options={fornecedoresOptions}
                  value={fornecedorIdFiltro}
                  onChange={e => setFornecedorIdFiltro(e.target.value)}
                  icon={<Store className="w-4 h-4"/>}
                  containerClassName="!mb-0"
                />
              </div>
            </div>

            <div className="w-full xl:w-auto flex items-end pb-0.5 mt-2 xl:mt-0 xl:ml-auto">
              <Button 
                variant="secondary" 
                onClick={handleExportar} 
                icon={<Download className="w-4 h-4" />}
                disabled={historicoFiltrado.length === 0}
                className="w-full xl:w-auto h-11 sm:h-12 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border-sky-500/20"
              >
                Gerar BM (Excel)
              </Button>
            </div>
          </div>
        }
      />

      {/* 2. SUMÁRIO DA CONSULTA (KPIs Premium) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Subtotal do Período/Oficina
          </span>
          <span className="text-3xl font-mono font-black text-text-main truncate group-hover:text-primary transition-colors">
            {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </Card>
        
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ordens de Serviço (Fichas)
          </span>
          <span className="text-3xl font-mono font-black text-text-main truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {historicoFiltrado.length} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">Fichas</small>
          </span>
        </Card>
      </div>

      {/* 3. TABELA (CARD) */}
      <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
        {loading ? (
          <div className="p-6 sm:p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ListaResponsiva
              itens={historicoVisivel}
              emptyMessage="Nenhum registo encontrado com estes filtros."

              // --- DESKTOP ---
              desktopHeader={
                <>
                  <th className={`${TableStyles.th} pl-8 py-5`}>Data da OS</th>
                  <th className={TableStyles.th}>Informação Técnica</th>
                  <th className={TableStyles.th}>Status Geral</th>
                  <th className={TableStyles.th}>Custo Financeiro</th>
                  <th className={`${TableStyles.th} text-center`}>Ticket Manutenção</th>
                  <th className={`${TableStyles.th} text-right pr-8`}>Gestão</th>
                </>
              }
              renderDesktop={(os) => (
                <>
                  <td className={`${TableStyles.td} pl-8`}>
                    <div className="flex flex-col gap-2 items-start">
                      <span className="font-bold text-text-main flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-muted/60" />
                        {new Date(os.data).toLocaleDateString('pt-BR')}
                      </span>
                      {getBadgeTipo(os.tipo)}
                    </div>
                  </td>
                  <td className={TableStyles.td}>
                    <div className="flex flex-col gap-1 max-w-[280px]">
                      <div className="flex items-center gap-2">
                         <span className="font-mono font-black text-primary text-base tracking-tight">{os.veiculo?.placa || 'N/D'}</span>
                         <span className="text-[10px] bg-surface-hover px-1.5 py-0.5 rounded border border-border/60 font-bold uppercase tracking-widest text-text-secondary">{os.veiculo?.modelo}</span>
                      </div>
                      <span className="text-xs text-text-secondary font-medium mt-1 truncate" title={os.fornecedor?.nome}>{os.fornecedor?.nome || 'Oficina Não Registada'}</span>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1.5 leading-snug line-clamp-2" title={(os.itens || []).map(i => i.produto.nome).join(', ')}>
                        {(os.itens || []).map(i => i.produto.nome).join(', ')}
                      </p>
                    </div>
                  </td>
                  <td className={TableStyles.td}>
                    {getBadgeStatus(os.status)}
                  </td>
                  <td className={TableStyles.td}>
                    <span className="font-mono font-black text-text-main text-base">
                      {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </td>
                  
                  <td className={`${TableStyles.td} text-center`}>
                    {os.fotoComprovanteUrl ? (
                      <button
                        onClick={() => window.open(os.fotoComprovanteUrl || '', '_blank')}
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-all shadow-sm border border-sky-500/20 group"
                        title="Visualizar Nota de Serviço"
                      >
                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center justify-center p-2 rounded-xl bg-surface-hover text-text-muted/40 border border-border/50" title="Sem comprovativo físico">
                        <FileX className="w-5 h-5" />
                      </span>
                    )}
                  </td>

                  <td className={`${TableStyles.td} text-right pr-8`}>
                    <DropdownAcoes 
                      onEditar={canEdit ? () => setEditingOS(os) : undefined}
                      onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
                    />
                  </td>
                </>
              )}

              // --- MOBILE ---
              renderMobile={(os) => (
                <div className="p-5 flex flex-col gap-4 border-b border-border/60 hover:bg-surface-hover/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* Data Box Premium */}
                      <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                        <span className="text-lg font-black leading-none">{new Date(os.data).getDate()}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-0.5">
                          {new Date(os.data).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </span>
                      </div>
                      
                      {/* Infos Rápidas */}
                      <div className="flex flex-col justify-center">
                        <span className="font-mono font-black text-primary text-lg tracking-tight leading-none block mb-1">{os.veiculo?.placa || 'Sem Placa'}</span>
                        <span className="text-xs text-text-secondary font-medium">{os.fornecedor?.nome || 'Oficina não registada'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       {getBadgeStatus(os.status)}
                       <DropdownAcoes 
                         onEditar={canEdit ? () => setEditingOS(os) : undefined}
                         onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
                       />
                    </div>
                  </div>

                  {/* Informação Operacional e Custos */}
                  <div className="flex justify-between items-center bg-surface-hover/50 p-3 rounded-xl border border-border/40">
                    <div className="flex flex-col gap-1.5 items-start">
                       <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">Serviço</span>
                       {getBadgeTipo(os.tipo)}
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Custo da OS</span>
                       <span className="font-mono font-black text-text-main text-lg tracking-tighter">
                         {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </span>
                    </div>
                  </div>

                  {/* Comprovativo */}
                  {os.fotoComprovanteUrl && (
                    <Button 
                      variant="secondary" 
                      className="w-full text-xs font-bold h-11 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20 shadow-sm transition-all" 
                      icon={<FileText className="w-4 h-4"/>}
                      onClick={() => window.open(os.fotoComprovanteUrl || '', '_blank')}
                    >
                      Aceder a Comprovativo Físico
                    </Button>
                  )}
                </div>
              )}
            />

            {/* BOTÃO CARREGAR MAIS (PAGINAÇÃO PROGRESSIVA MOBILE/DESKTOP) */}
            {historicoVisivel.length < historicoFiltrado.length && (
               <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
                  <Button 
                    variant="secondary" 
                    onClick={handleCarregarMais}
                    className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group"
                  >
                     Ver mais {Math.min(ITENS_POR_PAGINA, historicoFiltrado.length - historicoVisivel.length)} Fichas
                     <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
                  </Button>
               </div>
            )}

          </div>
        )}
      </Card>

      {/* --- MODAIS --- */}
      
      {/* Edição */}
      <Modal 
        isOpen={!!editingOS} 
        onClose={() => setEditingOS(null)}
        title="Gestão de Manutenção"
        className="max-w-3xl"
      >
        {editingOS && (
          <FormEditarManutencao
            osParaEditar={editingOS}
            onSuccess={() => { setEditingOS(null); fetchHistorico(); }}
            onClose={() => setEditingOS(null)}
          />
        )}
      </Modal>

      {/* Exclusão */}
      <ConfirmModal 
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registo de Oficina"
        description="Esta ação é permanente. Ao apagar, o relatório financeiro e o histórico de manutenções do veículo serão alterados."
        variant="danger"
        confirmLabel="Sim, Apagar Registo"
      />

    </div>
  );
}