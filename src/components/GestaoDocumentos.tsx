import { useState } from 'react';
import { useDocumentosLegais, useDeleteDocumento } from '../hooks/useDocumentosLegais';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarDocumento } from './forms/FormCadastrarDocumento';
import { formatDateDisplay } from '../utils/dateUtils';
import { Button } from './ui/Button';
import { FileText, Wrench, ShieldCheck, AlertTriangle } from 'lucide-react';

interface GestaoDocumentosProps {
    veiculoId?: string; // Recebe o ID do veículo atual (opcional)
    somenteLeitura?: boolean; // Para operadores (esconde botão de deletar/criar)
}

export function GestaoDocumentos({ veiculoId, somenteLeitura = false }: GestaoDocumentosProps) {
    const [modoAdicionar, setModoAdicionar] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

    // 1. Busca Documentos
    const { data: documentos, isLoading } = useDocumentosLegais({
        categoria: filtroCategoria,
        veiculoId: veiculoId // Passa o ID para o backend filtrar (Global + Tipo + Específico)
    });

    // 2. Busca Plano de Manutenção (Se houver veículo selecionado)
    const { data: planos } = useQuery({
        queryKey: ['planos', veiculoId],
        queryFn: async () => {
            if (!veiculoId) return [];
            const res = await api.get(`/planos-manutencao?veiculoId=${veiculoId}`);
            return res.data;
        },
        enabled: !!veiculoId && filtroCategoria === 'TODOS' // Só busca na aba geral se tiver veículo
    });

    const { mutate: deletarDoc } = useDeleteDocumento();

    const handleDeletar = (id: string, titulo: string) => {
        if (confirm(`Ao "Alterar" um documento, o procedimento correto é excluir o antigo e cadastrar o novo.\n\nDeseja excluir "${titulo}" agora?`)) {
            deletarDoc(id);
        }
    };

    // Lógica visual de status (Licença Ambiental vs Outros)
    const getStatusInfo = (dataValidade?: string | null, categoria?: string) => {
        // CASO ESPECIAL: Licença Ambiental
        if (categoria === 'LICENCA_AMBIENTAL') {
            return {
                color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                text: 'Vigente (Permanente)',
                icon: <ShieldCheck className="w-3 h-3 mr-1" />
            };
        }

        if (!dataValidade) return { color: 'bg-gray-100 text-gray-600', text: 'Sem data', icon: null };

        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasParaVencer = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

        if (diasParaVencer < 0) return {
            color: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
            text: `Venceu em ${formatDateDisplay(dataValidade)}`,
            icon: <AlertTriangle className="w-3 h-3 mr-1" />
        };
        if (diasParaVencer < 30) return {
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            text: `Vence em ${diasParaVencer} dias`,
            icon: <AlertTriangle className="w-3 h-3 mr-1" />
        };

        return {
            color: 'bg-green-100 text-green-700 border-green-200',
            text: `Vence: ${formatDateDisplay(dataValidade)}`,
            icon: <ShieldCheck className="w-3 h-3 mr-1" />
        };
    };

    // --- CATEGORIAS ATUALIZADAS ---
    const categorias = [
        { id: 'TODOS', label: 'Todos' },
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Biblioteca Legal</h2>
                    <p className="text-sm text-gray-500">Documentos regulatórios, laudos e licenças.</p>
                </div>
                {/* Esconde botão de adicionar se for operador */}
                {!somenteLeitura && !modoAdicionar && (
                    <Button onClick={() => setModoAdicionar(true)} variant="primary">
                        + Novo Documento
                    </Button>
                )}
            </div>

            {modoAdicionar ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4">Arquivar Novo Documento</h3>
                    <FormCadastrarDocumento
                        onSuccess={() => setModoAdicionar(false)}
                        onCancel={() => setModoAdicionar(false)}
                    />
                </div>
            ) : (
                <>
                    {/* Filtros Rápidos */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {categorias.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFiltroCategoria(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filtroCategoria === cat.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white text-gray-500 border hover:bg-gray-50'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Lista de Documentos */}
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Carregando biblioteca...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* --- CARD ESPECIAL: PLANO DE MANUTENÇÃO (Aparece primeiro) --- */}
                            {planos && planos.length > 0 && filtroCategoria === 'TODOS' && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm relative group cursor-pointer hover:shadow-md transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Wrench className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Plano de Manutenção</h4>
                                            <p className="text-xs text-gray-500">Vigente para este veículo</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-blue-100 text-xs text-blue-700">
                                        <strong>Intervalo:</strong> A cada {planos[0].valorIntervalo} {planos[0].tipoIntervalo}
                                        <br />
                                        <strong>Próxima revisão:</strong> {planos[0].kmProximaManutencao ? `${planos[0].kmProximaManutencao} KM` : 'N/A'}
                                        <br />
                                        <span className="underline mt-2 block opacity-80 hover:opacity-100">Ver detalhes do plano ↗</span>
                                    </div>
                                </div>
                            )}

                            {documentos?.length === 0 && (!planos || planos.length === 0) && (
                                <div className="col-span-full py-10 text-center bg-gray-50 rounded-xl border border-dashed">
                                    <p className="text-gray-400">Nenhum documento encontrado.</p>
                                </div>
                            )}

                            {/* --- DOCUMENTOS PADRÃO (PDFs) --- */}
                            {documentos?.map(doc => {
                                const status = getStatusInfo(doc.dataValidade, doc.categoria);

                                return (
                                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">

                                        {/* Botão Deletar (Só para Admin/Gestor) */}
                                        {!somenteLeitura && (
                                            <button
                                                onClick={() => handleDeletar(doc.id, doc.titulo)}
                                                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Excluir (Substituir)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 text-xl">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-800 truncate" title={doc.titulo}>{doc.titulo}</h4>
                                                <p className="text-xs text-gray-500 mb-2 truncate">{doc.descricao || 'Sem descrição'}</p>

                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                                                        {doc.categoria.replace('_', ' ')}
                                                    </span>

                                                    {/* Tags Visuais: Específico vs Global vs Tipo */}
                                                    {doc.veiculoId ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                            PLACA
                                                        </span>
                                                    ) : doc.tipoVeiculo ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                            {doc.tipoVeiculo}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <span className={`text-[10px] px-2 py-1 rounded border font-bold flex items-center ${status.color}`}>
                                                {status.icon} {status.text}
                                            </span>

                                            <a
                                                href={doc.arquivoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                            >
                                                Visualizar ↗
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