import { useState } from 'react';
import { useDocumentosLegais, useDeleteDocumento } from '../hooks/useDocumentosLegais';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarDocumento } from './forms/FormCadastrarDocumento';
import { formatDateDisplay } from '../utils/dateUtils';
import { Button } from './ui/Button';
import { FileText, Wrench, ShieldCheck, AlertTriangle, FileWarning, Trash2, ExternalLink, Plus } from 'lucide-react';

interface GestaoDocumentosProps {
  veiculoId?: string; // ID do veículo atual (opcional)
  somenteLeitura?: boolean; // Para operadores (esconde botão de deletar/criar)
}

export function GestaoDocumentos({ veiculoId, somenteLeitura = false }: GestaoDocumentosProps) {
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  // 1. Busca Documentos
  const { data: documentos, isLoading } = useDocumentosLegais({
    categoria: filtroCategoria,
    veiculoId: veiculoId
  });

  // 2. Busca Plano de Manutenção (Se houver veículo selecionado)
  const { data: planos } = useQuery({
    queryKey: ['planos', veiculoId],
    queryFn: async () => {
      if (!veiculoId) return [];
      const res = await api.get(`/planos-manutencao?veiculoId=${veiculoId}`);
      return res.data;
    },
    enabled: !!veiculoId && filtroCategoria === 'TODOS'
  });

  const { mutate: deletarDoc } = useDeleteDocumento();

  const handleDeletar = (id: string, titulo: string) => {
    if (confirm(`Ao "Alterar" um documento, o procedimento correto é excluir o antigo e cadastrar o novo.\n\nDeseja excluir "${titulo}" agora?`)) {
      deletarDoc(id);
    }
  };

  // Lógica visual de status (Refatorada para Cores Semânticas)
  const getStatusInfo = (dataValidade?: string | null, categoria?: string) => {
    // Licença Ambiental e AST (Permanente se não tiver data)
    if ((categoria === 'LICENCA_AMBIENTAL' || categoria === 'AST') && !dataValidade) {
      return {
        color: 'bg-success/10 text-success border-success/20',
        text: 'Vigente (Permanente)',
        icon: ShieldCheck
      };
    }

    if (!dataValidade) return { 
        color: 'bg-surface-hover text-text-muted border-border', 
        text: 'Sem data', 
        icon: null 
    };

    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasParaVencer = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diasParaVencer < 0) return {
      color: 'bg-error/10 text-error border-error/20 animate-pulse',
      text: `Venceu em ${formatDateDisplay(dataValidade)}`,
      icon: AlertTriangle
    };
    if (diasParaVencer < 30) return {
      color: 'bg-warning/10 text-warning-600 border-warning-500/20',
      text: `Vence em ${diasParaVencer} dias`,
      icon: AlertTriangle
    };

    return {
      color: 'bg-success/10 text-success border-success/20',
      text: `Vence: ${formatDateDisplay(dataValidade)}`,
      icon: ShieldCheck
    };
  };

  const categorias = [
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

  return (
    <div className="space-y-6 animate-enter">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-main">Biblioteca Legal</h2>
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
          <h3 className="text-lg font-bold text-text-main mb-4">Arquivar Novo Documento</h3>
          <FormCadastrarDocumento
            onSuccess={() => setModoAdicionar(false)}
            onCancel={() => setModoAdicionar(false)}
          />
        </div>
      ) : (
        <>
          {/* FILTROS (TAGS) */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={`
                  px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                  ${filtroCategoria === cat.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-hover hover:border-primary/30'
                  } 
                  ${cat.id === 'AST' && filtroCategoria !== 'AST' ? 'border-warning-500/30 text-warning-600 bg-warning-500/5' : ''}
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* LISTA DE DOCUMENTOS */}
          {isLoading ? (
            <div className="text-center py-10 text-text-muted animate-pulse">Carregando biblioteca...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* CARD: PLANO DE MANUTENÇÃO */}
              {planos && planos.length > 0 && filtroCategoria === 'TODOS' && (
                <div className="bg-info/5 p-4 rounded-xl border border-info/20 shadow-sm relative group cursor-pointer hover:shadow-float hover:border-info/40 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main">Plano de Manutenção</h4>
                      <p className="text-xs text-text-secondary">Vigente para este veículo</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-info/10 text-xs text-info font-medium">
                    <strong>Intervalo:</strong> A cada {planos[0].valorIntervalo} {planos[0].tipoIntervalo}
                    <br />
                    <strong>Próxima revisão:</strong> {planos[0].kmProximaManutencao ? `${planos[0].kmProximaManutencao} KM` : 'N/A'}
                    <br />
                    <span className="underline mt-2 block opacity-80 hover:opacity-100 cursor-pointer">Ver detalhes do plano ↗</span>
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {documentos?.length === 0 && (!planos || planos.length === 0) && (
                <div className="col-span-full py-12 text-center bg-surface-hover/50 rounded-xl border border-dashed border-border">
                  <FileText className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-text-secondary">Nenhum documento encontrado nesta categoria.</p>
                </div>
              )}

              {/* CARDS DE DOCUMENTOS */}
              {documentos?.map(doc => {
                const status = getStatusInfo(doc.dataValidade, doc.categoria);
                const isAst = doc.categoria === 'AST';
                const StatusIcon = status.icon;

                return (
                  <div 
                    key={doc.id} 
                    className={`
                      p-4 rounded-xl border shadow-card hover:shadow-float transition-all relative group
                      ${isAst 
                        ? 'bg-warning-500/5 border-warning-500/20 hover:border-warning-500/40' 
                        : 'bg-surface border-border hover:border-primary/30'}
                    `}
                  >
                    {/* Botão Deletar */}
                    {!somenteLeitura && (
                      <button
                        onClick={() => handleDeletar(doc.id, doc.titulo)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Excluir (Substituir)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${isAst ? 'bg-warning-500/10 text-warning-600' : 'bg-surface-hover text-text-secondary'}`}>
                        {isAst ? <FileWarning className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-text-main truncate pr-6" title={doc.titulo}>{doc.titulo}</h4>
                        <p className="text-xs text-text-secondary mb-3 truncate">{doc.descricao || 'Sem descrição'}</p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${isAst ? 'bg-warning-500/10 text-warning-700' : 'bg-surface-hover text-text-secondary border border-border'}`}>
                            {doc.categoria.replace('_', ' ')}
                          </span>

                          {/* Tags de Escopo */}
                          {doc.veiculoId ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                              PLACA
                            </span>
                          ) : doc.tipoVeiculo ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-info/10 text-info border border-info/20">
                              {doc.tipoVeiculo}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
                      <span className={`text-[10px] px-2 py-1 rounded border font-bold flex items-center gap-1.5 ${status.color}`}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {status.text}
                      </span>

                      <a
                        href={doc.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:text-primary-hover hover:underline flex items-center gap-1 transition-colors"
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