import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { 
  Calendar, Filter, Download,
  CheckCircle2, AlertCircle, PlayCircle, FileText, FileX, DollarSign, Wrench 
} from 'lucide-react';
import type { OrdemServico } from '../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { TableStyles } from '../styles/table';

// --- FORMS ---
import { FormEditarManutencao } from './forms/FormEditarManutencao';

// ✂️ Propriedades enxutas: sem arrays globais passados por prop!
interface HistoricoManutencoesProps {
  userRole: string;
  filtroInicial?: { veiculoId?: string; dataInicio?: string; };
}

export function HistoricoManutencoes({
  userRole,
  filtroInicial
}: HistoricoManutencoesProps) {
  
  // 📡 BUSCA INDEPENDENTE COM CACHE
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS ---
  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({
    veiculoId: filtroInicial?.veiculoId || '',
    dataInicio: filtroInicial?.dataInicio || '',
    dataFim: ''
  });

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  // --- FETCHING OTIMIZADO ---
  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;

      const response = await api.get<OrdemServico[]>('/manutencoes/recentes', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { 
    fetchHistorico(); 
  }, [fetchHistorico]);

  // --- CÁLCULOS MEMOIZADOS (SUMÁRIO) ---
  const totalGasto = useMemo(() => {
    return historico.reduce((acc, os) => acc + (Number(os.custoTotal) || 0), 0);
  }, [historico]);

  // --- ACTIONS ---
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/manutencoes/${deletingId}`);
      setHistorico(prev => prev.filter(os => os.id !== deletingId));
      toast.success('Registro removido.');
    } catch (error) {
      toast.error('Erro ao remover registro.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportar = () => {
    if (historico.length === 0) {
      toast.warning("Sem dados para exportar.");
      return;
    }
    const dados = historico.map(os => ({
      'Data': new Date(os.data).toLocaleDateString('pt-BR'),
      'Placa': os.veiculo?.placa || 'N/A',
      'Tipo': os.tipo,
      'Status': os.status || 'CONCLUÍDA',
      'Fornecedor': os.fornecedor?.nome || 'N/A',
      'Itens': (os.itens || []).map(i => `${i.produto.nome} (${i.quantidade})`).join(', '),
      'Valor Total': Number(os.custoTotal).toFixed(2).replace('.', ','),
      'Link Comprovante': os.fotoComprovanteUrl || 'Sem comprovante'
    }));
    exportarParaExcel(dados, "Historico_Manutencoes.xlsx");
  };

  // --- HELPERS VISUAIS ---
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
      case 'AGENDADA':
        return <Badge variant="neutral" className="gap-1"><Calendar className="w-3 h-3"/> Agendada</Badge>;
      case 'EM_ANDAMENTO':
        return <Badge variant="warning" className="gap-1"><PlayCircle className="w-3 h-3"/> Em Andamento</Badge>;
      case 'CONCLUIDA':
      case 'CONCLUÍDA':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3"/> Concluída</Badge>;
      case 'CANCELADA':
        return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3"/> Cancelada</Badge>;
      default:
        return <Badge variant="neutral">{s}</Badge>;
    }
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HEADER & FILTROS */}
      <PageHeader 
        title="Histórico de Manutenções"
        subtitle="Gerencie preventivas, corretivas e custos de oficina."
        extraAction={
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-end">
            <div className="w-full sm:w-32">
              <Input 
                type="date" 
                label="Início" 
                value={filtros.dataInicio} 
                onChange={e => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div className="w-full sm:w-32">
              <Input 
                type="date" 
                label="Fim" 
                value={filtros.dataFim} 
                onChange={e => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select 
                label="Veículo" 
                options={veiculosOptions} 
                value={filtros.veiculoId}
                onChange={e => setFiltros(prev => ({ ...prev, veiculoId: e.target.value }))}
                icon={<Filter className="w-4 h-4"/>}
              />
            </div>
            <div className="pb-0.5 w-full sm:w-auto flex items-end">
              <Button 
                variant="secondary" 
                onClick={handleExportar} 
                icon={<Download className="w-4 h-4" />}
                disabled={historico.length === 0}
                className="w-full sm:w-auto h-9"
              >
                Exportar
              </Button>
            </div>
          </div>
        }
      />

      {/* 2. SUMÁRIO DA CONSULTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-red-50 border-red-100 flex flex-col justify-center gap-1">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Custo Total de Manutenção
          </span>
          <span className="text-2xl font-mono font-black text-red-700 truncate">
            {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </Card>
        
        <Card padding="sm" className="bg-surface border-border flex flex-col justify-center gap-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Ordens de Serviço (OS)
          </span>
          <span className="text-2xl font-mono font-black text-text-main truncate">
            {historico.length} <small className="text-sm font-medium opacity-70">registros</small>
          </span>
        </Card>
      </div>

      {/* 3. TABELA */}
      <Card padding="none" className="overflow-hidden border-border/50 shadow-sm">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <ListaResponsiva
            itens={historico}
            emptyMessage="Nenhuma manutenção encontrada."

            // --- DESKTOP ---
            desktopHeader={
              <>
                <th className={TableStyles.th}>Data / Tipo</th>
                <th className={TableStyles.th}>Status</th>
                <th className={TableStyles.th}>Veículo</th>
                <th className={TableStyles.th}>Fornecedor / Serviços</th>
                <th className={TableStyles.th}>Custo Total</th>
                <th className={`${TableStyles.th} text-center`}>Prova</th>
                <th className={`${TableStyles.th} text-right`}>Ações</th>
              </>
            }
            renderDesktop={(os) => (
              <>
                <td className={TableStyles.td}>
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(os.data).toLocaleDateString('pt-BR')}
                    </span>
                    {getBadgeTipo(os.tipo)}
                  </div>
                </td>
                <td className={TableStyles.td}>
                  {getBadgeStatus(os.status)}
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-primary text-sm">{os.veiculo?.placa || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{os.veiculo?.modelo}</span>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col max-w-[300px]">
                    <span className="font-medium text-gray-900 text-sm">{os.fornecedor?.nome || 'Fornecedor N/A'}</span>
                    <p className="text-xs text-gray-500 truncate mt-0.5" title={(os.itens || []).map(i => i.produto.nome).join(', ')}>
                      {(os.itens || []).map(i => i.produto.nome).join(', ')}
                    </p>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </td>
                
                <td className={`${TableStyles.td} text-center`}>
                  {os.fotoComprovanteUrl ? (
                    <button
                      onClick={() => window.open(os.fotoComprovanteUrl || '', '_blank')}
                      className="inline-flex items-center justify-center p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all"
                      title="Ver Nota Fiscal / Comprovante"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center justify-center p-2 rounded-full bg-gray-50 text-gray-300" title="Sem comprovante anexado">
                      <FileX className="w-5 h-5" />
                    </span>
                  )}
                </td>

                <td className={`${TableStyles.td} text-right`}>
                  <DropdownAcoes 
                    onEditar={canEdit ? () => setEditingOS(os) : undefined}
                    onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
                  />
                </td>
              </>
            )}

            // --- MOBILE ---
            renderMobile={(os) => (
              <div className="p-4 space-y-3 border-b border-border hover:bg-surface-hover/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="bg-surface-hover p-2 rounded-lg border border-border flex flex-col items-center justify-center w-12 h-12 shrink-0">
                      <span className="text-sm font-bold text-text-main">{new Date(os.data).getDate()}</span>
                      <span className="text-[9px] font-bold uppercase text-text-muted">
                        {new Date(os.data).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-text-main block">{os.veiculo?.placa || 'N/A'}</span>
                      <span className="text-xs text-text-secondary">{os.fornecedor?.nome}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getBadgeStatus(os.status)}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-dashed border-border pt-3">
                  {getBadgeTipo(os.tipo)}
                  <span className="font-mono font-bold text-text-main">
                    {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                   {os.fotoComprovanteUrl ? (
                    <Button 
                      variant="secondary" 
                      className="flex-1 text-xs h-9 text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100" 
                      icon={<FileText className="w-3 h-3"/>}
                      onClick={() => window.open(os.fotoComprovanteUrl || '', '_blank')}
                    >
                      Ver Nota
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="flex-1 text-xs h-9 text-gray-400 bg-gray-50 cursor-not-allowed border border-gray-100" 
                      icon={<FileX className="w-3 h-3"/>}
                      disabled
                    >
                      Sem Nota
                    </Button>
                  )}
                  <div className="flex-1 flex justify-end">
                    <DropdownAcoes 
                        onEditar={canEdit ? () => setEditingOS(os) : undefined}
                        onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
                    />
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </Card>

      {/* 4. MODAIS */}
      
      {/* Edição */}
      <Modal 
        isOpen={!!editingOS} 
        onClose={() => setEditingOS(null)}
        title="Editar Manutenção"
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
        title="Excluir Manutenção"
        description="Tem certeza? Isso removerá o registro financeiro e o histórico do veículo."
        variant="danger"
        confirmLabel="Sim, excluir"
      />

    </div>
  );
}