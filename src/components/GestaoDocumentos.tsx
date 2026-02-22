import { useState } from 'react';
import { useDocumentosLegais, useDeleteDocumento } from '../hooks/useDocumentosLegais';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarDocumento } from './forms/FormCadastrarDocumento';
import { FormEditarDocumento } from './forms/FormEditarDocumento'; // ✨ NOVO IMPORT
import { formatDateDisplay } from '../utils/dateUtils';
import { Button } from './ui/Button';
import { 
  FileText, Wrench, ShieldCheck, AlertTriangle, FileWarning, 
  Trash2, Edit, ExternalLink, Plus, Loader2
} from 'lucide-react';

import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';
import { Modal } from './ui/Modal'; // ✨ IMPORT DO MODAL

// --- UTILS (Extraído para performance) ---
const getStatusInfo = (dataValidade?: string | null, categoria?: string) => {
  // 1. Licenças Permanentes (Sem validade e categorias específicas)
  if ((categoria === 'LICENCA_AMBIENTAL' || categoria === 'AST') && !dataValidade) {
    return {
      color: 'bg-success/10 text-success border-success/20',
      text: 'Vigente (Permanente)',
      icon: ShieldCheck
    };
  }

  // 2. Sem data definida (Generico)
  if (!dataValidade) return { 
    color: 'bg-surface-hover text-text-muted border-border/60', 
    text: 'Sem data', 
    icon: null 
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); 
  
  const validade = new Date(dataValidade);
  validade.setHours(23, 59, 59, 999); 
  
  const diffTime = validade.getTime() - hoje.getTime();
  const diasParaVencer = Math.ceil(diffTime / (1000 * 3600 * 24));

  // 3. Vencido
  if (diasParaVencer < 0) return {
    color: 'bg-error/10 text-error border-error/20 animate-pulse',
    text: `Venceu a ${formatDateDisplay(dataValidade)}`,
    icon: AlertTriangle
  };

  // 4. Vence em breve (30 dias)
  if (diasParaVencer <= 30) return {
    color: 'bg-warning-500/10 text-warning-600 border-warning-500/20',
    text: `Vence em ${diasParaVencer} dias`,
    icon: AlertTriangle
  };

  // 5. Vigente
  return {
    color: 'bg-success/10 text-success border-success/20',
    text: `Vence a ${formatDateDisplay(dataValidade)}`,
    icon: ShieldCheck
  };
};

const CATEGORIAS = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'AST', label: '⚠️ AST Segurança' },
  { id: 'LICENCA_AMBIENTAL', label: 'Licença Amb.' },
  { id: 'ATRP', label: 'ATRP' },
  { id: 'CRLV', label: 'CRLV' },
  { id: 'CIV', label: 'CIV' },
  { id: 'CIPP', label: 'CIPP' },
  { id: 'TACOGRAFO', label: 'Tacógrafo' },
  { id: 'LAUDO_CHAPA', label: 'Laudo Chapa' },
  { id: 'MANUTENCAO', label: 'Manutenção' },
];

interface GestaoDocumentosProps {
  veiculoId?: string;
  somenteLeitura?: boolean;
}

export function GestaoDocumentos({ veiculoId, somenteLeitura = false }: GestaoDocumentosProps) {
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docParaExcluir, setDocParaExcluir] = useState<{id: string, titulo: string} | null>(null);
  
  // ✨ NOVO: Estado para a Edição
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: documentos, isLoading: isLoadingDocs } = useDocumentosLegais({
    categoria: filtroCategoria,
    veiculoId: veiculoId
  });

  const { data: planos, isLoading: isLoadingPlanos } = useQuery({
    queryKey: ['planos', veiculoId],
    queryFn: async () => {
      if (!veiculoId) return [];
      const res = await api.get(`/planos-manutencao?veiculoId=${veiculoId}`);
      return res.data;
    },
    enabled: !!veiculoId && filtroCategoria === 'TODOS'
  });

  const { mutateAsync: deletarDoc } = useDeleteDocumento();

  const handleDeleteRequest = (id: string, titulo: string) => {
    setDocParaExcluir({ id, titulo });
  };

  const executeDelete = async () => {
    if (!docParaExcluir) return;
    try {
      setDeletingId(docParaExcluir.id);
      await deletarDoc(docParaExcluir.id);
    } catch (error) {} finally {
      setDeletingId(null);
      setDocParaExcluir(null); 
    }
  };

  const isLoading = isLoadingDocs || (!!veiculoId && filtroCategoria === 'TODOS' && isLoadingPlanos);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-text-main flex items-center gap-3 tracking-tight">
            Biblioteca Legal 
            {veiculoId && <span className="text-sm font-bold text-text-muted bg-surface-hover px-2 py-0.5 rounded-lg border border-border/60">Veículo Específico</span>}
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              {documentos?.length || 0} Registo(s)
            </span>
          </h2>
          <p className="text-sm text-text-secondary font-medium mt-1.5 opacity-90">Gestão central de documentação regulatória, laudos e licenças ambientais.</p>
        </div>
        {!somenteLeitura && !modoAdicionar && (
          <Button onClick={() => setModoAdicionar(true)} icon={<Plus className="w-4 h-4" />} className="shadow-button hover:shadow-float-primary w-full sm:w-auto h-11">
            Novo Documento
          </Button>
        )}
      </div>

      {modoAdicionar ? (
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 animate-in slide-in-from-right-8 duration-300 max-w-4xl">
          <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-5">
             <Button variant="ghost" className="h-9 px-3 text-xs bg-surface-hover/50 hover:bg-surface-hover" onClick={() => setModoAdicionar(false)}>
               ← Voltar
             </Button>
             <h3 className="text-lg font-black text-text-main tracking-tight">Arquivar Novo Documento</h3>
          </div>
          <FormCadastrarDocumento
            onSuccess={() => setModoAdicionar(false)}
            onCancel={() => setModoAdicionar(false)}
            veiculoIdPreSelecionado={veiculoId}
          />
        </div>
      ) : (
        <>
          <div className="relative group">
            <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFiltroCategoria(cat.id)}
                  className={`
                    px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border outline-none select-none
                    ${filtroCategoria === cat.id
                      ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                      : 'bg-surface text-text-secondary border-border/60 hover:bg-surface-hover hover:text-text-main hover:border-primary/30'
                    } 
                    ${cat.id === 'AST' && filtroCategoria !== 'AST' ? 'border-warning-500/30 text-warning-600 bg-warning-500/5 hover:bg-warning-500/10' : ''}
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-36 bg-surface-hover/50 rounded-3xl border border-border/40 animate-pulse p-5">
                    <div className="flex gap-4">
                       <div className="w-12 h-12 bg-background rounded-2xl"></div>
                       <div className="flex-1 space-y-3 mt-1">
                          <div className="h-4 bg-background rounded-md w-3/4"></div>
                          <div className="h-3 bg-background rounded-md w-1/2"></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">

              {planos && planos.length > 0 && filtroCategoria === 'TODOS' && (
                <div className="bg-gradient-to-br from-info/5 to-info/10 p-6 rounded-3xl border border-info/20 shadow-sm relative group cursor-pointer hover:shadow-float hover:border-info/40 transition-all">
                  <div className="absolute top-4 right-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-info animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)] flex"></span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface shadow-sm flex items-center justify-center text-info border border-info/20 shrink-0">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-text-main text-lg tracking-tight leading-tight">Plano de Manutenção</h4>
                      <p className="text-xs font-bold text-info uppercase tracking-widest mt-1">Vigente neste equipamento</p>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-info/20 text-sm text-text-main space-y-2">
                    <p className="flex justify-between items-center bg-white/50 px-3 py-1.5 rounded-lg">
                       <span className="text-text-secondary font-medium">Intervalo Técnico:</span>
                       <span className="font-black text-info">{planos[0].valorIntervalo} {planos[0].tipoIntervalo}</span>
                    </p>
                    <p className="flex justify-between items-center bg-white/50 px-3 py-1.5 rounded-lg">
                       <span className="text-text-secondary font-medium">Próxima Revisão:</span>
                       <span className="font-black text-info">{planos[0].kmProximaManutencao ? `${planos[0].kmProximaManutencao.toLocaleString('pt-BR')} KM` : 'N/A'}</span>
                    </p>
                  </div>
                </div>
              )}

              {documentos?.length === 0 && (!planos || planos.length === 0 || filtroCategoria !== 'TODOS') && (
                <div className="col-span-full pt-8">
                   <EmptyState 
                       icon={FileText} 
                       title="Nenhum documento encontrado" 
                       description={`A sua biblioteca não tem ficheiros guardados na categoria "${CATEGORIAS.find(c => c.id === filtroCategoria)?.label}".`}
                       action={
                           !somenteLeitura ? (
                               <Button variant="secondary" onClick={() => setModoAdicionar(true)} icon={<Plus className="w-4 h-4"/>}>
                                   Arquivar Documento
                               </Button>
                           ) : undefined
                       }
                   />
                </div>
              )}

              {documentos?.map(doc => {
                const status = getStatusInfo(doc.dataValidade, doc.categoria);
                const isAst = doc.categoria === 'AST';
                const StatusIcon = status.icon;
                const isDeleting = deletingId === doc.id;

                return (
                  <div 
                    key={doc.id} 
                    className={`
                      flex flex-col p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-300 relative group h-full
                      ${isDeleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}
                      ${isAst 
                        ? 'bg-gradient-to-br from-surface to-warning-500/5 border-warning-500/30 hover:border-warning-500/50' 
                        : 'bg-surface border-border/60 hover:border-primary/40'}
                    `}
                  >
                    {/* ✨ Grupo de Botões de Ação (Editar e Apagar) */}
                    {!somenteLeitura && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all bg-surface-hover/80 lg:bg-transparent rounded-xl p-1 shadow-sm lg:shadow-none">
                        <button
                          onClick={() => setEditingId(doc.id)}
                          disabled={isDeleting}
                          className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Editar Documento"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(doc.id, doc.titulo)}
                          disabled={isDeleting}
                          className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                          title="Remover Documento"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-error" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-inner ${isAst ? 'bg-warning-500/10 text-warning-600 border-warning-500/20' : 'bg-surface-hover/80 text-text-secondary border-border/60'}`}>
                        {isAst ? <FileWarning className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-16 lg:pr-8 group-hover:pr-16 transition-all">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] ${isAst ? 'text-warning-700 bg-warning-500/10 border border-warning-500/20' : 'text-text-secondary bg-surface-hover border border-border/60'}`}>
                            {doc.categoria.replace(/_/g, ' ')}
                          </span>
                          {doc.veiculoId && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black bg-primary/10 text-primary border border-primary/20 tracking-widest">
                              VINCULADO
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-base text-text-main truncate tracking-tight leading-tight mb-1" title={doc.titulo}>{doc.titulo}</h4>
                        <p className="text-xs text-text-secondary font-medium line-clamp-2 min-h-[2.5em] opacity-80">
                            {doc.descricao || <span className="italic opacity-60">Sem anotações complementares.</span>}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                      <div className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${status.color}`}>
                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                        {status.text}
                      </div>

                      <a
                        href={doc.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-white bg-primary/10 hover:bg-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        Aceder <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ✨ NOVO: Modal de Edição */}
      <Modal 
        isOpen={!!editingId} 
        onClose={() => setEditingId(null)}
        title="Atualizar Informações do Documento"
        className="max-w-2xl"
      >
        {editingId && (
          <FormEditarDocumento 
            documentoId={editingId} 
            onSuccess={() => setEditingId(null)} 
            onCancel={() => setEditingId(null)} 
          />
        )}
      </Modal>

      <ConfirmModal 
        isOpen={!!docParaExcluir}
        onCancel={() => setDocParaExcluir(null)}
        onConfirm={executeDelete}
        title="Remover Documento"
        description={
          <div className="space-y-4">
             <p className="text-text-secondary text-sm font-medium">
                 Tem a certeza que deseja excluir o documento <strong className="text-text-main font-black">"{docParaExcluir?.titulo}"</strong> da base de dados?
             </p>
             <Callout variant="danger" title="Ação Irreversível" icon={AlertTriangle}>
                 O ficheiro será permanentemente apagado e não poderá ser recuperado. Se este documento for obrigatório, a frota poderá ficar irregular.
             </Callout>
          </div>
        }
        variant="danger"
        confirmLabel={deletingId ? "A Remover..." : "Sim, Excluir Documento"}
      />

    </div>
  );
}