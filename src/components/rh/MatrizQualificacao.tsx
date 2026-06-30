import { useMatrizQualificacao, type Exigencia } from '../../hooks/useMatrizQualificacao';
import { Search, AlertCircle, CheckCircle2, XCircle, ChevronRight, FileCheck, ShieldAlert, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { FormCadastrarUsuario } from '../forms/FormCadastrarUsuario';
import { SmartFAB } from '../ui/SmartFAB';

// Tipos de Status Global
type GlobalStatus = 'CRITICO' | 'ATENCAO' | 'CONFORME';

export function MatrizQualificacao() {
  const { data: matriz, isLoading, refetch } = useMatrizQualificacao();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<GlobalStatus | 'TODOS'>('TODOS');
  const [isCadastroOpen, setIsCadastroOpen] = useState(false); // ✨ NOVO: Estado de Cadastro
  const navigate = useNavigate();

  // 🧠 LÓGICA INTELIGENTE: Processamento, Saúde e Ordenação
  const integrantesProcessados = useMemo(() => {
    if (!matriz) return [];

    return matriz.map(user => {
      const total = user.exigencias.length;
      const validos = user.exigencias.filter(e => e.status === 'VÁLIDO').length;
      const saudePercentual = total > 0 ? Math.round((validos / total) * 100) : 0;

      let statusGlobal: GlobalStatus = 'CONFORME';
      if (user.exigencias.some(e => e.status === 'VENCIDO' || e.status === 'FALTANTE')) {
        statusGlobal = 'CRITICO';
      } else if (user.exigencias.some(e => e.status === 'VENCENDO')) {
        statusGlobal = 'ATENCAO';
      }

      const exigenciasOrdenadas = [...user.exigencias].sort((a, b) => {
        const peso = { 'FALTANTE': 3, 'VENCIDO': 3, 'VENCENDO': 2, 'VÁLIDO': 1 };
        return peso[b.status] - peso[a.status];
      });

      return { ...user, statusGlobal, saudePercentual, exigenciasOrdenadas, validos, total };
    })
    .filter(u => {
      const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase()) || u.cargo.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'TODOS' || u.statusGlobal === filtroStatus;
      return matchBusca && matchStatus;
    })
    .sort((a, b) => {
      const pesoGlobal = { 'CRITICO': 3, 'ATENCAO': 2, 'CONFORME': 1 };
      return pesoGlobal[b.statusGlobal] - pesoGlobal[a.statusGlobal];
    });
  }, [matriz, busca, filtroStatus]);

  // --- RENDERIZAÇÃO DO FORMULÁRIO DE ADMISSÃO (RH) ---
  if (isCadastroOpen) {
    return (
      <div className="animate-in slide-in-from-right duration-500 max-w-2xl mx-auto mt-4">
        <button
          className="mb-4 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit"
          onClick={() => setIsCadastroOpen(false)}
        >
          <span className="p-1.5 bg-surface-hover rounded-lg border border-border/60">←</span> Voltar para a Matriz
        </button>
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60">
          <FormCadastrarUsuario
            onSuccess={() => { 
              setIsCadastroOpen(false); 
              if(refetch) refetch(); 
            }}
            onCancelar={() => setIsCadastroOpen(false)}
          />
        </div>
      </div>
    );
  }

  // 🦴 SKELETON LOADING
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-5 rounded-2xl border border-border/60 shadow-sm">
          <div className="space-y-3 w-full lg:w-auto">
            <Skeleton variant="title" className="w-64 sm:w-80 h-7" />
            <Skeleton variant="text" className="w-48 sm:w-60 h-4" />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <Skeleton variant="default" className="h-10 w-full lg:w-[260px] rounded-xl" />
            <Skeleton variant="default" className="h-10 w-48 hidden sm:block rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col bg-surface rounded-2xl border border-border/60 shadow-sm overflow-hidden h-[310px]">
              <Skeleton variant="default" className="h-1.5 w-full rounded-none" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
                  <div className="w-full space-y-2">
                    <Skeleton variant="text" className="h-4 w-3/4" />
                    <Skeleton variant="text" className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 mt-2">
                  <Skeleton variant="default" className="h-9 w-full rounded-lg" />
                  <Skeleton variant="default" className="h-9 w-full rounded-lg" />
                  <Skeleton variant="default" className="h-9 w-full rounded-lg" />
                </div>
                <div className="mt-5 pt-4 border-t border-border/40 flex justify-between items-center">
                  <Skeleton variant="text" className="h-3 w-20 m-0" />
                  <Skeleton variant="text" className="h-3 w-24 m-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!matriz || matriz.length === 0) {
    return (
      <div className="p-12 text-center bg-surface rounded-2xl border border-border/60">
        <FileCheck className="w-12 h-12 text-border/60 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-main">Matriz Vazia</h3>
        <p className="text-text-secondary mt-1 mb-6">Nenhum integrante com exigências foi encontrado.</p>
        <Button onClick={() => setIsCadastroOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Cadastrar Primeiro Integrante
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER DA PÁGINA COM FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-5 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            Matriz de Qualificação SSMA
            <Badge variant="info">{integrantesProcessados.length} Integrantes</Badge>
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gestão inteligente de treinamentos, CNH e ASO da frota.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Input 
            icon={<Search className="w-4 h-4 text-text-muted" />}
            placeholder="Buscar integrante ou cargo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-background min-w-[220px]"
            containerClassName="!mb-0"
          />
          
          <div className="flex items-center bg-background rounded-lg border border-border/60 p-1">
            <button 
              onClick={() => setFiltroStatus('TODOS')}
              className={clsx("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", filtroStatus === 'TODOS' ? "bg-text-main text-surface" : "text-text-secondary hover:bg-surface")}
            >
              Todos
            </button>
            <button 
              onClick={() => setFiltroStatus('CRITICO')}
              className={clsx("px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5", filtroStatus === 'CRITICO' ? "bg-red-50 text-red-600 border border-red-200/50 shadow-sm" : "text-text-secondary hover:bg-surface")}
            >
              <XCircle className={clsx("w-3.5 h-3.5", filtroStatus === 'CRITICO' ? "text-red-600" : "text-red-500")} />
              Crítico
            </button>
            <button 
              onClick={() => setFiltroStatus('ATENCAO')}
              className={clsx("px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5", filtroStatus === 'ATENCAO' ? "bg-yellow-50 text-yellow-700 border border-yellow-200/50 shadow-sm" : "text-text-secondary hover:bg-surface")}
            >
              <AlertCircle className={clsx("w-3.5 h-3.5", filtroStatus === 'ATENCAO' ? "text-yellow-700" : "text-yellow-500")} />
              Atenção
            </button>
          </div>

          {/* ✨ NOVO: Botão de Cadastro (Oculto em Mobile porque usamos o SmartFAB) */}
          <Button 
            onClick={() => setIsCadastroOpen(true)} 
            className="hidden sm:flex whitespace-nowrap h-10 shadow-button hover:shadow-float-primary" 
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Integrante
          </Button>
        </div>
      </div>

      {/* GRELHA DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {integrantesProcessados.map((user) => {
          const itensVisiveis = user.exigenciasOrdenadas.slice(0, 4);
          const itensOcultos = user.exigenciasOrdenadas.length - 4;

          return (
            <div 
              key={user.userId} 
              // 🔄 CORRIGIDO: Rota exata com /admin
              onClick={() => navigate(`/admin/conformidade/${user.userId}`)}
              className={clsx(
                "group flex flex-col bg-surface rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden",
                user.statusGlobal === 'CRITICO' ? "border-red-500/30" : 
                user.statusGlobal === 'ATENCAO' ? "border-yellow-500/30" : "border-border/60"
              )}
            >
              <div className="h-1.5 w-full bg-background flex">
                <div 
                  className={clsx(
                    "h-full transition-all duration-500",
                    user.statusGlobal === 'CRITICO' ? "bg-red-500" : 
                    user.statusGlobal === 'ATENCAO' ? "bg-yellow-500" : "bg-green-500"
                  )}
                  style={{ width: `${user.saudePercentual}%` }}
                />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar 
                      nome={user.nome}
                      url={user.image}
                      className={clsx(
                        "ring-2 ring-offset-2 ring-offset-surface shrink-0",
                        user.statusGlobal === 'CRITICO' ? "ring-red-500" : 
                        user.statusGlobal === 'ATENCAO' ? "ring-yellow-500" : "ring-green-500"
                      )} 
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-text-main text-sm truncate" title={user.nome}>
                        {user.nome}
                      </h4>
                      <p className="text-xs text-text-secondary font-medium truncate" title={user.cargo}>
                        {user.cargo}
                      </p>
                    </div>
                  </div>
                  
                  <div className="shrink-0 whitespace-nowrap">
                    {user.statusGlobal === 'CRITICO' && (
                      <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                        <ShieldAlert className="w-3.5 h-3.5" /> Bloqueio
                      </div>
                    )}
                    {user.statusGlobal === 'ATENCAO' && (
                      <div className="flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                        <AlertCircle className="w-3.5 h-3.5" /> Vencendo
                      </div>
                    )}
                    {user.statusGlobal === 'CONFORME' && (
                      <div className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% OK
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 mt-2 space-y-2">
                  {itensVisiveis.map((exigencia, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
                      <span className="text-xs font-bold text-text-secondary truncate pr-2">
                        {exigencia.nome}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {exigencia.validade && exigencia.status !== 'FALTANTE' && (
                          <span className="text-[10px] text-text-muted font-medium bg-surface px-1.5 py-0.5 rounded border border-border/40">
                            {new Date(exigencia.validade).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })}
                          </span>
                        )}
                        <IndicadorStatus status={exigencia.status} />
                      </div>
                    </div>
                  ))}

                  {itensOcultos > 0 && (
                    <div className="text-center pt-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        + {itensOcultos} {itensOcultos === 1 ? 'item' : 'itens'} {user.statusGlobal === 'CONFORME' ? 'válido(s)' : 'na lista'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between group-hover:border-border transition-colors">
                  <div className="text-xs text-text-secondary font-medium">
                    <span className="font-bold text-text-main">{user.validos}</span> de {user.total} válidos
                  </div>
                  <div className="text-primary text-xs font-bold flex items-center group-hover:translate-x-1 transition-transform">
                    Portal RH <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SmartFAB onClick={() => setIsCadastroOpen(true)} label="Novo Integrante" />
    </div>
  );
}

function IndicadorStatus({ status }: { status: Exigencia['status'] }) {
  if (status === 'VÁLIDO') {
    return <span title="Válido"><CheckCircle2 className="w-4 h-4 text-green-500" /></span>;
  }
  if (status === 'VENCENDO') {
    return <span title="Vencendo"><AlertCircle className="w-4 h-4 text-yellow-500" /></span>;
  }
  return <span title="Pendência/Vencido"><XCircle className="w-4 h-4 text-red-500" /></span>;
}