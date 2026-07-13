import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIntegranteDossie } from '../hooks/useIntegranteDossie';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Callout } from '../components/ui/Callout';
import { FileCheck, GraduationCap, HeartPulse, UserCircle, ChevronLeft, Car } from 'lucide-react';
import { FormEditarUsuario } from '../components/forms/FormEditarUsuario';
import { AbaAso } from '../components/rh/AbaAso';
import { AbaTreinamentos } from '../components/rh/AbaTreinamentos';
import { AbaCnh } from '../components/rh/AbaCnh';
import { useMatrizQualificacao } from '../hooks/useMatrizQualificacao';

export function DossieIntegranteHub() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'treinamentos' | 'aso' | 'cnh' | 'cadastral'>('treinamentos');

  // 1. Busca os dados do dossiê
  const { data: dossie, isLoading, isError } = useIntegranteDossie(id || '', 1);
  
  const { data: matriz } = useMatrizQualificacao();

  // 2. Early return de carregamento (após a declaração de TODOS os hooks)
  if (isLoading || !dossie) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs animate-pulse">Carregando Dados SSMA...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in">
        <Callout
          variant="danger"
          title="Falha ao carregar dossiê"
          className="max-w-md text-center"
        >
          Não foi possível conectar com o servidor para buscar os dados do integrante. 
          Verifique sua conexão e tente novamente.
        </Callout>
      </div>
    );
  }

  const { user } = dossie;

  // Processa a matriz agora que temos certeza que passou do loading
  const matrizUser = matriz?.find(u => u.userId === (id || ''));

  const getBadge = (tipo: 'TREINAMENTO' | 'ASO' | 'CNH') => {
    const exigencias = matrizUser?.exigencias.filter(e => e.tipo === tipo) || [];
    if (exigencias.some(e => e.status === 'VENCIDO' || e.status === 'FALTANTE')) return 'bg-red-500 shadow-red-500/40';
    if (exigencias.some(e => e.status === 'VENCENDO')) return 'bg-yellow-500 shadow-yellow-500/40';
    return null;
  };

  const badgeTreinamento = getBadge('TREINAMENTO');
  const badgeAso = getBadge('ASO');
  const badgeCnh = getBadge('CNH');

  const handleCancelarCadastro = useCallback(() => setActiveTab('treinamentos'), []);

  return (
    <div className="matriz-detalhe-page">
      <div className="v1-container flex flex-col w-full max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500 p-4 gap-4">

        {/* Top Header Card */}
        <div className="v1-header flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface p-6 sm:p-8 rounded-[24px] border border-border/60 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-6">
            <Avatar nome={user.nome} url={user.fotoUrl} size="2xl" className="w-24 h-24 border-4 border-surface shadow-md" />
            <div>
              <button onClick={() => navigate('/admin/matriz')} className="v1-back mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors py-1 px-3 rounded-full border border-border/60 bg-surface-hover">
                <ChevronLeft className="w-3 h-3" /> Voltar
              </button>
              <h2 className="text-3xl font-black text-text-main tracking-tight leading-none mb-2">{user.nome}</h2>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold text-sm">{(user.cargo as { nome?: string })?.nome || user.role}</span>
                {user.matricula && (
                   <Badge variant="neutral" className="uppercase tracking-widest text-[10px]">MAT: {user.matricula}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex sm:flex-col gap-2">
             {badgeTreinamento && <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><GraduationCap className="w-3 h-3 mr-1"/> NRs Pendentes</Badge>}
             {badgeAso && <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><HeartPulse className="w-3 h-3 mr-1"/> ASO Vencendo</Badge>}
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mt-6">
          {[
            { id: 'treinamentos', label: 'Treinamentos', icon: GraduationCap },
            { id: 'aso', label: 'Saúde (ASO)', icon: HeartPulse },
            { id: 'cadastral', label: 'Cadastro', icon: UserCircle }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all",
                activeTab === tab.id ? "bg-primary text-white shadow-md" : "bg-surface border border-border/60 text-text-secondary hover:bg-surface-hover hover:text-text-main"
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="w-full min-h-[400px] mt-4">
          {activeTab === 'treinamentos' && <div className="animate-in fade-in"><AbaTreinamentos userId={user.id} nomeUsuario={user.nome} role={user.role} cargoId={user.cargoId} /></div>}
          {activeTab === 'aso' && <div className="animate-in fade-in"><AbaAso userId={user.id} /></div>}
          <div className={activeTab === 'cadastral' ? 'block animate-in fade-in' : 'hidden'}>
            <div className="bg-surface rounded-[24px] border border-border/60 shadow-sm p-6 sm:p-8">
               <h3 className="text-xl font-bold text-text-main mb-6">Dados Cadastrais</h3>
               <FormEditarUsuario userId={user.id} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['users'] }); }} onCancelar={handleCancelarCadastro} variant="embedded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
