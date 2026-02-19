import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Veiculo } from '../types';
import { toast } from 'sonner';
import { Search, Truck } from 'lucide-react';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

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
import { SkeletonTable } from './skeletons/SkeletonTable';

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

  // 📡 BUSCA INDEPENDENTE COM CACHE
  const { data: veiculos = [], isLoading, refetch } = useVeiculos();

  // --- FILTRAGEM MEMOIZADA ---
  // Evita reprocessar a lista inteira se o componente re-renderizar por outro motivo
  const veiculosFiltrados = useMemo(() => {
    if (!busca) return veiculos;
    const termo = busca.toLowerCase();
    return veiculos.filter(v =>
      v.placa.toLowerCase().includes(termo) ||
      v.modelo.toLowerCase().includes(termo)
    );
  }, [veiculos, busca]);

  // --- ACTIONS ---
  const handleExecuteDelete = async () => {
    if (!veiculoParaExcluir) return;

    try {
      await toast.promise(api.delete(`/veiculos/${veiculoParaExcluir}`), {
        loading: 'Excluindo veículo...',
        success: 'Veículo removido com sucesso!',
        error: 'Erro ao remover veículo. Ele pode estar atrelado a algum histórico.'
      });
      refetch();
    } catch (error) {
      console.error('[DELETE_VEICULO_ERROR]', error);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">

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
      {isLoading ? (
         <SkeletonTable />
      ) : (
        <Card padding="none" className="overflow-hidden border-border/50 shadow-sm">
          <ListaResponsiva
            itens={veiculosFiltrados}
            emptyMessage={busca ? "Nenhum veículo corresponde à sua busca." : "Nenhum veículo cadastrado na frota."}

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
              <tr key={v.id} className="hover:bg-surface-hover/50 transition-colors">
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
              </tr>
            )}

            // CARD MOBILE
            renderMobile={(v) => (
              <div 
                key={v.id}
                className="p-4 flex justify-between items-start cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover/50 active:bg-surface-hover transition-colors" 
                onClick={() => navigate(`/admin/veiculos/${v.id}`)}
              >
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