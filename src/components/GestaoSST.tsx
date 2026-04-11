import { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ShieldCheck, AlertTriangle, Plus, Pencil, Trash2,
  Clock, CheckCircle2, XCircle, Filter,
  Target, TrendingUp, Download, Bell,
} from 'lucide-react';

import { useSST, type AcaoSST, type ProgramaSST, type StatusSST } from '../hooks/useSST';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { Callout } from './ui/Callout';
import { exportarParaExcel } from '../utils';
import { cn } from '../lib/utils';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PROGRAMAS: { value: ProgramaSST | ''; label: string }[] = [
  { value: '',    label: 'Todos os Programas' },
  { value: 'PCA', label: 'PCA — Proteção Auditiva' },
  { value: 'PPR', label: 'PPR — Proteção Respiratória' },
  { value: 'AET', label: 'AET — Ergonomia' },
  { value: 'PGR', label: 'PGR — Gerenciamento de Riscos' },
];

const PROGRAMAS_FILTRO = PROGRAMAS;

const STATUS_CONFIG: Record<StatusSST, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  REALIZADO: { label: 'Realizado', variant: 'success' },
  ATRASADO:  { label: 'Atrasado',  variant: 'danger'  },
  PENDENTE:  { label: 'Pendente',  variant: 'warning'  },
};

const PROGRAMA_CORES: Record<ProgramaSST, string> = {
  PCA: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
  PPR: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
  AET: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  PGR: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

// ─── Schema de Formulário ─────────────────────────────────────────────────────

const acaoSSTSchema = z.object({
  acao:         z.string().min(3, 'Descreva a ação com pelo menos 3 caracteres.'),
  unidade:      z.string().min(1, 'Unidade obrigatória.'),
  programa:     z.enum(['PCA', 'PPR', 'AET', 'PGR'], { error: 'Selecione o programa.' }),
  responsaveis: z.string().min(3, 'Informe o(s) responsável(is).'),
  vencimento:   z.string().min(1, 'Informe a data de vencimento.'),
  realizado:    z.string().optional(),
  observacao:   z.string().optional(),
  status:       z.enum(['PENDENTE', 'REALIZADO', 'ATRASADO']).optional(),
});

type AcaoSSTForm = z.infer<typeof acaoSSTSchema>;

// ─── Sub-componente: Barra de Progresso ───────────────────────────────────────

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn('w-full h-2 rounded-full bg-surface-hover/70 overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progresso: ${value}%`}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Sub-componente: Card de KPI ──────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass }: {
  label: string; value: string | number; icon: React.ElementType; colorClass: string;
}) {
  return (
    <div className="bg-surface border border-border/60 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center border shrink-0', colorClass)}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-text-main leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Sub-componente: Painel de Alertas ────────────────────────────────────────

function PainelAlertas({ alertas }: { alertas: (AcaoSST & { diffDias: number })[] }) {
  if (alertas.length === 0) {
    return (
      <div
        className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-2xl p-4"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
        <p className="text-sm font-bold text-success">Nenhuma ação com vencimento nos próximos 15 dias. 🎉</p>
      </div>
    );
  }

  return (
    <section
      className="bg-surface border border-error/30 rounded-2xl overflow-hidden shadow-sm"
      aria-label="Painel de alertas de vencimento"
    >
      {/* Cabeçalho do painel */}
      <div className="flex items-center gap-3 bg-error/10 px-5 py-4 border-b border-error/20">
        <Bell className="w-5 h-5 text-error shrink-0 animate-pulse" aria-hidden="true" />
        <h2 className="font-black text-error text-sm uppercase tracking-wider">
          Painel de Alertas — {alertas.length} {alertas.length === 1 ? 'ação crítica' : 'ações críticas'}
        </h2>
      </div>

      <ul className="divide-y divide-border/40" role="list">
        {alertas.map((alerta) => {
          const isVencida = alerta.diffDias < 0;
          return (
            <li
              key={alerta.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-surface-hover/30 transition-colors"
              aria-label={`${alerta.acao} — ${isVencida ? `vencida há ${Math.abs(alerta.diffDias)} dias` : `vence em ${alerta.diffDias} dias`}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle
                  className={cn('w-4 h-4 mt-0.5 shrink-0', isVencida ? 'text-error' : 'text-warning')}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-main truncate">{alerta.acao}</p>
                  <p className="text-xs text-text-muted mt-0.5">{alerta.responsaveis} · {alerta.programa}</p>
                </div>
              </div>
              <div className="shrink-0 pl-7 sm:pl-0">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border',
                    isVencida
                      ? 'bg-error/10 text-error border-error/20'
                      : 'bg-warning/10 text-warning border-warning/20'
                  )}
                  role="status"
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {isVencida
                    ? `Venceu há ${Math.abs(alerta.diffDias)}d`
                    : `Vence em ${alerta.diffDias}d`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Sub-componente: Formulário CRUD ─────────────────────────────────────────

function FormAcaoSST({
  acaoParaEditar,
  onSubmit,
  onCancel,
  isLoading,
}: {
  acaoParaEditar?: AcaoSST;
  onSubmit: (data: AcaoSSTForm) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const formId = useId();
  const isEditing = !!acaoParaEditar;

  const { register, handleSubmit, formState: { errors } } = useForm<AcaoSSTForm>({
    resolver: zodResolver(acaoSSTSchema),
    defaultValues: acaoParaEditar
      ? {
          acao:         acaoParaEditar.acao,
          unidade:      acaoParaEditar.unidade,
          programa:     acaoParaEditar.programa,
          responsaveis: acaoParaEditar.responsaveis,
          vencimento:   acaoParaEditar.vencimento.split('T')[0],
          realizado:    acaoParaEditar.realizado ?? '',
          observacao:   acaoParaEditar.observacao ?? '',
          status:       acaoParaEditar.status,
        }
      : {
          unidade:  'CASE',
          programa: 'PGR',
          status:   'PENDENTE',
        },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      aria-label={isEditing ? 'Formulário de edição de ação SST' : 'Formulário de nova ação SST'}
      noValidate
    >
      {/* Ação */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-acao`} className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">
          Descrição da Ação *
        </label>
        <textarea
          id={`${formId}-acao`}
          {...register('acao')}
          rows={3}
          disabled={isLoading}
          aria-invalid={!!errors.acao}
          aria-describedby={errors.acao ? `${formId}-acao-error` : undefined}
          placeholder="Descreva a ação de SST a ser executada..."
          className={cn(
            'flex w-full text-sm bg-surface border rounded-xl px-4 py-3 resize-none transition-all duration-200 outline-none',
            'placeholder:text-text-muted/60 text-text-main',
            'focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background focus:border-primary shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-60',
            errors.acao ? 'border-error focus:ring-error/20' : 'border-border/60 hover:border-border'
          )}
        />
        {errors.acao && (
          <p id={`${formId}-acao-error`} role="alert" className="text-xs text-error font-bold ml-1">
            {errors.acao.message}
          </p>
        )}
      </div>

      {/* Linha: Unidade + Programa */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Unidade *"
          id={`${formId}-unidade`}
          {...register('unidade')}
          error={errors.unidade?.message}
          disabled={isLoading}
          placeholder="Ex: CASE"
        />
        <Select
          label="Programa *"
          id={`${formId}-programa`}
          {...register('programa')}
          options={PROGRAMAS.filter(p => p.value !== '')}
          error={errors.programa?.message}
          disabled={isLoading}
        />
      </div>

      {/* Linha: Responsáveis + Vencimento */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Responsável(is) *"
          id={`${formId}-responsaveis`}
          {...register('responsaveis')}
          error={errors.responsaveis?.message}
          disabled={isLoading}
          placeholder="Ex: Manuela / Alisson"
        />
        <Input
          label="Data de Vencimento *"
          id={`${formId}-vencimento`}
          type="date"
          {...register('vencimento')}
          error={errors.vencimento?.message}
          disabled={isLoading}
        />
      </div>

      {/* Realizado */}
      <Input
        label="Data/Info Realizado"
        id={`${formId}-realizado`}
        {...register('realizado')}
        error={errors.realizado?.message}
        disabled={isLoading}
        placeholder="Ex: Mensalmente, Anualmente, 15/03/2025..."
      />
      <p className="text-xs text-text-muted font-medium ml-1 -mt-1">
        Deixe vazio se ainda não foi realizado.
      </p>


      {/* Status (apenas na edição) */}
      {isEditing && (
        <Select
          label="Status *"
          id={`${formId}-status`}
          {...register('status')}
          options={[
            { value: 'PENDENTE',  label: 'Pendente' },
            { value: 'REALIZADO', label: 'Realizado' },
            { value: 'ATRASADO',  label: 'Atrasado' },
          ]}
          error={errors.status?.message}
          disabled={isLoading}
        />
      )}

      {/* Observação */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-obs`} className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">
          Observação
        </label>
        <textarea
          id={`${formId}-obs`}
          {...register('observacao')}
          rows={2}
          disabled={isLoading}
          placeholder="Anotações adicionais..."
          className="flex w-full text-sm bg-surface border border-border/60 rounded-xl px-4 py-3 resize-none transition-all duration-200 outline-none placeholder:text-text-muted/60 text-text-main focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background focus:border-primary shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Ações do Form */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1 shadow-button hover:shadow-float-primary"
        >
          {isEditing ? 'Salvar Alterações' : 'Cadastrar Ação'}
        </Button>
      </div>
    </form>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function GestaoSST() {
  const [aba, setAba] = useState<'dashboard' | 'plano'>('dashboard');
  const [filtroPrograma, setFiltroPrograma] = useState<ProgramaSST | ''>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [acaoParaEditar, setAcaoParaEditar] = useState<AcaoSST | undefined>(undefined);
  const [acaoParaExcluir, setAcaoParaExcluir] = useState<AcaoSST | null>(null);

  const {
    acoesFiltradas, alertas, estatisticas,
    isLoading, criarAcao, atualizarAcao, deletarAcao,
  } = useSST(filtroPrograma);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const abrirNovaAcao = () => { setAcaoParaEditar(undefined); setModalAberto(true); };
  const abrirEdicao   = (acao: AcaoSST) => { setAcaoParaEditar(acao); setModalAberto(true); };
  const fecharModal   = () => { setModalAberto(false); setAcaoParaEditar(undefined); };

  const handleFormSubmit = async (data: AcaoSSTForm) => {
    const payload = {
      ...data,
      vencimento: new Date(data.vencimento + 'T12:00:00').toISOString(),
    };

    if (acaoParaEditar) {
      await atualizarAcao.mutateAsync({ id: acaoParaEditar.id, ...payload });
    } else {
      await criarAcao.mutateAsync(payload as any);
    }
    fecharModal();
  };

  const handleExportar = () => {
    if (acoesFiltradas.length === 0) return;
    exportarParaExcel(
      acoesFiltradas.map((a) => ({
        Ação:          a.acao,
        Unidade:       a.unidade,
        Programa:      a.programa,
        Responsável:   a.responsaveis,
        Vencimento:    a.vencimento.split('T')[0],
        Realizado:     a.realizado ?? '',
        Status:        a.status,
        Observação:    a.observacao ?? '',
      })),
      `Plano_Acao_SST_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const isMutating = criarAcao.isPending || atualizarAcao.isPending;

  // ── Skeletons ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-10 w-72 bg-surface-hover/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ── CABEÇALHO ─────────────────────────────────────────────────────── */}
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
          <p className="text-text-secondary font-medium mt-2 opacity-90 ml-13 pl-[52px]">
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

      {/* ── ABAS ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-hover/50 p-1 rounded-xl border border-border/60 w-fit" role="tablist" aria-label="Seções de SST">
        {([
          { key: 'dashboard', label: 'Dashboard de Metas', icon: Target },
          { key: 'plano',     label: 'Plano de Ação',      icon: ShieldCheck },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={aba === key}
            aria-controls={`sst-tab-${key}`}
            onClick={() => setAba(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary/60',
              aba === key
                ? 'bg-surface text-text-main shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text-main'
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ABA: DASHBOARD ───────────────────────────────────────────────── */}
      {aba === 'dashboard' && (
        <div id="sst-tab-dashboard" role="tabpanel" aria-label="Dashboard de Metas" className="space-y-6">

          {/* Objetivos 2026 */}
          <div className="bg-surface border border-border/60 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-black text-text-main flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" aria-hidden="true" />
              Objetivos e Metas 2026
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Fortalecer a cultura de SST na KLIN.',
                'Controlar os riscos ocupacionais da KLIN.',
              ].map((obj, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-4">
                  <span className="text-primary font-black text-lg leading-none shrink-0">{i + 1}.</span>
                  <p className="text-sm font-bold text-text-main">{obj}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total de Ações"
              value={estatisticas.total}
              icon={ShieldCheck}
              colorClass="bg-primary/10 text-primary border-primary/20"
            />
            <KpiCard
              label="Realizadas"
              value={estatisticas.realizadas}
              icon={CheckCircle2}
              colorClass="bg-success/10 text-success border-success/20"
            />
            <KpiCard
              label="Pendentes"
              value={estatisticas.pendentes}
              icon={Clock}
              colorClass="bg-warning/10 text-warning border-warning/20"
            />
            <KpiCard
              label="Atrasadas"
              value={estatisticas.atrasadas}
              icon={XCircle}
              colorClass="bg-error/10 text-error border-error/20"
            />
          </div>

          {/* Progresso Global */}
          <div className="bg-surface border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-text-main flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
                Progresso Global do Plano de Ação
              </h3>
              <span className="text-2xl font-black text-primary">{estatisticas.progresso}%</span>
            </div>
            <ProgressBar value={estatisticas.progresso} />

            {/* Progresso por Programa */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {estatisticas.porPrograma.map(({ programa, total, realizadas, progresso }) => (
                <div key={programa} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={cn('text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border', PROGRAMA_CORES[programa])}>
                      {programa}
                    </span>
                    <span className="text-xs text-text-muted font-bold">{realizadas}/{total} · {progresso}%</span>
                  </div>
                  <ProgressBar value={progresso} />
                </div>
              ))}
            </div>
          </div>

          {/* Painel de Alertas */}
          <div className="space-y-3">
            <h3 className="font-black text-text-main flex items-center gap-2">
              <Bell className="w-4 h-4 text-error" aria-hidden="true" />
              Alertas de Vencimento
              {alertas.length > 0 && (
                <span className="text-xs font-black bg-error text-white px-2 py-0.5 rounded-full" aria-label={`${alertas.length} alertas ativos`}>
                  {alertas.length}
                </span>
              )}
            </h3>
            <PainelAlertas alertas={alertas as any} />
          </div>
        </div>
      )}

      {/* ── ABA: PLANO DE AÇÃO ────────────────────────────────────────────── */}
      {aba === 'plano' && (
        <div id="sst-tab-plano" role="tabpanel" aria-label="Plano de Ação" className="space-y-5">

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="w-full sm:w-72">
              <Select
                label="Filtrar por Programa"
                options={PROGRAMAS_FILTRO}
                value={filtroPrograma}
                onChange={(e) => setFiltroPrograma(e.target.value as ProgramaSST | '')}
                icon={<Filter className="w-4 h-4" />}
                containerClassName="!mb-0"
              />
            </div>
            {filtroPrograma && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltroPrograma('')}
                className="text-text-muted h-11"
              >
                Limpar filtro
              </Button>
            )}
          </div>

          {/* Tabela Desktop / Cards Mobile */}
          {acoesFiltradas.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nenhuma ação cadastrada"
              description="Comece cadastrando a primeira ação do Plano de SST."
              action={
                <Button onClick={abrirNovaAcao} icon={<Plus className="w-4 h-4" />}>
                  Cadastrar Primeira Ação
                </Button>
              }
            />
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="hidden lg:block rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Plano de Ação SST">
                    <thead>
                      <tr className="bg-surface-hover/60 border-b border-border/60">
                        {['Ação', 'Unid.', 'Programa', 'Responsável', 'Vencimento', 'Realizado', 'Status', 'Obs.', ''].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-text-muted whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {acoesFiltradas.map((acao) => {
                        const hoje = new Date(); hoje.setHours(0,0,0,0);
                        const venc = new Date(acao.vencimento);
                        const isVencida = venc < hoje && acao.status !== 'REALIZADO';
                        return (
                          <tr
                            key={acao.id}
                            className={cn(
                              'hover:bg-surface-hover/30 transition-colors group',
                              isVencida && 'bg-error/5'
                            )}
                          >
                            <td className="px-4 py-4 max-w-[220px]">
                              <p className="font-medium text-text-main text-xs leading-relaxed line-clamp-3" title={acao.acao}>{acao.acao}</p>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-text-muted whitespace-nowrap">{acao.unidade}</td>
                            <td className="px-4 py-4">
                              <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border', PROGRAMA_CORES[acao.programa])}>
                                {acao.programa}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs text-text-secondary font-medium whitespace-nowrap">{acao.responsaveis}</td>
                            <td className="px-4 py-4 text-xs font-mono font-bold text-text-main whitespace-nowrap">
                              {new Date(acao.vencimento).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-4 text-xs text-text-muted">{acao.realizado || '—'}</td>
                            <td className="px-4 py-4">
                              <Badge variant={STATUS_CONFIG[acao.status].variant}>
                                {STATUS_CONFIG[acao.status].label}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 max-w-[140px]">
                              <p className="text-xs text-text-muted line-clamp-2" title={acao.observacao ?? ''}>{acao.observacao || '—'}</p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Editar ação: ${acao.acao}`}
                                  onClick={() => abrirEdicao(acao)}
                                  className="h-8 w-8 text-text-muted hover:text-primary hover:bg-primary/10"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Excluir ação: ${acao.acao}`}
                                  onClick={() => setAcaoParaExcluir(acao)}
                                  className="h-8 w-8 text-text-muted hover:text-error hover:bg-error/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="lg:hidden space-y-3">
                {acoesFiltradas.map((acao) => (
                  <div
                    key={acao.id}
                    className="bg-surface border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', PROGRAMA_CORES[acao.programa])}>
                          {acao.programa}
                        </span>
                        <Badge variant={STATUS_CONFIG[acao.status].variant}>
                          {STATUS_CONFIG[acao.status].label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Editar: ${acao.acao}`} onClick={() => abrirEdicao(acao)} className="h-8 w-8 text-text-muted hover:text-primary">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Excluir: ${acao.acao}`} onClick={() => setAcaoParaExcluir(acao)} className="h-8 w-8 text-text-muted hover:text-error">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-text-main leading-relaxed">{acao.acao}</p>

                    <div className="grid grid-cols-2 gap-3 bg-surface-hover/40 rounded-xl p-3 border border-border/40 text-xs">
                      <div>
                        <span className="text-text-muted font-bold uppercase tracking-wider block text-[9px] mb-0.5">Responsável</span>
                        <span className="text-text-main font-bold">{acao.responsaveis}</span>
                      </div>
                      <div>
                        <span className="text-text-muted font-bold uppercase tracking-wider block text-[9px] mb-0.5">Vencimento</span>
                        <span className="text-text-main font-mono font-bold">{new Date(acao.vencimento).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {acao.realizado && (
                        <div className="col-span-2">
                          <span className="text-text-muted font-bold uppercase tracking-wider block text-[9px] mb-0.5">Realizado</span>
                          <span className="text-text-main font-medium">{acao.realizado}</span>
                        </div>
                      )}
                    </div>
                    {acao.observacao && (
                      <p className="text-xs text-text-muted italic border-t border-border/40 pt-3">{acao.observacao}</p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-text-muted text-right font-medium">{acoesFiltradas.length} ação(ões) exibida(s)</p>
            </>
          )}
        </div>
      )}

      {/* ── MODAL FORMULÁRIO ──────────────────────────────────────────────── */}
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

      {/* ── MODAL EXCLUSÃO ────────────────────────────────────────────────── */}
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
