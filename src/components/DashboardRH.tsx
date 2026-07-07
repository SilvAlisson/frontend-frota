import type { User } from '../types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, GraduationCap, FileWarning } from 'lucide-react';
import { RelatorioNarrativoRH } from './ia/RelatorioNarrativoRH';
import { useDashboardRH } from '../hooks/useDashboardRH';
import { Select } from './ui/Select';
import { KpiCard } from './ui/KpiCard';
import { GraficoSST } from './rh/GraficoSST';
import { GraficoCargos } from './rh/GraficoCargos';
import { DashboardCompliance } from './rh/DashboardCompliance';
import { RadarSSMA } from './rh/RadarSSMA';
import { Callout } from './ui/Callout';
import { Tabs } from './ui/Tabs';
import type { TabItem } from './ui/Tabs';

interface DashboardRHProps {
  user: User;
}

export function DashboardRH({ user }: DashboardRHProps) {
  const [abaAtiva, setAbaAtiva] = useState<'kpis' | 'radar'>('kpis');
  const [diasFiltro, setDiasFiltro] = useState<number>(30);
  const { data: dashboardData, isLoading, isError } = useDashboardRH(diasFiltro);

  const formatNum = (val: number | undefined) => (val ?? 0).toLocaleString('pt-BR');

  const tabs: TabItem[] = [
    { id: 'kpis', label: 'Visão Geral & KPIs', icon: Users },
    { id: 'radar', label: 'Radar SSMA', icon: FileWarning },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">

      {/* HEADER DE BOAS VINDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-text-main tracking-tight">
            Olá, {user.nome.split(' ')[0]}!
          </h2>
          <p className="text-sm text-text-secondary">
            Visão geral de Recursos Humanos, SST e Compliance.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={diasFiltro}
            onChange={(e) => setDiasFiltro(Number(e.target.value))}
            options={[
              { value: 30, label: 'Próximos 30 dias' },
              { value: 60, label: 'Próximos 60 dias' },
              { value: 90, label: 'Próximos 90 dias' },
              { value: 180, label: 'Próximos 180 dias' },
            ]}
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={abaAtiva} onChange={(id) => setAbaAtiva(id as any)} />

      {isError && (
        <Callout
          variant="danger"
          title="Erro ao carregar dados"
          className="mb-6"
        >
          Não foi possível conectar com o servidor para buscar os indicadores. Os dados exibidos podem estar desatualizados ou incorretos.
        </Callout>
      )}

      {abaAtiva === 'radar' ? (
        <RadarSSMA />
      ) : (
        <>
          {isLoading ? (
            <div className="text-text-muted text-center py-8">Carregando...</div>
          ) : (
            <>
              {/* KPI GRID PREMIUM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <Link to="/admin/integrantes">
                  <KpiCard
                    titulo="Integrantes Ativos"
                    valorRaw={dashboardData?.kpis.totalIntegrantes}
                    formatter={formatNum}
                    descricao="Total da força de trabalho"
                    loading={isLoading}
                    variant="success"
                    icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="hover:scale-[1.02] transition-transform"
                  />
                </Link>
                <Link to="/admin/integrantes?alerta=treinamento">
                  <KpiCard
                    titulo="Treinamentos Críticos"
                    valorRaw={dashboardData?.kpis.treinamentosCriticos}
                    formatter={formatNum}
                    descricao={`Vencendo nos próximos ${diasFiltro} dias`}
                    loading={isLoading}
                    variant={(dashboardData?.kpis.treinamentosCriticos || 0) > 0 ? 'warning' : 'success'}
                    icon={<GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="hover:scale-[1.02] transition-transform"
                  />
                </Link>
                <Link to="/admin/integrantes?alerta=cnh">
                  <KpiCard
                    titulo="CNHs a Vencer"
                    valorRaw={dashboardData?.kpis.cnhsCriticas}
                    formatter={formatNum}
                    descricao={`Motoristas com CNH crítica (<${diasFiltro}d)`}
                    loading={isLoading}
                    variant={(dashboardData?.kpis.cnhsCriticas || 0) > 0 ? 'warning' : 'success'}
                    icon={<FileWarning className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="hover:scale-[1.02] transition-transform"
                  />
                </Link>
                <Link to="/admin/integrantes?alerta=sst">
                  <KpiCard
                    titulo="Ações SST Pendentes"
                    valorRaw={dashboardData?.kpis.sstPendentes}
                    formatter={formatNum}
                    descricao="Ações atrasadas ou pendentes"
                    loading={isLoading}
                    variant={(dashboardData?.kpis.sstPendentes || 0) > 0 ? 'danger' : 'success'}
                    icon={<ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="hover:scale-[1.02] transition-transform"
                  />
                </Link>
              </div>

              {/* DASHBOARD DE RISCO E COMPLIANCE */}
              <DashboardCompliance />

              {/* GRÁFICOS ANALÍTICOS & RELATÓRIO IA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-5 sm:p-6 lg:p-8 relative flex flex-col group h-full">
                  <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10 shrink-0">
                    <div>
                      <h4 className="font-header text-base sm:text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Panorama de SST
                      </h4>
                    </div>
                  </div>
                  <div className="relative z-10 w-full flex-1 flex flex-col justify-center min-h-[220px]">
                    <GraficoSST dados={dashboardData?.graficos.panoramaSST || []} />
                  </div>
                </div>

                <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-5 sm:p-6 lg:p-8 relative flex flex-col group h-full">
                  <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10 shrink-0">
                    <div>
                      <h4 className="font-header text-base sm:text-lg font-black text-text-main tracking-tight flex items-center gap-2">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Distribuição de Cargos
                      </h4>
                    </div>
                  </div>
                  <div className="relative z-10 w-full flex-1 flex flex-col justify-center min-h-[220px]">
                    <GraficoCargos dados={dashboardData?.graficos.distribuicaoCargos || []} />
                  </div>
                </div>

                <div className="h-full">
                  <RelatorioNarrativoRH />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
