import { AlertTriangle, ShieldAlert, FileWarning, Activity, AlertOctagon } from 'lucide-react';
import { useMatrizQualificacao } from '../../hooks/useMatrizQualificacao';
import { useState } from 'react';
import clsx from 'clsx';

export function DashboardCompliance() {
  const { data: matriz, isLoading } = useMatrizQualificacao();
  const [filtroExpandido, setFiltroExpandido] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 bg-surface border border-border/60 rounded-2xl animate-pulse">
        <div className="w-6 h-6 rounded-full bg-border/40" />
        <div className="h-4 bg-border/40 rounded w-48" />
      </div>
    );
  }

  if (!matriz || matriz.length === 0) return null;

  // Extrair alertas
  const alertas: { tipo: string; titulo: string; cor: string; icone: React.ElementType; integrantes: { nome: string; detalhe: string }[] }[] = [
    { tipo: 'CNH_CRITICA', titulo: 'CNHs Críticas', cor: 'red', icone: FileWarning, integrantes: [] },
    { tipo: 'ASO_CRITICO', titulo: 'ASOs Críticos', cor: 'orange', icone: Activity, integrantes: [] },
    { tipo: 'FIT_TEST_CRITICO', titulo: 'Fit Tests Críticos', cor: 'purple', icone: ShieldAlert, integrantes: [] },
    { tipo: 'TREINAMENTOS_CRITICOS', titulo: 'Treinamentos Pendentes', cor: 'yellow', icone: AlertTriangle, integrantes: [] },
  ];

  matriz.forEach(user => {
    user.exigencias.forEach(exig => {
      if (exig.status === 'VENCIDO' || exig.status === 'VENCENDO' || exig.status === 'FALTANTE') {
        const detalhe = `${exig.nome} (${exig.status})`;

        if (exig.tipo === 'CNH') {
          alertas[0].integrantes.push({ nome: user.nome, detalhe });
        } else if (exig.tipo === 'ASO') {
          alertas[1].integrantes.push({ nome: user.nome, detalhe });
        } else if (exig.tipo === 'FIT_TEST') {
          alertas[2].integrantes.push({ nome: user.nome, detalhe });
        } else {
          alertas[3].integrantes.push({ nome: user.nome, detalhe });
        }
      }
    });
  });

  // Filtrar apenas alertas que têm integrantes
  const alertasAtivos = alertas.filter(a => a.integrantes.length > 0);

  if (alertasAtivos.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-6 flex items-center gap-4">
        <div className="p-3 bg-green-500/20 rounded-full">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">Compliance em 100%</h3>
          <p className="text-sm font-medium opacity-80">Nenhum treinamento, ASO ou CNH próximo do vencimento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <AlertOctagon className="w-6 h-6 text-danger animate-pulse" />
        <h3 className="text-xl font-black text-text-main tracking-tight">Risco & Compliance</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertasAtivos.map(alerta => {
          const Icon = alerta.icone;
          const isActive = filtroExpandido === alerta.tipo;

          return (
            <div 
              key={alerta.tipo}
              onClick={() => setFiltroExpandido(isActive ? null : alerta.tipo)}
              className={clsx(
                "cursor-pointer transition-all duration-300 rounded-2xl p-5 border relative overflow-hidden group",
                isActive ? "ring-2 ring-offset-2 ring-offset-background" : "hover:-translate-y-1 hover:shadow-lg",
                alerta.cor === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-500 ring-red-500' :
                alerta.cor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 ring-orange-500' :
                alerta.cor === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500 ring-purple-500' :
                'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 ring-yellow-500'
              )}
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h4 className="text-3xl font-black">{alerta.integrantes.length}</h4>
                  <p className="text-sm font-bold mt-1 opacity-80">{alerta.titulo}</p>
                </div>
                <div className={clsx("p-3 rounded-full", `bg-${alerta.cor}-500/20`)}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              {isActive && (
                <div className="mt-4 pt-4 border-t border-current/20 space-y-2 relative z-10 max-h-48 overflow-y-auto custom-scrollbar">
                  {alerta.integrantes.map((int, i) => (
                    <div key={i} className="flex flex-col text-sm bg-background/50 rounded p-2">
                      <span className="font-bold truncate">{int.nome}</span>
                      <span className="opacity-80 text-xs truncate">{int.detalhe}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
