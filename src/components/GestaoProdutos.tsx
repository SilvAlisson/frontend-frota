import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarProduto } from './forms/FormCadastrarProduto';
import { FormEditarProduto } from './forms/FormEditarProduto';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface Produto {
  id: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
}

// Ícones Minimalistas
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }

// Helper para Ícones e Cores por Tipo
const getTypeConfig = (tipo: string) => {
  switch (tipo) {
    case 'COMBUSTIVEL':
      return {
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /></svg>,
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-100'
      };
    case 'ADITIVO':
      return {
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H3.75Z" /></svg>,
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        border: 'border-cyan-100'
      };
    case 'SERVICO':
      return {
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" /></svg>,
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100'
      };
    default:
      return {
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
        bg: 'bg-background',
        text: 'text-gray-500',
        border: 'border-border'
      };
  }
};

export function GestaoProdutos() {

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string | null>(null);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleDelete = async (produtoId: string) => {
    if (!window.confirm("Tem certeza que quer REMOVER este produto?")) return;

    setDeletingId(produtoId);
    const promise = api.delete(`/produtos/${produtoId}`);

    toast.promise(promise, {
      loading: 'Removendo item...',
      success: () => {
        setProdutos(prev => prev.filter(p => p.id !== produtoId));
        setDeletingId(null);
        return 'Produto removido.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover produto.';
      }
    });
  };

  const handleSucesso = () => {
    setModo('listando');
    setProdutoIdSelecionado(null);
    fetchProdutos();
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setProdutoIdSelecionado(null);
  };

  const handleExportar = () => {
    if (produtos.length === 0) return;

    const promessaExport = new Promise((resolve, reject) => {
      try {
        const dadosFormatados = produtos.map(p => ({
          'Nome': p.nome,
          'Tipo': p.tipo,
          'Unidade de Medida': p.unidadeMedida,
        }));
        exportarParaExcel(dadosFormatados, "Lista_Produtos_Servicos.xlsx");
        resolve(true);
      } catch (err) { reject(err); }
    });

    toast.promise(promessaExport, {
      loading: 'Gerando Excel...',
      success: 'Planilha baixada com sucesso!',
      error: 'Erro ao exportar.'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* CABEÇALHO */}
      <div className="glass-panel p-1 rounded-xl sticky top-0 z-10 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-white/50 rounded-lg">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-2">
              Estoque & Serviços
            </h3>
            <p className="text-[10px] text-gray-400 pl-2 font-mono">
              {produtos.length} Itens Cadastrados
            </p>
          </div>

          {modo === 'listando' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                // [PADRONIZAÇÃO] border-gray-200 -> border-border
                className="shadow-sm bg-white border border-border h-9 text-xs"
                onClick={handleExportar}
                disabled={produtos.length === 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                }
              >
                Excel
              </Button>
              <Button
                variant="primary"
                onClick={() => setModo('adicionando')}
                className="shadow-md shadow-primary/20 h-9 text-xs"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
              >
                Novo Item
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* FORMULÁRIOS */}
      {modo === 'adicionando' && (
        // [PADRONIZAÇÃO] border-gray-100 -> border-border, shadow-float -> shadow-card
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-card border border-border max-w-xl mx-auto transform transition-all animate-in zoom-in-95 duration-200">
          <FormCadastrarProduto onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {modo === 'editando' && produtoIdSelecionado && (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-card border border-border max-w-xl mx-auto transform transition-all animate-in zoom-in-95 duration-200">
          <FormEditarProduto
            produtoId={produtoIdSelecionado}
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* LISTAGEM (GRID INDUSTRIAL) */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                // [PADRONIZAÇÃO] border-gray-100 -> border-border
                <div key={i} className="h-40 bg-white rounded-xl border border-border animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {produtos.map((produto) => {
                const style = getTypeConfig(produto.tipo);
                return (
                  // [PADRONIZAÇÃO] border-gray-100 -> border-border
                  <div key={produto.id} className="group bg-white p-5 rounded-xl shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col relative overflow-hidden">

                    <div className="flex justify-between items-start mb-3">
                      <div className={`h-12 w-12 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shadow-sm border ${style.border} transition-transform group-hover:scale-105`}>
                        {style.icon}
                      </div>

                      {/* Ações (Hover) */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => { setProdutoIdSelecionado(produto.id); setModo('editando'); }}
                          // [PADRONIZAÇÃO] hover:text-primary
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Editar"
                        >
                          <IconeEditar />
                        </button>
                        <button
                          onClick={() => handleDelete(produto.id)}
                          disabled={deletingId === produto.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir"
                        >
                          {deletingId === produto.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <IconeLixo />}
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 text-lg truncate mb-1" title={produto.nome}>
                      {produto.nome}
                    </h4>

                    <div className="mt-auto pt-2 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded font-bold tracking-wide border ${style.bg} ${style.text} ${style.border}`}>
                        {produto.tipo}
                      </span>

                      {/* [PADRONIZAÇÃO] bg-gray-50 -> bg-background, border-gray-100 -> border-border */}
                      <span className="text-gray-500 font-mono bg-background px-2 py-1 rounded border border-border">
                        {produto.unidadeMedida}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && produtos.length === 0 && (
            // [PADRONIZAÇÃO] border-gray-200 -> border-border
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-border text-center">
              {/* [PADRONIZAÇÃO] bg-gray-50 -> bg-background */}
              <div className="p-4 bg-background rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">Estoque Vazio</h4>
              <p className="text-gray-500 text-sm mt-1">Cadastre itens para usar em manutenções.</p>
              <Button
                variant="ghost"
                onClick={() => setModo('adicionando')}
                className="mt-4 text-primary hover:bg-primary/5"
              >
                Cadastrar Primeiro Item
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}