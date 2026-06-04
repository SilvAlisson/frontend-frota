import { useState, useMemo } from 'react';
import { Wrench, BarChart2, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { usePlanosManutencao } from '../hooks/usePlanosManutencao';
import { GraficoBarraPlanos } from './ui/GraficosFrota';
import { FormPlanoManutencao } from './forms/FormPlanoManutencao';
import { CHART_COLORS_STATUS } from '../config/chartColors';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { PageHeader } from './ui/PageHeader';

import { useModalStore } from '../hooks/useModalStore';
import { CardPlanoManutencao, processarPlanosManutencao } from './planos/CardPlanoManutencao';
import type { PlanoProcessado } from './planos/CardPlanoManutencao';

export function PainelPlanosPreventivos() {
  const { planos, isLoading, refetch, registrarExecucao, excluirPlano } = usePlanosManutencao(undefined, undefined, true);
  const { openModal, closeModal } = useModalStore();

  const planosProcessados = useMemo(() => processarPlanosManutencao(planos), [planos]);

  const ordenados = [...planosProcessados].sort((a, b) => {
    const weights: Record<string, number> = { 'VERMELHO': 0, 'AMARELO': 1, 'VERDE': 2 };
    return weights[a.status] - weights[b.status];
  });

  const handleExcluirPlano = (id: string) => {
    openModal('CONFIRM', {
      title: "Remover Plano de Manutenção",
      description: "Esta ação apagará os alertas futuros e não poderá ser desfeita.",
      variant: "danger",
      confirmLabel: "Sim, Remover",
      onConfirm: async () => {
        await excluirPlano.mutateAsync(id);
      }
    });
  };

  const abrirModalCriacao = () => {
    const modalId = openModal('CUSTOM', {
      content: (
        <div className="bg-surface p-6 rounded-3xl max-w-2xl mx-auto w-full border border-border/60">
          <h2 className="text-xl font-black mb-4">Novo Plano de Manutenção</h2>
          <FormPlanoManutencao
            onSuccess={() => {
              closeModal(modalId);
              refetch();
            }}
            onCancel={() => closeModal(modalId)}
          />
        </div>
      )
    });
  };

  const handleAbrirBaixa = (plano: PlanoProcessado) => {
    // Componente interno para o formulário de baixa que mantém seu próprio estado
    const FormBaixa = () => {
      const [km, setKm] = useState(plano.veiculo.ultimoKm?.toString() || '');
      const [obs, setObs] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleRegistrarBaixa = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
          await registrarExecucao.mutateAsync({
            planoId: plano.id,
            kmDaBaixa: km ? Number(km) : undefined,
            observacao: obs
          });
          closeModal(modalId);
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div className="bg-surface p-6 rounded-3xl max-w-xl mx-auto w-full border border-border/60">
          <h2 className="text-xl font-black mb-6">Registrar Conclusão de Plano</h2>
          <form onSubmit={handleRegistrarBaixa} className="space-y-6">
            <div className="bg-surface-hover p-4 rounded-xl border border-border/40 text-sm">
              Você está registrando a execução de <strong>{plano.descricao}</strong> para o veículo <strong className="font-mono text-text-main">{plano.veiculo.placa}</strong>.
              <br /><br />
              O próximo ciclo será re-engatilhado automaticamente e a meta ({plano.valorIntervalo} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}) será somada à quilometragem/mês de hoje.
            </div>

            {plano.tipoIntervalo === 'KM' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main flex gap-1">KM do Veículo na execução: <span className="text-error">*</span></label>
                <Input
                  type="number" inputMode="numeric"
                  placeholder="Ex: 85200"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  required
                />
                <p className="text-xs text-text-muted">Último KM conhecido pelo rastreador: {plano.veiculo.ultimoKm}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main">Comprovantes ou Observações (Opcional):</label>
              <Input
                type="text"
                placeholder="Ex: Feito na Oficina Center Car, NF 4402 - R$ 680"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => closeModal(modalId)} className="flex-1 text-text-muted" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest uppercase">
                Salvar & Renovar
              </Button>
            </div>
          </form>
        </div>
      );
    };

    const modalId = openModal('CUSTOM', { content: <FormBaixa /> });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── CABEÇALHO PADRÃO PREMIUM ─── */}
      <PageHeader
        title="Cockpit de Preventivas"
        subtitle="Cards interativos medindo a saúde da frota baseada no hodômetro e calendário."
        actionLabel="Novo Plano"
        onAction={abrirModalCriacao}
      />

      {/* ─── GRÁFICO BARRA — Saúde da Frota ─── */}
      {ordenados.length > 0 && (
        <div className="bg-surface border border-border/60 rounded-[2rem] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-text-muted" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Saúde da Frota — Desgaste por Intervenção</span>
          </div>
          <GraficoBarraPlanos
            dados={ordenados.map(p => ({
              nome: p.veiculo.placa,
              desgaste: p.percentualDesgaste,
              status: p.status
            }))}
          />
          <div className="flex items-center gap-4 justify-center mt-3">
            {[
              { color: CHART_COLORS_STATUS.normal,  label: 'Normal' },
              { color: CHART_COLORS_STATUS.atencao, label: 'Atenção' },
              { color: CHART_COLORS_STATUS.vencido, label: 'Vencido' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-text-muted">
                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: l.color }} />{l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── CARDS DOS PLANOS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ordenados.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Wrench}
              title="Nenhum Plano Ativo"
              description='Clique em "Novo Plano" para começar a monitorar a frota.'
              action={
                <Button variant="primary" onClick={abrirModalCriacao} icon={<Plus className="w-4 h-4" />}>
                  Novo Plano
                </Button>
              }
            />
          </div>
        )}

        {ordenados.map((plano) => (
          <CardPlanoManutencao
            key={plano.id}
            planoProcessado={plano}
            onExcluir={handleExcluirPlano}
            onBaixar={handleAbrirBaixa}
            isExcluindo={excluirPlano.isPending && excluirPlano.variables === plano.id}
          />
        ))}
      </div>
    </div>
  );
}
