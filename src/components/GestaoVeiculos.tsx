import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Veiculo } from '../types';
import { toast } from 'sonner';
import { Search, Truck } from 'lucide-react';

// --- DESIGN SYSTEM KLIN ---
import { PageHeader } from './ui/PageHeader';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { TableStyles } from '../styles/table';
import { SkeletonTable } from './skeletons/SkeletonTable'; // [NOVO]

// --- FORMS ---
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';

export function GestaoVeiculos() {
  const navigate = useNavigate();

  // Estados de Controle
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [veiculoParaEditar, setVeiculoParaEditar] = useState<Veiculo | null>(null);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Busca de Dados
  const { data: veiculos, isLoading, refetch } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: async () => {
      const response = await api.get('/veiculos');
      return response.data;
    }
  });

  // Filtragem
  const veiculosFiltrados = veiculos?.filter(v =>
    v.placa.toLowerCase().includes(busca.toLowerCase()) ||
    v.modelo.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  // Ação de Exclusão Real
  const handleExecuteDelete = async () => {
    if (!veiculoParaExcluir) return;
    try {
      await api.delete(`/veiculos/${veiculoParaExcluir}`);
      toast.success("Veículo removido com sucesso");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover veículo");
    } finally {
      setVeiculoParaExcluir(null);
    }
  };

  // Helper para Badges de Status (Semântico)
  const getStatusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "neutral" | "danger"> = {
      'ATIVO': 'success',
      'EM_MANUTENCAO': 'warning',
      'INATIVO': 'neutral',
      'QUEBRADO': 'danger'
    };
    const variant = map[status] || 'neutral';
    return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 animate-enter pb-10">

      {/* 1. HEADER */}
      <PageHeader
        title="Frota"
        subtitle="Gerencie os equipamentos, status e prontuário dos veículos."
        actionLabel="Novo Veículo"
        onAction={() => setIsCadastroOpen(true)}
        extraAction={
          <div className="w-full md:w-64">
            <Input
              placeholder="Buscar placa ou modelo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              icon={<Search className="w-4 h-4 text-text-muted" />}
            />
          </div>
        }
      />

      {/* 2. LISTAGEM */}
      {/* Removemos o Card wrapper aqui para o Skeleton ocupar a área corretamente */}
      {isLoading ? (
         <SkeletonTable />
      ) : (
        <Card noPadding>
          <ListaResponsiva
            itens={veiculosFiltrados}
            emptyMessage="Nenhum veículo encontrado na frota."

            // CABEÇALHO DESKTOP
            desktopHeader={
              <>
                <th className={TableStyles.th}>Placa</th>
                <th className={TableStyles.th}>Modelo / Ano</th>
                <th className={TableStyles.th}>Combustível</th>
                <th className={TableStyles.th}>Status</th>
                <th className={`${TableStyles.th} text-right`}>Ações</th>
              </>
            }

            // LINHA DESKTOP
            renderDesktop={(v) => (
              <>
                <td className={TableStyles.td}>
                  <button
                    onClick={() => navigate(`/admin/veiculos/${v.id}`)}
                    className="flex items-center gap-2 font-mono font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10 hover:bg-primary/10 transition-colors group"
                  >
                    <Truck className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    {v.placa}
                  </button>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main">{v.modelo}</span>
                    <span className="text-xs text-text-secondary font-medium">{v.ano} • {v.tipoVeiculo || 'N/A'}</span>
                  </div>
                </td>
                <td className={`${TableStyles.td} text-text-muted text-xs uppercase tracking-wide`}>
                  {v.tipoCombustivel.replace(/_/g, ' ')}
                </td>
                <td className={TableStyles.td}>
                  {getStatusBadge(v.status)}
                </td>
                <td className={`${TableStyles.td} text-right`}>
                  <DropdownAcoes
                    onVerDetalhes={() => navigate(`/admin/veiculos/${v.id}`)}
                    onEditar={() => setVeiculoParaEditar(v)}
                    onExcluir={() => setVeiculoParaExcluir(v.id)}
                  />
                </td>
              </>
            )}

            // CARD MOBILE
            renderMobile={(v) => (
              <div className="p-4 flex justify-between items-start cursor-pointer hover:bg-surface-hover/50 active:bg-surface-hover transition-colors" onClick={() => navigate(`/admin/veiculos/${v.id}`)}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-primary">{v.placa}</span>
                    {getStatusBadge(v.status)}
                  </div>
                  <h3 className="font-bold text-text-main">{v.modelo}</h3>
                  <p className="text-xs text-text-secondary">{v.tipoVeiculo} • {v.ano}</p>
                </div>

                <div onClick={e => e.stopPropagation()}>
                  <DropdownAcoes
                    onVerDetalhes={() => navigate(`/admin/veiculos/${v.id}`)}
                    onEditar={() => setVeiculoParaEditar(v)}
                    onExcluir={() => setVeiculoParaExcluir(v.id)}
                  />
                </div>
              </div>
            )}
          />
        </Card>
      )}

      {/* --- MODAIS --- */}

      <Modal
        isOpen={isCadastroOpen}
        onClose={() => setIsCadastroOpen(false)}
        title="Novo Veículo"
        className="max-w-2xl"
      >
        <FormCadastrarVeiculo
          onSuccess={() => { setIsCadastroOpen(false); refetch(); }}
          onCancelar={() => setIsCadastroOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!veiculoParaEditar}
        onClose={() => setVeiculoParaEditar(null)}
        title="Editar Veículo"
        className="max-w-2xl"
      >
        {veiculoParaEditar && (
          <FormEditarVeiculo
            veiculoId={veiculoParaEditar.id}
            onSuccess={() => { setVeiculoParaEditar(null); refetch(); }}
            onCancelar={() => setVeiculoParaEditar(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!veiculoParaExcluir}
        onCancel={() => setVeiculoParaExcluir(null)}
        onConfirm={handleExecuteDelete}
        title="Excluir Veículo"
        description={
          <span>
            Tem certeza que deseja remover este veículo? <br />
            <span className="font-bold text-error block mt-1">Isso apagará todo o histórico associado.</span>
          </span>
        }
        confirmLabel="Sim, excluir veículo"
        variant="danger"
      />

    </div>
  );
}