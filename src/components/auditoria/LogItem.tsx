import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  ShieldAlert, Bug, Activity, Terminal, CheckCircle2, 
  Clock, AlertTriangle, ServerCrash, Fingerprint, Truck, Camera, ExternalLink 
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { SystemLog } from '../../hooks/useAuditoria';

interface LogItemProps {
  log: SystemLog;
  onArquivar: (id: string) => void;
  isArquivando: boolean;
}

const getNivelConfig = (nivel: string) => {
  switch (nivel) {
    case 'CRITICAL': return { bg: 'bg-error/10', border: 'border-error/20', text: 'text-error', label: 'CRÍTICO', icon: ServerCrash };
    case 'FRAUD_ATTEMPT': return { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600', label: 'FRAUDE', icon: ShieldAlert };
    case 'ERROR': return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600', label: 'ERRO', icon: Bug };
    case 'WARNING': return { bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning', label: 'AVISO', icon: AlertTriangle };
    default: return { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', label: 'INFO', icon: Activity };
  }
};

export function LogItem({ log, onArquivar, isArquivando }: LogItemProps) {
  const conf = getNivelConfig(log.nivel);
  const LogIcon = conf.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Detalhes copiados para a área de transferência.');
  };

  return (
    <div className={`group p-5 sm:p-6 transition-all hover:bg-surface-hover/40 flex flex-col lg:flex-row lg:items-start justify-between gap-6 ${!log.resolvido && log.nivel === 'CRITICAL' ? 'bg-error/5 hover:bg-error/10' : ''}`}>
      
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
              
              {log.usuario && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 flex items-center gap-1.5 font-bold shadow-sm">
                  <Fingerprint className="w-3 h-3" />
                  {log.usuario.nome.split(' ')[0]} <span className="opacity-70 font-normal">({log.usuario.role})</span>
                </span>
              )}

              {!!log.contexto?._auditIp && (
                <span className="text-[9px] font-mono bg-surface-hover px-1.5 py-0.5 border border-border/50 rounded text-text-muted truncate">
                  🌐 {String(log.contexto._auditIp)}
                </span>
              )}

              {!!(log.contexto?._navigator && typeof log.contexto._navigator === 'object' && log.contexto._navigator !== null && (log.contexto._navigator as Record<string, unknown>).userAgent) && (
                <span className="text-[9px] px-1.5 py-0.5 bg-surface-hover border border-border/50 rounded text-text-muted truncate max-w-[120px]" title={String((log.contexto._navigator as Record<string, unknown>).userAgent)}>
                  📱 {String((log.contexto._navigator as Record<string, unknown>).userAgent).split(' ')[0]}
                </span>
              )}
              {!!log.contexto?._url && (
                <span className="text-[9px] text-primary/70 truncate max-w-[150px]">
                  📍 {String(log.contexto._url).replace(/^.*\/\/[^\/]+/, '')}
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
              <div className="mt-3 bg-surface-hover/80 border border-border/60 rounded-xl p-3 relative overflow-hidden group-hover:border-primary/50 transition-colors group/terminal">
                <div className="absolute top-0 left-0 w-1 h-full bg-border" />
                <p className="text-xs text-text-muted font-mono whitespace-pre-wrap break-words leading-relaxed ml-2 max-h-40 overflow-y-auto scrollbar-thin">
                  <span className="text-primary/70 select-none">{'> '}</span>{log.detalhes}
                </p>
                <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(log.detalhes || '')}
                    className="absolute top-2 right-2 w-7 h-7 min-w-[28px] min-h-[28px] opacity-0 group-hover/terminal:opacity-100 transition-opacity border border-border/30 shadow-sm"
                    title="Copiar Log"
                >
                    <Terminal className="w-3.5 h-3.5" />
                </Button>
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
              onClick={() => onArquivar(log.id)}
              disabled={isArquivando}
              isLoading={isArquivando}
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
}
