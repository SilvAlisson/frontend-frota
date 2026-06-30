import { useParams, useNavigate } from 'react-router-dom';
import { useIntegranteDossie } from '../hooks/useIntegranteDossie';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Car, GraduationCap, HeartPulse, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export function PerfilConformidade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Reaproveitamos o seu hook existente para ir buscar os dados do integrante
  const { data: dossie, isLoading } = useIntegranteDossie(id || '');

  const [activeTab, setActiveTab] = useState<'treinamentos' | 'aso' | 'cnh'>('treinamentos');

  if (isLoading || !dossie) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-text-muted font-bold">A carregar dossiê de conformidade...</p>
      </div>
    );
  }

  const { user } = dossie;
  const isOperador = user.role === 'OPERADOR';

  // Proteção: Se não for operador e estiver na aba CNH, volta para os treinamentos
  if (!isOperador && activeTab === 'cnh') setActiveTab('treinamentos');

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Botão de Voltar */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors w-fit"
      >
        <span className="p-1.5 bg-surface-hover border border-border/60 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </span>
        Voltar à Matriz de Qualificação
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PAINEL LATERAL (CONTEXTO DO INTEGRANTE) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface p-8 rounded-3xl border border-border/60 shadow-sm flex flex-col items-center text-center">
            <Avatar 
              nome={user.nome} 
              url={user.fotoUrl || (user as any).image} 
              size="2xl" 
              className="w-32 h-32 mb-5 shadow-md border-4 border-background" 
            />
            <h2 className="text-xl font-black text-text-main tracking-tight leading-tight">{user.nome}</h2>
            <p className="text-text-secondary font-medium mt-1 mb-4">ID: {user.matricula || 'N/A'}</p>
            <Badge variant={user.status === 'ATIVO' ? 'success' : 'neutral'} className="mb-6 w-full max-w-[140px] justify-center">
              {user.status || 'ATIVO'}
            </Badge>
            
            <div className="w-full pt-5 border-t border-dashed border-border/60">
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-1.5">Cargo Operacional</p>
              <div className="bg-primary/10 text-primary py-2 px-4 rounded-xl font-black text-sm border border-primary/20">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA PRINCIPAL (TRINCHEIRAS DE SSMA) */}
        <div className="lg:col-span-8 flex flex-col h-full">
          {/* Navegação Interna (Tabs) */}
          <div className="bg-surface p-2 rounded-2xl border border-border/60 shadow-sm flex gap-2 overflow-x-auto hide-scrollbar mb-6 shrink-0">
            <button 
              onClick={() => setActiveTab('treinamentos')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === 'treinamentos' ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-surface-hover"
              )}
            >
              <GraduationCap className="w-4 h-4" /> NRs & Certificados
            </button>
            <button 
              onClick={() => setActiveTab('aso')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === 'aso' ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-surface-hover"
              )}
            >
              <HeartPulse className="w-4 h-4" /> Saúde (ASO)
            </button>
            {isOperador && (
              <button 
                onClick={() => setActiveTab('cnh')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                  activeTab === 'cnh' ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-surface-hover"
                )}
              >
                <Car className="w-4 h-4" /> Dados CNH
              </button>
            )}
          </div>

          {/* Área de Formulários e Grelhas */}
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border/60 shadow-sm flex-1">
            {activeTab === 'treinamentos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-black text-text-main mb-2 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-primary" /> Matriz de Treinamentos
                </h3>
                <p className="text-text-secondary text-sm mb-8">Gira a conformidade de NRs obrigatórias para este cargo.</p>
                
                {/* [FASE 2] Aqui entrará a grelha de NRs e os inputs de Alerta */}
                <div className="p-8 border-2 border-dashed border-border/60 rounded-2xl text-center">
                  <p className="text-text-muted font-bold">Fase 2: Motor de Alertas e Certificados entrará aqui.</p>
                </div>
              </div>
            )}

            {activeTab === 'aso' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-black text-text-main mb-2 flex items-center gap-2">
                  <HeartPulse className="w-6 h-6 text-primary" /> Saúde Ocupacional
                </h3>
                <p className="text-text-secondary text-sm mb-8">Controlo de Atestado de Saúde (ASO) e Fit Test.</p>

                {/* [FASE 2] Aqui entrará o form do ASO */}
                <div className="p-8 border-2 border-dashed border-border/60 rounded-2xl text-center">
                  <p className="text-text-muted font-bold">Fase 2: Motor de Alertas de ASO entrará aqui.</p>
                </div>
              </div>
            )}

            {activeTab === 'cnh' && isOperador && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-black text-text-main mb-2 flex items-center gap-2">
                  <Car className="w-6 h-6 text-primary" /> Registo de Habilitação
                </h3>
                <p className="text-text-secondary text-sm mb-8">Monitorização da validade da CNH para operação de frota pesada.</p>

                {/* [FASE 2] Aqui entrará o form da CNH */}
                <div className="p-8 border-2 border-dashed border-border/60 rounded-2xl text-center">
                  <p className="text-text-muted font-bold">Fase 2: Configuração de CNH entrará aqui.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}