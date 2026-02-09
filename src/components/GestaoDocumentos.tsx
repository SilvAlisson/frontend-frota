import { useState } from 'react';
import { useDocumentosLegais, useDeleteDocumento } from '../hooks/useDocumentosLegais';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarDocumento } from './forms/FormCadastrarDocumento';
import { formatDateDisplay } from '../utils/dateUtils';
import { Button } from './ui/Button';
import { 
  FileText, Wrench, ShieldCheck, AlertTriangle, FileWarning, 
  Trash2, ExternalLink, Plus, Loader2
} from 'lucide-react';

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
    color: 'bg-surface-hover text-text-muted border-border', 
    text: 'Sem data', 
    icon: null 
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia
  
  const validade = new Date(dataValidade);
  validade.setHours(23, 59, 59, 999); // Normalizar para fim do dia
  
  const diffTime = validade.getTime() - hoje.getTime();
  const diasParaVencer = Math.ceil(diffTime / (1000 * 3600 * 24));

  // 3. Vencido
  if (diasParaVencer < 0) return {
    color: 'bg-error/10 text-error border-error/20 animate-pulse',
    text: `Venceu em ${formatDateDisplay(dataValidade)}`,
    icon: AlertTriangle
  };

  // 4. Vence em breve (30 dias)
  if (diasParaVencer <= 30) return {
    color: 'bg-warning/10 text-warning-600 border-warning-500/20',
    text: `Vence em ${diasParaVencer} dias`,
    icon: AlertTriangle
  };

  // 5. Vigente
  return {
    color: 'bg-success/10 text-success border-success/20',
    text: `Vence: ${formatDateDisplay(dataValidade)}`,
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

  // 1. Busca Documentos
  const { data: documentos, isLoading: isLoadingDocs } = useDocumentosLegais({
    categoria: filtroCategoria,
    veiculoId: veiculoId
  });

  // 2. Busca Plano de Manutenção
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

  const handleDeletar = async (id: string, titulo: string) => {
    if (confirm(`Deseja excluir "${titulo}"?\n\nEsta ação é irreversível.`)) {
      try {
        setDeletingId(id);
        await deletarDoc(id);
      } catch (error) {
        // Erro já tratado no hook/toast global
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Loading State Unificado
  const isLoading = isLoadingDocs || (!!veiculoId && filtroCategoria === 'TODOS' && isLoadingPlanos);

  return (
    <div className="space-y-6 animate-enter">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            Biblioteca Legal
            <span className="text-xs font-normal text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border">
              {documentos?.length || 0} arq.
            </span>
          </h2>
          <p className="text-sm text-text-secondary">Documentos regulatórios, laudos e licenças.</p>
        </div>
        {!somenteLeitura && !modoAdicionar && (
          <Button onClick={() => setModoAdicionar(true)} icon={<Plus className="w-4 h-4" />}>
            Novo Documento
          </Button>
        )}
      </div>

      {modoAdicionar ? (
        <div className="bg-surface p-6 rounded-2xl shadow-card border border-border animate-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
             <h3 className="text-lg font-bold text-text-main">Arquivar Novo Documento</h3>
             {/* [CORREÇÃO] Removido size="sm" e usado className para estilo */}
             <Button variant="ghost" className="h-8 text-xs px-3" onClick={() => setModoAdicionar(false)}>Voltar</Button>
          </div>
          <FormCadastrarDocumento
            onSuccess={() => setModoAdicionar(false)}
            onCancel={() => setModoAdicionar(false)}
          />
        </div>
      ) : (
        <>
          {/* FILTROS (TAGS) */}
          <div className="relative group">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFiltroCategoria(cat.id)}
                  className={`
                    px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                    ${filtroCategoria === cat.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-hover hover:border-primary/30'
                    } 
                    ${cat.id === 'AST' && filtroCategoria !== 'AST' ? 'border-warning-500/30 text-warning-600 bg-warning-500/5' : ''}
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE DOCUMENTOS */}
          {isLoading ? (
            // SKELETON LOADING
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-32 bg-surface rounded-xl border border-border animate-pulse p-4">
                    <div className="flex gap-3">
                       <div className="w-10 h-10 bg-background rounded-lg"></div>
                       <div className="flex-1 space-y-2">
                          <div className="h-4 bg-background rounded w-3/4"></div>
                          <div className="h-3 bg-background rounded w-1/2"></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* CARD: PLANO DE MANUTENÇÃO (Destaque) */}
              {planos && planos.length > 0 && filtroCategoria === 'TODOS' && (
                <div className="bg-info/5 p-5 rounded-xl border border-info/20 shadow-sm relative group cursor-pointer hover:shadow-float hover:border-info/40 transition-all">
                  <div className="absolute top-3 right-3">
                      <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-info border border-info/10">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main">Plano de Manutenção</h4>
                      <p className="text-xs text-text-secondary">Vigente para este veículo</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-info/10 text-xs text-text-main space-y-1">
                    <p className="flex justify-between">
                       <span className="text-text-secondary">Intervalo:</span>
                       <span className="font-medium">{planos[0].valorIntervalo} {planos[0].tipoIntervalo}</span>
                    </p>
                    <p className="flex justify-between">
                       <span className="text-text-secondary">Próxima revisão:</span>
                       <span className="font-bold text-info">{planos[0].kmProximaManutencao ? `${planos[0].kmProximaManutencao} KM` : 'N/A'}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {documentos?.length === 0 && (!planos || planos.length === 0 || filtroCategoria !== 'TODOS') && (
                <div className="col-span-full py-16 text-center bg-surface rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                     <FileText className="w-8 h-8 text-text-muted opacity-50" />
                  </div>
                  <h4 className="text-text-main font-bold">Nenhum documento encontrado</h4>
                  <p className="text-sm text-text-secondary max-w-xs mx-auto mt-1">
                     Não há arquivos na categoria <strong>"{CATEGORIAS.find(c => c.id === filtroCategoria)?.label}"</strong>.
                  </p>
                  {!somenteLeitura && (
                     <Button variant="ghost" className="mt-4 text-primary" onClick={() => setModoAdicionar(true)}>
                       Cadastrar Agora
                     </Button>
                  )}
                </div>
              )}

              {/* CARDS DE DOCUMENTOS */}
              {documentos?.map(doc => {
                const status = getStatusInfo(doc.dataValidade, doc.categoria);
                const isAst = doc.categoria === 'AST';
                const StatusIcon = status.icon;
                const isDeleting = deletingId === doc.id;

                return (
                  <div 
                    key={doc.id} 
                    className={`
                      flex flex-col p-4 rounded-xl border shadow-card transition-all relative group
                      ${isDeleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-float'}
                      ${isAst 
                        ? 'bg-gradient-to-br from-surface to-warning-500/5 border-warning-500/20 hover:border-warning-500/40' 
                        : 'bg-surface border-border hover:border-primary/30'}
                    `}
                  >
                    {/* Botão Deletar */}
                    {!somenteLeitura && (
                      <button
                        onClick={() => handleDeletar(doc.id, doc.titulo)}
                        disabled={isDeleting}
                        className="absolute top-3 right-3 p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Excluir (Substituir)"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-error" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}

                    <div className="flex items-start gap-3 flex-1">
                      {/* Ícone do Tipo */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border shadow-sm ${isAst ? 'bg-warning-500/10 text-warning-600 border-warning-500/10' : 'bg-surface-hover text-text-secondary border-border'}`}>
                        {isAst ? <FileWarning className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isAst ? 'text-warning-700 bg-warning-500/10' : 'text-text-secondary bg-surface-hover border border-border'}`}>
                            {doc.categoria.replace(/_/g, ' ')}
                          </span>
                          {doc.veiculoId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                              PLACA
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-text-main truncate" title={doc.titulo}>{doc.titulo}</h4>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2 min-h-[2.5em]">
                            {doc.descricao || <span className="italic opacity-50">Sem descrição adicional.</span>}
                        </p>
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                      <div className={`text-[10px] px-2 py-1 rounded-md border font-medium flex items-center gap-1.5 ${status.color}`}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {status.text}
                      </div>

                      <a
                        href={doc.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:text-primary-hover hover:underline flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
                      >
                        Visualizar <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}