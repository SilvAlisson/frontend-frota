import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ShieldAlert, Bug, Activity, Terminal, CheckCircle2, 
  Search, Filter, Clock, AlertTriangle, ShieldCheck,
  ServerCrash, Fingerprint, Truck, Camera, ExternalLink 
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { EmptyState } from './ui/EmptyState';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FRAUD_ATTEMPT';
  acao: string;
  detalhes?: string;
  contexto?: any;
  usuario?: { nome: string; role: string };
  veiculo?: string;
  resolvido: boolean;
  dataCriacao: string;
}

export function GestaoAuditoria() {
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('PENDENTES');

  const { data: logs = [], isLoading, refetch } = useQuery<SystemLog[]>({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const { data } = await api.get('/logs');
      return data;
    },
    refetchInterval: 15000 
  });

  const resolverLog = async (id: string) => {
    try {
      await api.put(`/logs/${id}/resolver`);
      toast.success('Registo arquivado com sucesso.');
      refetch();
    } catch (error) {
      toast.error('Erro ao arquivar o log.');
    }
  };

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

  const getNivelConfig = (nivel: string) => {
    switch (nivel) {
      case 'CRITICAL': return { bg: 'bg-error/10', border: 'border-error/20', text: 'text-error', label: 'CRÍTICO', icon: ServerCrash };
      case 'FRAUD_ATTEMPT': return { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600', label: 'FRAUDE', icon: ShieldAlert };
      case 'ERROR': return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600', label: 'ERRO', icon: Bug };
      case 'WARNING': return { bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning', label: 'AVISO', icon: AlertTriangle };
      default: return { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', label: 'INFO', icon: Activity };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Detalhes copiados para a área de transferência.');
  };

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
            <EmptyState icon={CheckCircle2} title="Nenhum registo encontrado" description="O filtro atual não retornou nenhum evento no log do sistema." />
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {logsFiltrados.map(log => {
              const conf = getNivelConfig(log.nivel);
              const LogIcon = conf.icon;

              return (
                <div key={log.id} className={`group p-5 sm:p-6 transition-all hover:bg-surface-hover/40 flex flex-col lg:flex-row lg:items-start justify-between gap-6 ${!log.resolvido && log.nivel === 'CRITICAL' ? 'bg-error/5 hover:bg-error/10' : ''}`}>
                  
                  {/* Bloco de Informação Principal */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                     <div className={`mt-0.5 p-3 rounded-xl shadow-inner border ${conf.bg} ${conf.border} shrink-0`}>
                        <LogIcon className={`w-5 h-5 ${conf.text}`} />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex flex-wrap items-center gap-2 mb-2">
                         <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md border ${conf.bg} ${conf.text} ${conf.border}`}>
                           {conf.label}
                         </span>
                         <span className="text-[10px] font-mono text-text-secondary flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {format(new Date(log.dataCriacao), "dd MMM yyyy, HH:mm:ss", { locale: ptBR })}
                         </span>
                         {log.contexto?._navigator?.userAgent && (
                           <span className="text-[9px] px-1.5 py-0.5 bg-surface-hover border border-border/50 rounded text-text-muted truncate max-w-[120px]" title={log.contexto._navigator.userAgent}>
                             🌐 {log.contexto._navigator.userAgent.split(' ')[0]}
                           </span>
                         )}
                         {log.contexto?._url && (
                           <span className="text-[9px] text-primary/70 truncate max-w-[150px]">
                             📍 {log.contexto._url.replace(/^.*\/\/[^\/]+/, '')}
                           </span>
                         )}
                       </div>
                       
                       <h4 className="font-bold text-base text-text-main mb-3 tracking-tight">
                         {log.acao.replace(/_/g, ' ')}
                       </h4>

                       {/*  TRADUTOR DE CONTEXTO PARA LEIGOS */}
                       {log.contexto && typeof log.contexto === 'object' && Object.keys(log.contexto).length > 0 && (
                         <div className="flex flex-wrap gap-2 mb-3">
                           {Object.entries(log.contexto).map(([key, value]) => {
                             // Esconde IDs longos do banco de dados e IP
                             if (key.toLowerCase().includes('id') || key.startsWith('_')) return null;
                             if (!value) return null;

                             // Se for URL de foto, vira botão!
                             if (typeof value === 'string' && value.startsWith('http')) {
                               return (
                                 <a key={key} href={value} target="_blank" rel="noreferrer" 
                                    className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/20 hover:scale-105 transition-all">
                                   <Camera className="w-3.5 h-3.5" /> 
                                   Ver Foto de Evidência <ExternalLink className="w-3 h-3 opacity-50" />
                                 </a>
                               );
                             }

                             // Etiquetas para KM e afins
                             const labelAmigavel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                             return (
                               <span key={key} className="text-[10px] bg-surface-hover border border-border/50 text-text-secondary px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                 <strong className="text-text-main">{labelAmigavel}:</strong> 
                                 {String(value)}
                               </span>
                             );
                           })}
                         </div>
                       )}
                       
                       {/* Bloco de Código/Detalhe Estilo Terminal */}
                       {log.detalhes && (
                         <div className="mt-3 bg-[#0D1117] border border-gray-800 rounded-xl p-3 relative overflow-hidden group-hover:border-gray-700 transition-colors group/terminal">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-700" />
                            <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed ml-2 max-h-40 overflow-y-auto custom-scrollbar">
                              <span className="text-primary/70 select-none">{'> '}</span>{log.detalhes}
                            </p>
                            <button 
                               onClick={() => copyToClipboard(log.detalhes || '')}
                               className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg opacity-0 group-hover/terminal:opacity-100 transition-opacity"
                               title="Copiar Log"
                            >
                               <Terminal className="w-3.5 h-3.5" />
                            </button>
                         </div>
                       )}

                       {/* Atores e Veículos */}
                       <div className="flex flex-wrap items-center gap-4 mt-4">
                         {log.usuario && (
                           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-text-secondary tracking-widest">
                             <Fingerprint className="w-3.5 h-3.5 opacity-60" />
                             Ator: <span className="text-text-main">{log.usuario.nome}</span> 
                             <span className="bg-surface-hover px-1.5 py-0.5 rounded border border-border/50">{log.usuario.role}</span>
                           </div>
                         )}
                         
                         {log.veiculo && (
                           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-text-secondary tracking-widest">
                             <Truck className="w-3.5 h-3.5 opacity-60 text-primary" />
                             Placa: <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{log.veiculo}</span>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>

                  {/* Ação Lateral */}
                  <div className="flex lg:flex-col items-center justify-end gap-3 shrink-0">
                     {!log.resolvido ? (
                       <Button 
                         variant={['CRITICAL', 'ERROR'].includes(log.nivel) ? 'danger' : 'outline'} 
                         size="sm" 
                         onClick={() => resolverLog(log.id)}
                         className={`w-full lg:w-36 text-[10px] uppercase tracking-widest font-black shadow-sm ${!['CRITICAL', 'ERROR'].includes(log.nivel) ? 'text-text-muted hover:text-success hover:border-success/30 hover:bg-success/10' : ''}`}
                       >
                         Arquivar Evento
                       </Button>
                     ) : (
                       <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted/60 bg-surface-hover px-3 py-1.5 rounded-lg border border-border/30 w-full lg:w-auto justify-center cursor-default">
                         <CheckCircle2 className="w-3.5 h-3.5" /> Arquivado
                       </div>
                     )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}