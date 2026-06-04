import { useState } from 'react';
import { useDocumentosLegais, useDeleteDocumento } from '../hooks/useDocumentosLegais';
import { usePlanosManutencao } from '../hooks/usePlanosManutencao';
import { useModalStore } from '../hooks/useModalStore';
import { FILTRO_TODOS } from '../config/constants';
import { FormCadastrarDocumento } from './forms/FormCadastrarDocumento';
import { FormEditarDocumento } from './forms/FormEditarDocumento';
import { FormRenovarDocumento } from './forms/FormRenovarDocumento';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { PullToRefresh } from './ui/PullToRefresh';
import { SmartFAB } from './ui/SmartFAB';
import { Callout } from './ui/Callout';
import { FileText, Wrench, Plus, AlertTriangle } from 'lucide-react';
import { DocumentoCard } from './documentos/DocumentoCard';
import { DocumentoViewer } from './documentos/DocumentoViewer';

const CATEGORIAS = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'AST', label: 'AST' },
  { id: 'LICENCA_AMBIENTAL', label: 'Licença Amb.' },
  { id: 'ATRP', label: 'ATRP' },
  { id: 'CRLV', label: 'CRLV' },
  { id: 'CIV', label: 'CIV' },
  { id: 'CIPP', label: 'CIPP' },
  { id: 'TACOGRAFO', label: 'Tacógrafo' },
  { id: 'LAUDO_CHAPA', label: 'Laudo Chapa' },
  { id: 'MANUTENCAO', label: 'Manutenção' },
  { id: 'CTF IBAMA', label: 'CTF IBAMA' },
];

interface GestaoDocumentosProps {
  veiculoId?: string;
  somenteLeitura?: boolean;
}

export function GestaoDocumentos({ veiculoId, somenteLeitura = false }: GestaoDocumentosProps) {
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>(FILTRO_TODOS);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estado para a Edição e Renovação
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Estado para o Visualizador Cinemático
  const [docParaVisualizar, setDocParaVisualizar] = useState<{ url: string, titulo: string } | null>(null);
  const [zoomNivel, setZoomNivel] = useState(1);

  const { openModal, closeModal } = useModalStore();

  const { data: documentos, isLoading: isLoadingDocs, refetch: refetchDocs } = useDocumentosLegais({
    categoria: filtroCategoria,
    veiculoId: veiculoId
  });

  const { data: planos, isLoading: isLoadingPlanos, refetch: refetchPlanos } = usePlanosManutencao(veiculoId, filtroCategoria);

  const { mutateAsync: deletarDoc } = useDeleteDocumento();

  const confirmExclusao = (id: string, titulo: string) => {
    const modalId = openModal('CONFIRM', {
      title: "Remover Documento",
      description: (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm font-medium">
            Tem certeza que deseja excluir o documento <strong className="text-text-main font-black">"{titulo}"</strong> da base de dados?
          </p>
          <Callout variant="danger" title="Ação Irreversível" icon={AlertTriangle}>
            O Arquivo será permanentemente apagado e não poderá ser recuperado. Se este documento for obrigatório, a frota poderá ficar irregular.
          </Callout>
        </div>
      ) as unknown as string,
      variant: "danger",
      confirmLabel: "Sim, Excluir Documento",
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deletarDoc(id);
        } finally {
          setDeletingId(null);
          closeModal(modalId);
        }
      }
    });
  };

  const isLoading = isLoadingDocs || (!!veiculoId && filtroCategoria === FILTRO_TODOS && isLoadingPlanos);

  const handleRefresh = async () => {
    await Promise.all([refetchDocs(), refetchPlanos()]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative">

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            Biblioteca Legal
            {veiculoId && <span className="text-sm font-bold text-text-muted bg-surface-hover px-2 py-0.5 rounded-lg border border-border/60">Veículo Específico</span>}
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 mt-1">
              {documentos?.length || 0} Registro(s)
            </span>
          </div>
        }
        subtitle="Gestão central de documentação regulatória, laudos e licenças ambientais."
        extraAction={
          !somenteLeitura && !modoAdicionar ? (
            <Button onClick={() => setModoAdicionar(true)} icon={<Plus className="w-4 h-4" />} className="shadow-button hover:shadow-float-primary w-full sm:w-auto h-11">
              Novo Documento
            </Button>
          ) : undefined
        }
      />

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
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
              {CATEGORIAS.map(cat => (
                <Button
                  key={cat.id}
                  variant={filtroCategoria === cat.id ? 'primary' : 'outline'}
                  onClick={() => setFiltroCategoria(cat.id)}
                  className={`h-10 px-5 rounded-xl text-xs font-bold transition-all duration-300 border ${filtroCategoria !== cat.id ? (cat.id === 'AST' ? 'border-warning-500/40 text-warning-600 bg-warning-500/10 hover:bg-warning-500/20 shadow-none' : 'shadow-none') : ''}`}
                >
                  {cat.label}
                </Button>
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

              {planos && planos.length > 0 && filtroCategoria === FILTRO_TODOS && (
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
                      <p className="text-xs font-bold text-info uppercase tracking-widest mt-1">Vigente neste Equipemento</p>
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

              {documentos?.length === 0 && (!planos || planos.length === 0 || filtroCategoria !== FILTRO_TODOS) && (
                <div className="col-span-full pt-8">
                  <EmptyState
                    icon={FileText}
                    title="Nenhum documento encontrado"
                    description={`A sua biblioteca não tem Arquivos guardados na categoria "${CATEGORIAS.find(c => c.id === filtroCategoria)?.label}".`}
                    action={
                      !somenteLeitura ? (
                        <Button variant="secondary" onClick={() => setModoAdicionar(true)} icon={<Plus className="w-4 h-4" />}>
                          Arquivar Documento
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              )}

              {documentos?.map(doc => (
                <DocumentoCard
                  key={doc.id}
                  doc={doc}
                  somenteLeitura={somenteLeitura}
                  isDeleting={deletingId === doc.id}
                  onEdit={(id) => setEditingId(id)}
                  onRenew={(id) => setRenewingId(id)}
                  onDelete={confirmExclusao}
                  onView={(url, titulo) => { setDocParaVisualizar({ url, titulo }); setZoomNivel(1); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Edição */}
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

      {/* Modal de Renovação */}
      <Modal
        isOpen={!!renewingId}
        onClose={() => setRenewingId(null)}
        title="Renovação de Documento"
        className="max-w-2xl"
      >
        {renewingId && (
          <FormRenovarDocumento
            documentoId={renewingId}
            onSuccess={() => setRenewingId(null)}
            onCancel={() => setRenewingId(null)}
          />
        )}
      </Modal>

      {/* Visualizador Cinemático de Perícia Documental */}
      {docParaVisualizar && (
        <DocumentoViewer
          url={docParaVisualizar.url}
          titulo={docParaVisualizar.titulo}
          zoomNivel={zoomNivel}
          onZoomChange={setZoomNivel}
          onClose={() => { setDocParaVisualizar(null); setZoomNivel(1); }}
        />
      )}

    {!somenteLeitura && !modoAdicionar && (
      <SmartFAB 
        onClick={() => setModoAdicionar(true)} 
        label="Novo Documento" 
      />
    )}

      </div>
    </PullToRefresh>
  );
}
