import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useIntegranteDossie } from '../hooks/useIntegranteDossie';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { FileCheck, GraduationCap, HeartPulse, UserCircle, ChevronLeft } from 'lucide-react';
import { FormEditarUsuario } from '../components/forms/FormEditarUsuario';
import { AbaAso } from '../components/rh/AbaAso';
import { AbaTreinamentos } from '../components/rh/AbaTreinamentos';
import { AbaCnh } from '../components/rh/AbaCnh';

export function MatrizDetalheUsuario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'treinamentos' | 'aso' | 'cnh' | 'cadastral'>('treinamentos');

  // Reusing the hook used for the dossie to get the user data
  const { data: dossie, isLoading } = useIntegranteDossie(id || '', 1);

  if (isLoading || !dossie) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs animate-pulse">Carregando Dados SSMA...</p>
      </div>
    );
  }

  const { user } = dossie;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-24 max-w-[1400px] mx-auto">
      {/* HEADER DE VOLTA E TÍTULO */}
      <div className="flex flex-col gap-1 mb-2">
        <button
          className="mb-2 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit"
          onClick={() => navigate('/admin/matriz')}
        >
          <span className="p-1.5 bg-surface-hover rounded-lg border border-border/60"><ChevronLeft className="w-4 h-4" /></span> Voltar para a Matriz
        </button>
        <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-3">
           <div className="p-1.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20">
              <FileCheck className="w-5 h-5" />
           </div>
           Dossiê SSMA: {user.nome}
        </h2>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* PAINEL LATERAL ESQUERDO (Sticky) */}
        <div className="w-full xl:w-[320px] shrink-0 bg-surface rounded-[2rem] border border-border/60 shadow-sm p-6 xl:sticky xl:top-6">
          <div className="flex flex-col items-center text-center">
            <Avatar nome={user.nome} url={user.fotoUrl} size="2xl" className="w-32 h-32 text-4xl shadow-md border-4 border-surface mb-4" />
            <h3 className="text-xl font-black text-text-main tracking-tight leading-tight">{user.nome}</h3>
            <p className="text-primary font-bold text-sm mt-1">{(user.cargo as { nome?: string })?.nome || user.role}</p>
            {user.matricula && (
              <Badge variant="neutral" className="mt-3 uppercase tracking-widest">
                Matrícula: {user.matricula}
              </Badge>
            )}
          </div>

          <div className="mt-8 space-y-2 flex flex-col">
            <button
              onClick={() => setActiveTab('treinamentos')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors w-full text-left ${activeTab === 'treinamentos' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'}`}
            >
              <GraduationCap className="w-5 h-5" /> Treinamentos & NRs
            </button>
            <button
              onClick={() => setActiveTab('aso')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors w-full text-left ${activeTab === 'aso' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'}`}
            >
              <HeartPulse className="w-5 h-5" /> Saúde (ASO)
            </button>
            <button
              onClick={() => setActiveTab('cnh')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors w-full text-left ${activeTab === 'cnh' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'}`}
            >
              <UserCircle className="w-5 h-5" /> CNH & Documentos
            </button>
            <button
              onClick={() => setActiveTab('cadastral')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors w-full text-left ${activeTab === 'cadastral' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'}`}
            >
              <UserCircle className="w-5 h-5" /> Dados Cadastrais
            </button>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO DAS ABAS */}
        <div className="flex-1 w-full bg-surface rounded-[2rem] border border-border/60 shadow-sm p-6 sm:p-8 min-h-[600px]">
          {activeTab === 'treinamentos' && (
            <div className="animate-in fade-in">
               <AbaTreinamentos userId={user.id} nomeUsuario={user.nome} />
            </div>
          )}
          {activeTab === 'aso' && (
            <div className="animate-in fade-in">
               <AbaAso userId={user.id} />
            </div>
          )}
          {activeTab === 'cnh' && (
            <div className="animate-in fade-in">
               <AbaCnh userId={user.id} />
            </div>
          )}
          {activeTab === 'cadastral' && (
            <div className="animate-in fade-in">
               <h3 className="text-xl font-bold text-text-main mb-6">Dados Cadastrais</h3>
               <FormEditarUsuario
                 userId={user.id}
                 onSuccess={() => {}} // Hook interno já invalida queries
                 onCancelar={() => setActiveTab('treinamentos')}
                 variant="embedded"
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
