import { useState, useMemo } from 'react';
import { 
  Activity, Terminal, CheckCircle2, 
  Search, Filter, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';

// Hook de Domínio
import { useAuditoria } from '../hooks/useAuditoria';

// Subcomponente de Log
import { LogItem } from './auditoria/LogItem';

export function GestaoAuditoria() {
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('PENDENTES');

  const {
    logs,
    isLoading,
    arquivarLog,
    arquivandoId,
    arquivarTodos,
    isArquivandoTodos
  } = useAuditoria();

  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      const matchBusca = busca === '' || 
        log.acao.toLowerCase().includes(busca.toLowerCase()) ||
        log.detalhes?.toLowerCase().includes(busca.toLowerCase()) ||
        log.usuario?.nome.toLowerCase().includes(busca.toLowerCase()) ||
        log.veiculo?.toLowerCase().includes(busca.toLowerCase()); // Permite buscar por placa
        
      const matchNivel = filtroNivel === 'TODOS' || 
        (filtroNivel === 'CRITICAL_ERROR' ? ['CRITICAL', 'ERROR'].includes(log.nivel) : log.nivel === filtroNivel);
        
      const matchStatus = filtroStatus === 'TODOS' || 
        (filtroStatus === 'PENDENTES' ? !log.resolvido : log.resolvido);

      return matchBusca && matchNivel && matchStatus;
    });
  }, [logs, busca, filtroNivel, filtroStatus]);

  const totalCriticosPendentes = logs.filter(l => !l.resolvido && ['CRITICAL', 'ERROR'].includes(l.nivel)).length;
  const taxaResolucao = logs.length ? Math.round((logs.filter(l => l.resolvido).length / logs.length) * 100) : 100;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* ─── HEADER & KPIs (HUD Tático) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-xl bg-surface border border-border/60 shadow-sm">
               <Terminal className="w-6 h-6 text-primary" />
            </div>
            Central de Auditoria
          </h2>
          <p className="text-sm font-medium text-text-secondary mt-2 leading-relaxed">
            Monitoramento em tempo real de acessos, falhas de sistema e tentativas de fraude na frota KLIN.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-3 gap-3 sm:gap-4">
           <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Eventos Totais</span>
              <span className="text-2xl font-black text-text-main font-mono">{logs.length}</span>
           </div>
           <div className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between transition-colors ${totalCriticosPendentes > 0 ? 'bg-error/10 border-error/30' : 'bg-surface border-border/60'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${totalCriticosPendentes > 0 ? 'text-error' : 'text-text-muted'}`}><ShieldAlert className="w-3.5 h-3.5" /> Ação Exigida</span>
              <span className={`text-2xl font-black font-mono ${totalCriticosPendentes > 0 ? 'text-error' : 'text-text-main'}`}>{totalCriticosPendentes}</span>
           </div>
           <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Saúde Geral</span>
              <span className="text-2xl font-black text-success font-mono">{taxaResolucao}%</span>
           </div>
        </div>
      </div>

      {/* ─── TOOLBAR DE FILTROS ─── */}
      <div className="bg-surface p-4 rounded-3xl border border-border/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
         <div className="flex-1 w-full relative">
           <Input 
             placeholder="Pesquisar por erro, operador, matrícula ou módulo..." 
             value={busca} onChange={(e) => setBusca(e.target.value)}
             icon={<Search className="w-4 h-4 text-text-muted" />}
             containerClassName="!mb-0" className="border-none bg-surface-hover/50 shadow-inner"
           />
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select 
              value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}
              options={[
                { value: 'TODOS', label: 'Todas as Gravidades' },
                { value: 'CRITICAL_ERROR', label: 'Apenas Críticos & Erros' },
                { value: 'WARNING', label: 'Avisos' },
                { value: 'INFO', label: 'Informativos' }
              ]}
              icon={<Filter className="w-4 h-4" />} containerClassName="!mb-0 w-full sm:w-48"
              className="border-none bg-surface-hover/50 text-xs font-bold"
            />
            <Select 
              value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
              options={[
                { value: 'TODOS', label: 'Qualquer Status' },
                { value: 'PENDENTES', label: 'Pendentes' },
                { value: 'RESOLVIDOS', label: 'Arquivados' }
              ]}
              containerClassName="!mb-0 w-full sm:w-40"
              className="border-none bg-surface-hover/50 text-xs font-bold"
            />
            {totalCriticosPendentes > 0 && (
              <Button 
                variant="outline"
                className="text-xs h-[38px] border-border/60 hover:bg-success/10 hover:text-success transition-colors font-bold whitespace-nowrap px-3"
                onClick={() => arquivarTodos()}
                disabled={isArquivandoTodos}
                icon={isArquivandoTodos ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                Limpar Auditoria
              </Button>
            )}
         </div>
      </div>

      {/* ─── LOG VIEWER LIST ─── */}
      <div className="bg-surface border border-border/60 rounded-[2rem] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-text-muted animate-pulse">
             <Terminal className="w-10 h-10 mb-4 opacity-50" />
             <span className="font-mono font-bold tracking-widest uppercase text-xs">Conectando ao Syslog...</span>
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center p-12">
            <EmptyState icon={CheckCircle2} title="Nenhum registro encontrado" description="O filtro atual não retornou nenhum evento no log do sistema." />
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {logsFiltrados.map(log => (
              <LogItem 
                key={log.id} 
                log={log} 
                onArquivar={arquivarLog}
                isArquivando={arquivandoId === log.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
