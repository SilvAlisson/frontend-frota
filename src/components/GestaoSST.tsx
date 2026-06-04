import { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Plus,
  Target, Download, HeartPulse
} from 'lucide-react';

import { useSST, type AcaoSST, type ProgramaSST } from '../hooks/useSST';
import { useUsuarios } from '../hooks/useUsuarios';
import { Button } from './ui/Button';
import { Tabs, type TabItem } from './ui/Tabs';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { Callout } from './ui/Callout';
import { exportarParaExcel } from '../utils';

// Sub-componentes
import { FormAcaoSST, type AcaoSSTForm } from './GestaoSST/FormAcaoSST';
import { DashboardSST } from './GestaoSST/Tabs/DashboardSST';
import { PlanoAcaoSST } from './GestaoSST/Tabs/PlanoAcaoSST';
import { TreinamentosSST } from './GestaoSST/Tabs/TreinamentosSST';

export function GestaoSST() {
  const [aba, setAba] = useState<'dashboard' | 'plano' | 'treinamentos'>('dashboard');
  const [filtroPrograma, setFiltroPrograma] = useState<ProgramaSST | ''>('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [acaoParaEditar, setAcaoParaEditar] = useState<AcaoSST | undefined>(undefined);
  const [acaoParaExcluir, setAcaoParaExcluir] = useState<AcaoSST | null>(null);

  const { usuarios = [], isLoading: isLoadingUsuarios } = useUsuarios();

  const {
    acoesFiltradas, alertas, estatisticas,
    isLoading, criarAcao, atualizarAcao, deletarAcao,
  } = useSST(filtroPrograma);

  // ── Handlers ──
  const abrirNovaAcao = () => { setAcaoParaEditar(undefined); setModalAberto(true); };
  const abrirEdicao  = (acao: AcaoSST) => { setAcaoParaEditar(acao); setModalAberto(true); };
  const fecharModal  = () => { setModalAberto(false); setAcaoParaEditar(undefined); };

  const handleFormSubmit = async (data: AcaoSSTForm) => {
    const payload = {
      ...data,
      vencimento: new Date(data.vencimento + 'T12:00:00').toISOString(),
    };

    if (acaoParaEditar) {
      await atualizarAcao.mutateAsync({ id: acaoParaEditar.id, ...payload } as AcaoSST);
    } else {
      await criarAcao.mutateAsync(payload as Omit<AcaoSST, 'id'>);
    }
    fecharModal();
  };

  const handleExportar = () => {
    if (acoesFiltradas.length === 0) return;
    exportarParaExcel(
      acoesFiltradas.map((a) => ({
        Ação:     a.acao,
        Unidade:    a.unidade,
        Programa:   a.programa,
        Responsável:  a.responsaveis,
        Vencimento:  a.vencimento.split('T')[0],
        Realizado:   a.realizado ?? '',
        Status:    a.status,
        Observação:  a.observacao ?? '',
      })),
      `Plano_Acao_SST_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const isMutating = criarAcao.isPending || atualizarAcao.isPending;

  // ── Skeletons ──
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-10 w-72 bg-surface-hover/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-hover/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-surface-hover/50 rounded-2xl animate-pulse" />
        <div className="h-64 bg-surface-hover/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

      {/* ── CABEÇALHO ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">
              Gestão de SST
            </h1>
          </div>
          <p className="text-text-secondary font-medium mt-2 opacity-90 pl-[52px]">
            Saúde e Segurança do Trabalho — Objetivos e Plano de Ação 2026.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={handleExportar}
            disabled={acoesFiltradas.length === 0}
            icon={<Download className="w-4 h-4" />}
            className="flex-1 sm:flex-none h-11"
          >
            Excel
          </Button>
          <Button
            variant="primary"
            onClick={abrirNovaAcao}
            icon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-none h-11 shadow-button hover:shadow-float-primary"
          >
            Nova Ação
          </Button>
        </div>
      </div>

      {/* ── TABS (Design System) ── */}
      <Tabs
        variant="segmented"
        activeTab={aba}
        onChange={(id) => setAba(id as typeof aba)}
        className="w-full sm:w-auto"
        tabs={[
          { id: 'dashboard', label: 'Dashboard de Metas',    icon: Target },
          { id: 'plano',    label: 'Plano de Ação',       icon: ShieldCheck },
          { id: 'treinamentos', label: 'Treinamentos & Saúde', icon: HeartPulse },
        ] satisfies TabItem[]}
      />

      {/* ── CONTEÚDO DAS ABAS ── */}
      {aba === 'dashboard' && (
        <DashboardSST 
          estatisticas={estatisticas} 
          alertas={alertas as (AcaoSST & { diffDias: number })[]} 
        />
      )}

      {aba === 'plano' && (
        <PlanoAcaoSST 
          acoesFiltradas={acoesFiltradas} 
          filtroPrograma={filtroPrograma} 
          setFiltroPrograma={setFiltroPrograma} 
          abrirNovaAcao={abrirNovaAcao} 
          abrirEdicao={abrirEdicao} 
          setAcaoParaExcluir={setAcaoParaExcluir} 
        />
      )}

      {aba === 'treinamentos' && (
        <TreinamentosSST 
          usuarios={usuarios} 
          isLoadingUsuarios={isLoadingUsuarios} 
        />
      )}

      {/* ── MODAL FORMULÁRIO ── */}
      <Modal
        isOpen={modalAberto}
        onClose={fecharModal}
        title={acaoParaEditar ? 'Editar Ação de SST' : 'Nova Ação de SST'}
        className="max-w-2xl"
      >
        <FormAcaoSST
          acaoParaEditar={acaoParaEditar}
          onSubmit={handleFormSubmit}
          onCancel={fecharModal}
          isLoading={isMutating}
        />
      </Modal>

      {/* ── MODAL EXCLUSÃO ── */}
      <ConfirmModal
        isOpen={!!acaoParaExcluir}
        onCancel={() => setAcaoParaExcluir(null)}
        onConfirm={async () => {
          if (!acaoParaExcluir) return;
          await deletarAcao.mutateAsync(acaoParaExcluir.id);
          setAcaoParaExcluir(null);
        }}
        title="Remover Ação de SST"
        description={
          <div className="space-y-4">
            <p className="text-text-secondary text-sm font-medium">
              Tem certeza que deseja excluir a ação <strong className="text-text-main font-black">"{acaoParaExcluir?.acao}"</strong>?
            </p>
            <Callout variant="warning" title="Atenção" icon={AlertTriangle}>
              Esta ação será removida permanentemente do Plano de Ação SST e afetará o cálculo de progresso.
            </Callout>
          </div>
        }
        variant="danger"
        confirmLabel={deletarAcao.isPending ? 'A remover...' : 'Sim, Excluir'}
      />

    </div>
  );
}
