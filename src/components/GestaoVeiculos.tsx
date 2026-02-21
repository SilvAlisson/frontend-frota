import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Veiculo } from '../types';
import { toast } from 'sonner';
import { Search, Truck, AlertTriangle } from 'lucide-react';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM KLIN ---
import { PageHeader } from './ui/PageHeader';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Badge } from './ui/Badge';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { Modal } from './ui/Modal';
import { TableStyles } from '../styles/table';
import { SkeletonTable } from './skeletons/SkeletonTable';

// ✨ Novos Componentes de Elite
import { ConfirmModal } from './ui/ConfirmModal';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';

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
        loading: 'A remover veículo da frota...',
        success: 'Veículo removido com sucesso!',
        error: 'Erro: Este veículo tem histórico associado e não pode ser apagado.'
      });
      refetch();
    } catch (error) {
      console.error('[DELETE_VEICULO_ERROR]', error);
    } finally {
      setVeiculoParaExcluir(null);
    }
  };

  // Helper para Badges de Status Premium
  const getStatusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "neutral" | "danger"> = {
      'ATIVO': 'success',
      'EM_MANUTENCAO': 'warning',
      'INATIVO': 'neutral',
      'QUEBRADO': 'danger'
    };
    const variant = map[status] || 'neutral';
    return <Badge variant={variant} className="shadow-sm">{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* 1. HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Diretório de Frota</h1>
          <p className="text-text-secondary font-medium mt-1.5 opacity-90">Controlo de equipamentos, status operacionais e prontuários.</p>
        </div>

        <PageHeader
          title=""
          subtitle=""
          actionLabel="Novo Veículo"
          onAction={() => setIsCadastroOpen(true)}
          extraAction={
            <div className="w-full md:w-72">
              <Input
                placeholder="Procurar por placa ou modelo..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                icon={<Search className="w-4 h-4 text-text-muted" />}
                className="bg-surface-hover/50 border-none font-medium h-11"
                containerClassName="!mb-0"
              />
            </div>
          }
        />
      </div>

      {/* 2. LISTAGEM & EMPTY STATE */}
      {isLoading ? (
         <div className="bg-surface rounded-3xl shadow-sm border border-border/60 p-6">
           <SkeletonTable />
         </div>
      ) : veiculosFiltrados.length === 0 ? (
        // ✨ O NOSSO EMPTY STATE ELEGANTE
        <EmptyState 
          icon={Truck} 
          title={busca ? "Nenhum veículo encontrado" : "Frota Vazia"} 
          description={busca ? "Verifique se a placa ou modelo estão corretos." : "Registe o primeiro equipamento para iniciar o controlo."} 
        />
      ) : (
        <div className="bg-surface rounded-3xl shadow-sm border border-border/60 overflow-hidden">
          <ListaResponsiva
            itens={veiculosFiltrados}
            emptyMessage="" // Deixamos vazio pois o EmptyState já tomou conta do recado

            // CABEÇALHO DESKTOP
            desktopHeader={
              <>
                <th className={`${TableStyles.th} pl-8`}>Veículo / Placa</th>
                <th className={TableStyles.th}>Especificações</th>
                <th className={TableStyles.th}>Combustível</th>
                <th className={TableStyles.th}>Status Operacional</th>
                <th className={`${TableStyles.th} text-right pr-8`}>Ações</th>
              </>
            }

            // LINHA DESKTOP
            renderDesktop={(v) => (
              <>
                <td className={`${TableStyles.td} pl-8`}>
                  <button
                    onClick={() => navigate(`/admin/veiculos/${v.id}`)}
                    className={`${TableStyles.dataText} flex items-center gap-3 hover:text-primary transition-colors group`}
                    title="Aceder ao Prontuário"
                  >
                    <div className="p-2.5 bg-surface-hover rounded-xl border border-border/60 text-text-muted group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all shadow-sm">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="font-mono tracking-tight text-base font-black">{v.placa}</span>
                  </button>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-text-main leading-tight">{v.modelo}</span>
                    <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">{v.ano} • {v.tipoVeiculo || 'N/A'}</span>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-hover px-2 py-1 rounded-md border border-border/50">
                    {v.tipoCombustivel.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className={TableStyles.td}>
                  {getStatusBadge(v.status)}
                </td>
                <td className={`${TableStyles.td} text-right pr-8`}>
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
              <div className="p-5 border-b border-border/50 hover:bg-surface-hover/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/veiculos/${v.id}`)}>
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-lg text-primary tracking-tight leading-none">{v.placa}</span>
                      {getStatusBadge(v.status)}
                    </div>
                    <div>
                      <h3 className="font-black text-text-main text-base leading-tight">{v.modelo}</h3>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mt-1">{v.tipoVeiculo} • {v.ano}</p>
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
              </div>
            )}
          />
        </div>
      )}

      {/* --- MODAIS DE APOIO --- */}
      <Modal
        isOpen={isCadastroOpen}
        onClose={() => setIsCadastroOpen(false)}
        title="Registar Novo Equipamento"
        className="max-w-2xl"
      >
        <div className="p-2">
          <FormCadastrarVeiculo
            onSuccess={() => { setIsCadastroOpen(false); refetch(); }}
            onCancelar={() => setIsCadastroOpen(false)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!veiculoParaEditar}
        onClose={() => setVeiculoParaEditar(null)}
        title="Atualizar Equipamento"
        className="max-w-2xl"
      >
        {veiculoParaEditar && (
          <div className="p-2">
            <FormEditarVeiculo
              veiculoId={veiculoParaEditar.id}
              onSuccess={() => { setVeiculoParaEditar(null); refetch(); }}
              onCancelar={() => setVeiculoParaEditar(null)}
            />
          </div>
        )}
      </Modal>

      {/* ✨ CONFIRM MODAL COM CALLOUT INTEGRADO */}
      <ConfirmModal
        isOpen={!!veiculoParaExcluir}
        onCancel={() => setVeiculoParaExcluir(null)}
        onConfirm={handleExecuteDelete}
        title="Atenção: Exclusão de Veículo"
        description={
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">Tem a certeza que deseja remover definitivamente este veículo do diretório da frota?</p>
            <Callout variant="danger" title="Ação Irreversível" icon={AlertTriangle}>
              A exclusão deste registo pode corromper métricas, relatórios financeiros e históricos de viagens caso o equipamento já tenha operado no sistema.
            </Callout>
          </div>
        }
        confirmLabel="Sim, Excluir Equipamento"
        variant="danger"
      />

    </div>
  );
}