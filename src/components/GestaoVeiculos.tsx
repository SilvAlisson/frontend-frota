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

  // Helper para Badges de Status
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* 1. HEADER */}
      <PageHeader
        title="Frota"
        subtitle="Gerencie os equipamentos, status e prontuário dos veículos."
        actionLabel="Novo Veículo"
        onAction={() => setIsCadastroOpen(true)}
        extraAction={
          <div className="w-full md:w-72">
            <Input
              placeholder="Buscar placa ou modelo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              icon={<Search className="w-4 h-4 text-text-muted" />}
              className="bg-surface h-11"
            />
          </div>
        }
      />

      {/* 2. LISTAGEM */}
      {isLoading ? (
         <SkeletonTable />
      ) : (
        <ListaResponsiva
          itens={veiculosFiltrados}
          emptyMessage={busca ? "Nenhum veículo corresponde à sua busca." : "Nenhum veículo cadastrado na frota."}

          // CABEÇALHO DESKTOP
          desktopHeader={
            <>
              <th className={TableStyles.th}>Veículo / Placa</th>
              <th className={TableStyles.th}>Detalhes</th>
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
                  className={`${TableStyles.dataText} flex items-center gap-2 hover:border-primary/50 hover:text-primary transition-colors`}
                  title="Ver Prontuário do Veículo"
                >
                  <Truck className="w-3.5 h-3.5 opacity-50" />
                  {v.placa}
                </button>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main">{v.modelo}</span>
                  <span className="text-xs text-text-secondary font-medium">{v.ano} • {v.tipoVeiculo || 'N/A'}</span>
                </div>
              </td>
              <td className={`${TableStyles.td}`}>
                <span className="text-xs font-bold text-text-muted uppercase tracking-wide bg-surface-hover px-2 py-1 rounded-md border border-border/50">
                  {v.tipoCombustivel.replace(/_/g, ' ')}
                </span>
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

          // CARD MOBILE (Conteúdo Interno Limpo, o card pai cuida do visual)
          renderMobile={(v) => (
            <div className="flex justify-between items-start" onClick={() => navigate(`/admin/veiculos/${v.id}`)}>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className={`${TableStyles.dataText} text-sm px-2 py-0.5`}>{v.placa}</span>
                  {getStatusBadge(v.status)}
                </div>
                <div>
                  <h3 className="font-black text-text-main text-base leading-tight">{v.modelo}</h3>
                  <p className="text-xs text-text-secondary font-medium mt-0.5">{v.tipoVeiculo} • {v.ano}</p>
                </div>
              </div>

              <div onClick={e => e.stopPropagation()} className="shrink-0">
                <DropdownAcoes
                  onVerDetalhes={() => navigate(`/admin/veiculos/${v.id}`)}
                  onEditar={() => setVeiculoParaEditar(v)}
                  onExcluir={() => setVeiculoParaExcluir(v.id)}
                />
              </div>
            </div>
          )}
        />
      )}

      {/* --- MODAIS --- */}
      <Modal
        isOpen={isCadastroOpen}
        onClose={() => setIsCadastroOpen(false)}
        title="Cadastrar Novo Equipamento"
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
        title="Atualizar Veículo"
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
        title="Excluir Definitivamente?"
        description={
          <div className="space-y-2">
            <p>Você está prestes a remover este veículo da frota.</p>
            <p className="text-sm font-bold text-error bg-error/10 p-3 rounded-lg border border-error/20">
              Atenção: Isso pode corromper históricos de viagens se o veículo já tiver sido utilizado em operações.
            </p>
          </div>
        }
        confirmLabel="Sim, excluir agora"
        variant="danger"
      />

    </div>
  );
}