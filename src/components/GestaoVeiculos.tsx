import { useState } from 'react';
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
import { Skeleton } from './ui/Skeleton';
import { SkeletonTable } from './skeletons/SkeletonTable';

// ✨ Novos Componentes de Elite
import { ConfirmModal } from './ui/ConfirmModal';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';

import { useFiltragemVeiculos } from '../hooks/useFiltragemVeiculos';
import React, { Suspense } from 'react';

// --- FORMS (LAZY LOADED) ---
const FormCadastrarVeiculo = React.lazy(() => import('./forms/FormCadastrarVeiculo').then(module => ({ default: module.FormCadastrarVeiculo })));
const FormEditarVeiculo = React.lazy(() => import('./forms/FormEditarVeiculo').then(module => ({ default: module.FormEditarVeiculo })));

export function GestaoVeiculos() {
  const navigate = useNavigate();

  // Estados de Controle
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [veiculoParaEditar, setVeiculoParaEditar] = useState<Veiculo | null>(null);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<string | null>(null);
  // 📡 BUSCA INDEPENDENTE COM CACHE
  const { data: veiculos = [], isLoading, refetch } = useVeiculos();

  // --- FILTRAGEM (HOOK REUTILIZÁVEL) ---
  const { busca, setBusca, veiculosFiltrados } = useFiltragemVeiculos(veiculos as Veiculo[]);

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
          <p className="text-text-secondary font-medium mt-1.5 opacity-90">Controle de Equipamentos, status operacionais e prontuários.</p>
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
                className="bg-surface-hover/50 border-none focus:ring-1 focus:ring-primary/30 font-medium h-11"
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
        <EmptyState
          icon={Truck}
          title={busca ? "Nenhum veículo encontrado" : "Frota Vazia"}
          description={busca ? "Verifique se a placa ou modelo estão corretos." : "Registre o primeiro Equipamento para iniciar o controle."}
        />
      ) : (
        <div className="bg-surface rounded-3xl shadow-sm border border-border/60 overflow-hidden">
          <ListaResponsiva
            itens={veiculosFiltrados}
            emptyMessage=""

            // CABEÇALHO DESKTOP
            desktopHeader={
              <>
                <th className={`${TableStyles.th} pl-8 text-left`}>Veículo / Placa</th>
                <th className={`${TableStyles.th} text-center`}>Especificações</th>
                <th className={`${TableStyles.th} text-center`}>Combustível</th>
                <th className={`${TableStyles.th} text-center`}>Status Operacional</th>
                <th className={`${TableStyles.th} text-right pr-8`}>Ações</th>
              </>
            }

            // LINHA DESKTOP
            renderDesktop={(v) => (
              <>
                <td className={`${TableStyles.td} pl-8 py-5 hover-lift`}>
                  {/* ✨ POLIMENTO: Placa como componente físico e tactile */}
                  <button
                    onClick={() => navigate(`/admin/veiculos/${v.id}`)}
                    className="flex items-center gap-3 group outline-none"
                    title="Acessar ao Prontuário"
                  >
                    <div className="p-2.5 bg-surface-hover rounded-xl border border-border/60 text-text-muted group-hover:bg-primary/5 group-hover:text-primary transition-all shadow-sm">
                      <Truck className="w-4 h-4" />
                    </div>
                    {/* Visual de placa cinza com borda física */}
                    <span className="text-data text-[13px] bg-surface-hover/80 px-2.5 py-1 rounded-md border border-border/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] text-text-main group-hover:border-primary/40 transition-colors">
                      {v.placa}
                    </span>
                  </button>
                </td>
                <td className={`${TableStyles.td} py-5 text-center`}>
                  <div className="w-full flex flex-col gap-1 items-center justify-center text-center">
                    <span className="text-sm font-bold text-text-main leading-tight block w-full">{v.modelo}</span>
                    <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block w-full">{v.ano} • <span className="text-data">{v.id.substring(0, 6).toUpperCase()}</span></span>
                  </div>
                </td>
                <td className={`${TableStyles.td} py-5 text-center`}>
                  <div className="w-full flex justify-center">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest bg-surface-hover px-2 py-1 rounded-md border border-border/50 inline-block">
                      {v.tipoCombustivel.replace(/_/g, ' ')}
                    </span>
                  </div>
                </td>
                <td className={`${TableStyles.td} py-5 text-center`}>
                  <div className="w-full flex justify-center">
                    <div className="glass inline-block rounded-md overflow-hidden">
                      {getStatusBadge(v.status)}
                    </div>
                  </div>
                </td>
                <td className={`${TableStyles.td} text-right pr-8 py-5`}>
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
              <div className="p-5 border-b border-border/50 hover:bg-surface-hover/30 transition-colors cursor-pointer hover-lift rounded-2xl m-2 glass" onClick={() => navigate(`/admin/veiculos/${v.id}`)}>
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {/* Visual de placa cinza mobile */}
                      <span className="text-data text-[13px] bg-surface hover:bg-surface-hover px-2.5 py-1 rounded-md border border-border/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] text-text-main transition-colors uppercase">
                        {v.placa}
                      </span>
                      <div className="glass inline-block rounded-md overflow-hidden">
                        {getStatusBadge(v.status)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-main leading-tight">{v.modelo}</h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mt-1">{v.tipoVeiculo} • {v.ano}</p>
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
        title="Registar Novo Equipemento"
        className="max-w-2xl"
      >
        <div className="p-2">
          <Suspense fallback={<div className="p-4 space-y-4"><Skeleton variant="title" /><Skeleton variant="tableRow" className="h-24" /><Skeleton variant="tableRow" className="h-24" /></div>}>
            <FormCadastrarVeiculo
              onSuccess={() => { setIsCadastroOpen(false); refetch(); }}
              onCancelar={() => setIsCadastroOpen(false)}
            />
          </Suspense>
        </div>
      </Modal>

      <Modal
        isOpen={!!veiculoParaEditar}
        onClose={() => setVeiculoParaEditar(null)}
        title="Atualizar Equipemento"
        className="max-w-2xl"
      >
        {veiculoParaEditar && (
          <div className="p-2">
            <Suspense fallback={<div className="p-4 space-y-4"><Skeleton variant="title" /><Skeleton variant="tableRow" className="h-24" /><Skeleton variant="tableRow" className="h-24" /></div>}>
              <FormEditarVeiculo
                veiculoId={veiculoParaEditar.id}
                onSuccess={() => { setVeiculoParaEditar(null); refetch(); }}
                onCancelar={() => setVeiculoParaEditar(null)}
              />
            </Suspense>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!veiculoParaExcluir}
        onCancel={() => setVeiculoParaExcluir(null)}
        onConfirm={handleExecuteDelete}
        title="Atenção: Exclusão de Veículo"
        description={
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">Tem certeza que deseja remover definitivamente este veículo do diretório da frota?</p>
            <Callout variant="danger" title="Ação Irreversível" icon={AlertTriangle}>
              A exclusão deste Registro pode corromper métricas, relatórios financeiros e históricos de viagens caso o Equipemento já tenha operado no sistema.
            </Callout>
          </div>
        }
        confirmLabel="Sim, Excluir Equipemento"
        variant="danger"
      />

    </div>
  );
}


