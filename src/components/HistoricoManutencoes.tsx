import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { 
  Calendar, Filter, Download, ExternalLink, 
  CheckCircle2, AlertCircle, PlayCircle, FileText 
} from 'lucide-react';
import type { OrdemServico, Veiculo, Produto, Fornecedor } from '../types';

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

interface HistoricoManutencoesProps {
  userRole: string;
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  filtroInicial?: { veiculoId?: string; dataInicio?: string; };
}

export function HistoricoManutencoes({
  userRole,
  veiculos,
  produtos,
  fornecedores,
  filtroInicial
}: HistoricoManutencoesProps) {
  
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

  // --- FETCHING ---
  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;

      const response = await api.get<OrdemServico[]>('/ordens-servico/recentes', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { fetchHistorico(); }, [fetchHistorico]);

  // --- ACTIONS ---
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/ordens-servico/${deletingId}`);
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
      'Valor Total': Number(os.custoTotal).toFixed(2).replace('.', ',')
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

  const veiculosOptions = [
    { value: "", label: "Todos os veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ];

  return (
    <div className="space-y-6 pb-10">
      
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
            <div className="pb-0.5">
              <Button 
                variant="secondary" 
                onClick={handleExportar} 
                icon={<Download className="w-4 h-4" />}
                disabled={historico.length === 0}
              >
                Excel
              </Button>
            </div>
          </div>
        }
      />

      {/* 2. TABELA */}
      <Card noPadding>
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
                <td className={`${TableStyles.td} text-right`}>
                  <DropdownAcoes 
                    onEditar={canEdit ? () => setEditingOS(os) : undefined}
                    onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
                    customActions={os.fotoComprovanteUrl ? [{
                      label: "Ver Nota Fiscal",
                      icon: <ExternalLink className="w-4 h-4"/>,
                      onClick: () => window.open(os.fotoComprovanteUrl || '', '_blank')
                    }] : []}
                  />
                </td>
              </>
            )}

            // --- MOBILE ---
            renderMobile={(os) => (
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    {/* Ícone Data */}
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center justify-center w-12 h-12 shrink-0">
                      <span className="text-sm font-bold text-gray-700">{new Date(os.data).getDate()}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-400">
                        {new Date(os.data).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    {/* Info Principal */}
                    <div>
                      <span className="font-mono font-bold text-gray-900 block">{os.veiculo?.placa || 'N/A'}</span>
                      <span className="text-xs text-gray-500">{os.fornecedor?.nome}</span>
                    </div>
                  </div>
                  {/* Status no Topo Mobile */}
                  <div className="flex flex-col items-end gap-1">
                    {getBadgeStatus(os.status)}
                  </div>
                </div>

                {/* Linha de Detalhes */}
                <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-3">
                  {getBadgeTipo(os.tipo)}
                  <span className="font-mono font-bold text-gray-900">
                    {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* Ações Mobile */}
                <div className="flex gap-2 pt-1">
                   {os.fotoComprovanteUrl && (
                    <Button 
                      variant="secondary" 
                      className="flex-1 text-xs h-9" 
                      icon={<FileText className="w-3 h-3"/>}
                      onClick={() => window.open(os.fotoComprovanteUrl || '', '_blank')}
                    >
                      Comprovante
                    </Button>
                  )}
                  <div className="flex-1">
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

      {/* 3. MODAIS */}
      
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
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
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