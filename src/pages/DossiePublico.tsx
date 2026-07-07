import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShieldCheck, AlertTriangle, Calendar, FileSpreadsheet, CheckCircle2, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Tipagem baseada no que a API vai nos devolver
interface TreinamentoPublico {
  id: string;
  nome: string;
  dataRealizacao: string;
  dataVencimento: string | null;
  comprovanteUrl: string | null;
}

interface IntegrantePublico {
  nome: string;
  role: string;
  matricula: string | null;
  fotoUrl: string | null;
  treinamentos: TreinamentoPublico[];
}

interface StatusConfig {
  indicatorBg: string;
  badgeBg: string;
  textColor: string;
  border: string;
  Icon: LucideIcon;
  label: string;
}

function getStatusInfo(vencimento: string | null): StatusConfig {
  if (!vencimento) {
      return {
          indicatorBg: 'bg-info',
          badgeBg: 'bg-info/10',
          textColor: 'text-info',
          border: 'border-info/20',
          Icon: CheckCircle2,
          label: 'Vitalício',
      };
  }

  const [year, month, day] = vencimento.split('T')[0].split('-').map(Number);
  const vencUTC = Date.UTC(year, month - 1, day);
  const now = new Date();
  const hojeUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDias = Math.ceil((vencUTC - hojeUTC) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
      return {
          indicatorBg: 'bg-error',
          badgeBg: 'bg-error/10',
          textColor: 'text-error',
          border: 'border-error/20',
          Icon: AlertTriangle,
          label: 'Vencido',
      };
  }
  if (diffDias < 30) {
      return {
          indicatorBg: 'bg-warning-500',
          badgeBg: 'bg-warning-500/10',
          textColor: 'text-warning-600',
          border: 'border-warning-500/20',
          Icon: AlertTriangle,
          label: 'Expira Brevemente',
      };
  }
  return {
      indicatorBg: 'bg-success',
      badgeBg: 'bg-success/10',
      textColor: 'text-success',
      border: 'border-success/20',
      Icon: CheckCircle2,
      label: 'Válido',
  };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function DossiePublico() {
  const { id } = useParams<{ id: string }>();

  const { data: integrante, isLoading, isError } = useQuery<IntegrantePublico>({
    queryKey: ['dossie', id],
    queryFn: async () => {
      const { data } = await api.get(`/treinamentos/dossie/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min de cache para evitar requisições repetidas se a pessoa fechar/abrir o QR Code
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-12 font-sans selection:bg-primary/30">
        <header className="bg-surface border-b border-border/60 p-6 flex flex-col items-center justify-center sticky top-0 z-40 shadow-sm">
           <div className="h-8 w-32 bg-surface-hover animate-pulse rounded-lg mb-1" />
           <div className="h-3 w-40 bg-surface-hover animate-pulse rounded" />
        </header>
        <main className="max-w-md mx-auto px-4 pt-8">
          <div className="bg-surface rounded-[2rem] p-6 sm:p-8 shadow-lg border border-border/60 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-surface-hover animate-pulse"></div>
            <div className="w-24 h-24 rounded-3xl bg-background border-4 border-background shadow-md z-10 overflow-hidden mb-4 animate-pulse" />
            <div className="h-6 w-3/4 bg-surface-hover animate-pulse rounded-lg mb-3" />
            <div className="flex gap-2">
               <div className="h-6 w-24 bg-surface-hover animate-pulse rounded-lg" />
               <div className="h-6 w-20 bg-surface-hover animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="h-4 w-48 bg-surface-hover animate-pulse rounded mt-10 mb-4 ml-2" />
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-surface rounded-3xl p-5 border border-border/60 h-32 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (isError || !integrante) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6 border-2 border-error/20 shadow-inner">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2">Dossiê Indisponível</h1>
        <p className="text-text-muted max-w-sm">Não foi possível localizar os registros oficiais deste integrante. O QRCode pode ser inválido ou o integrante inativado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12 font-sans selection:bg-primary/30">
      {/* HEADER CORPORATIVO DA KLIN */}
      <header className="bg-surface border-b border-border/60 p-6 flex flex-col items-center justify-center sticky top-0 z-40 shadow-sm">
         <span className="font-header font-black text-2xl text-text-main tracking-tight uppercase"> Treinamentos <span className="text-primary">KLIN</span></span>
         <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
           <ShieldCheck className="w-3.5 h-3.5 text-success" /> Acompanhamento de Treinamentos
         </p>
      </header>

      <main className="max-w-md mx-auto px-4 pt-8 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* PERFIL DO INTEGRANTE */}
        <div className="bg-surface rounded-[2rem] p-6 sm:p-8 shadow-lg border border-border/60 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-primary/10"></div>
          
          <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-background flex items-center justify-center text-primary font-black text-4xl shadow-md z-10 overflow-hidden mb-4 relative">
             {integrante.fotoUrl ? (
               <img src={integrante.fotoUrl} alt={integrante.nome} className="w-full h-full object-cover" />
             ) : (
               integrante.nome.charAt(0).toUpperCase()
             )}
          </div>
          
          <h1 className="text-2xl font-black text-text-main tracking-tight leading-tight">{integrante.nome}</h1>
          <div className="flex items-center gap-2 mt-3">
             <span className="bg-surface-hover px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-border/60 text-text-secondary shadow-sm">{integrante.role}</span>
             {integrante.matricula && (
               <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-primary/5 text-primary border border-primary/20">MAT: {integrante.matricula}</span>
             )}
          </div>
        </div>

        {/* LISTAGEM DE CERTIFICADOS */}
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mt-10 mb-4 pl-2 flex items-center gap-2">
          <GraduationCap className="w-4 h-4" /> Conformidade & Treinamentos
        </h2>

        {integrante.treinamentos.length === 0 ? (
           <div className="bg-surface border border-dashed border-border/60 rounded-3xl p-8 text-center shadow-sm">
             <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Nenhum certificado atrelado a este integrante.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {integrante.treinamentos.map(treino => {
              const status = getStatusInfo(treino.dataVencimento);
              const StatusIcon = status.Icon;

              return (
                <div key={treino.id} className="bg-surface rounded-3xl p-5 border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-4 group hover:shadow-md transition-all">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.indicatorBg}`}></div>
                  
                  <div className="pl-2">
                    <h3 className="font-black text-text-main text-lg leading-tight mb-3 group-hover:text-primary transition-colors">{treino.nome}</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md text-[10px] text-text-secondary font-bold uppercase tracking-widest border border-border/60">
                          <Calendar className="w-3 h-3" /> Emitido: {formatDate(treino.dataRealizacao)}
                      </span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${status.badgeBg} ${status.textColor} ${status.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                      </span>
                    </div>
                  </div>

                  {treino.comprovanteUrl && (
                    <a 
                      href={treino.comprovanteUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 w-full bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-xl p-3 text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Visualizar Documento
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}